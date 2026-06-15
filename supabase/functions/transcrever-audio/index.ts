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

    // Etapa 3 — Transcrição via Whisper
    let texto = ''
    try {
      texto = await transcreverAudio(audioBytes, fichaId)
    } catch (err) {
      // Whisper falhou — aborta com 500 (upload já foi salvo)
      throw err
    }

    // Etapa 4 — Sugestão de tags (falha silenciosa)
    const tagsSugeridas = await sugerirTags(texto, supabase).catch(() => [])

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
