import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// --------------------------------------------------------
// Etapa 3 — Transcrição via OpenAI Whisper
// --------------------------------------------------------
async function transcreverAudio(audioBytes: Uint8Array, fichaId: string): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')!

  const form = new FormData()
  form.append('file', new Blob([audioBytes], { type: 'audio/webm' }), `${fichaId}.webm`)
  form.append('model', 'whisper-1')
  form.append('language', 'pt')
  form.append('response_format', 'text')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Whisper ${res.status}: ${body}`)
  }

  return (await res.text()).trim()
}

// --------------------------------------------------------
// Etapa 4 — Sugestão de tags via AI Agent
// --------------------------------------------------------
async function sugerirTags(
  texto: string,
  supabase: ReturnType<typeof createClient>,
): Promise<string[]> {
  if (!texto) return []

  const apiKey = Deno.env.get('OPENAI_API_KEY')!

  // Busca todas as tags disponíveis no banco
  const { data: tags } = await supabase.from('tags').select('id, nome')
  if (!tags || tags.length === 0) return []

  const listaTags = tags.map((t: { id: string; nome: string }) => `${t.id} — ${t.nome}`).join('\n')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `Você analisa descrições de clientes de uma alfaiataria e sugere tags relevantes.
Retorne EXCLUSIVAMENTE um array JSON com os UUIDs das tags aplicáveis. Ex: ["uuid1", "uuid2"]
Se nenhuma tag se aplicar, retorne [].

Tags disponíveis:
${listaTags}`,
        },
        {
          role: 'user',
          content: `Descrição do cliente: "${texto}"`,
        },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) return [] // Falha em tags não é crítica

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) return []

  try {
    const parsed = JSON.parse(content)
    // Aceita { tags: [...] } ou array direto
    const ids: unknown[] = Array.isArray(parsed) ? parsed : (parsed.tags ?? [])
    // Filtra apenas UUIDs que existem de fato no banco
    const validIds = new Set(tags.map((t: { id: string }) => t.id))
    return ids.filter((id): id is string => typeof id === 'string' && validIds.has(id))
  } catch {
    return []
  }
}

// --------------------------------------------------------
// MODO DEMONSTRAÇÃO
// --------------------------------------------------------
// Ficha em unidade de demonstração não chama a OpenAI, nem no Whisper nem na
// sugestão de tags. O áudio continua subindo para o bucket e `url_audio` continua
// sendo gravada: o apresentador grava a própria voz e aperta play, e é isso que
// vende a funcionalidade.
//
// O texto é sorteado por hash do id da ficha, não por random(), para o ensaio
// produzir o mesmo resultado da apresentação.
//
// Whisper real leva de 2 a 4 segundos num áudio curto. O mock dorme nessa faixa,
// pelo mesmo motivo do OCR: resposta instantânea não parece transcrição.

const TRANSCRICOES_DEMO = [
  'Cliente prefere corte mais justo no paletó. Vai precisar ajustar a manga, casamento é dia doze.',
  'Ele gostou do tecido mais leve, disse que passa o dia inteiro de terno. Sugerir lã fria na próxima.',
  'Noivo veio com a mãe, ela decide. Orçamento apertado, focar no aluguel e não na venda.',
  'Já é cliente antigo, comprou dois ternos no ano passado. Trazer as medidas anteriores.',
  'Pediu para avisar quando chegar tecido azul marinho. Deixou o WhatsApp para contato.',
  'Prova marcada, cliente pediu para ajustar a barra da calça em dois dedos.',
  'Cliente alto, ombro largo, o padrão não serviu bem. Vale sugerir sob medida.',
  'Evento corporativo, vai levar mais três colegas. Perguntar sobre desconto para grupo.',
]

function hashDemo(texto: string): number {
  let h = 0
  for (let i = 0; i < texto.length; i++) {
    h = (h * 31 + texto.charCodeAt(i)) >>> 0
  }
  return h
}

/** Tags REAIS e globais, para o front não descartar id inventado em silêncio. */
async function tagsDemonstracao(
  supabase: ReturnType<typeof createClient>,
  fichaId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from('tags')
    .select('id')
    .is('unidade_id', null)
    .eq('ativa', true)
    .order('nome')
    .limit(20)

  if (!data || data.length === 0) return []

  const h = hashDemo(fichaId)
  const escolhidas = [
    (data[h % data.length] as { id: string }).id,
    (data[(h >>> 5) % data.length] as { id: string }).id,
  ]
  return [...new Set(escolhidas)]
}

// --------------------------------------------------------
// HANDLER PRINCIPAL
// --------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Etapa 1 — Validação
    const formData = await req.formData()
    const audioFile = formData.get('audio')   as File   | null
    const fichaId   = formData.get('ficha_id') as string | null

    if (!audioFile) return json({ error: 'audio_required' }, 400)
    if (!fichaId)   return json({ error: 'ficha_id_required' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const audioBytes = new Uint8Array(await audioFile.arrayBuffer())

    // Etapa 2 — Upload no Storage + atualiza url_audio na ficha
    const path = `${fichaId}.webm`

    const { error: uploadError } = await supabase.storage
      .from('audios')
      .upload(path, audioBytes, { contentType: 'audio/webm', upsert: true })

    if (uploadError) throw new Error(`Falha no upload do áudio: ${uploadError.message}`)

    await supabase.from('fichas').update({ url_audio: path }).eq('id', fichaId)

    // Mundo da ficha, derivado da UNIDADE e no servidor. Esta função roda com
    // service role, onde `auth.uid()` é NULL, então o banco não decide por ela.
    const { data: fichaDaVez } = await supabase
      .from('fichas')
      .select('unidade_id')
      .eq('id', fichaId)
      .maybeSingle()

    let mundoDemo = false
    if (fichaDaVez?.unidade_id != null) {
      const { data: unidadeDaFicha } = await supabase
        .from('unidades')
        .select('is_demo')
        .eq('id', fichaDaVez.unidade_id)
        .maybeSingle()
      mundoDemo = unidadeDaFicha?.is_demo === true
    }

    // Etapa 3 — Transcrição via Whisper (ou enlatada, em demonstração)
    let texto = ''
    if (mundoDemo) {
      await new Promise(r => setTimeout(r, 2000 + (hashDemo(fichaId) % 2000)))
      texto = TRANSCRICOES_DEMO[hashDemo(fichaId) % TRANSCRICOES_DEMO.length]
    } else {
      try {
        texto = await transcreverAudio(audioBytes, fichaId)
      } catch (err) {
        // Whisper falhou — aborta com 500 (upload já foi salvo)
        throw err
      }
    }

    // Etapa 4 — Sugestão de tags (falha silenciosa)
    const tagsSugeridas = mundoDemo
      ? await tagsDemonstracao(supabase, fichaId).catch(() => [])
      : await sugerirTags(texto, supabase).catch(() => [])

    // Atualiza transcricao_audio na ficha
    await supabase
      .from('fichas')
      .update({ transcricao_audio: texto })
      .eq('id', fichaId)

    return json({ text: texto, tags: tagsSugeridas })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return json({ error: message }, 500)
  }
})
