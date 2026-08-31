import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ACCEPTED_FORMATS = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/heif'])
const MAX_SIZE = 25 * 1024 * 1024 // 25MB (alinhado ao file_size_limit do bucket)
const DEFAULT_DDD = '44'
const OCR_MODEL = 'gpt-5.4'

// ============================================================
// PROMPT OCR
// ============================================================

const SYSTEM_MESSAGE = `Você é um leitor especializado em fichas de atendimento manuscritas da Flavio Pamplona Alfaiataria.
Retorne EXCLUSIVAMENTE um objeto JSON válido. Sem markdown, sem texto adicional, sem explicações.

Catálogo de referência:
- Tipo: "aluguel", "venda" ou "ajuste". "1º aluguel" mapeia para "aluguel".
- Paletó: modelo, tecido e tamanho conforme escrito.
- Calça: número ou tamanho. Atenção à anotação "do número".
- Camisa: cor, tecido e tamanho conforme escrito.
- Sapato: modelo e número conforme escrito.
- Valores: string numérica sem símbolo de moeda (ex: "350.00").
- Datas: formato YYYY-MM-DD.`

const USER_PROMPT = `Leia a ficha na imagem e extraia todos os campos visíveis.

Regras obrigatórias:
1. Datas: formato YYYY-MM-DD. Ano com 2 dígitos (ex: 26) → 2026. Nunca inverta a ordem DD/MM/AA.
2. Nome: nome completo sem abreviações, exatamente como escrito.
3. Telefone: normalize para 55xx9xxxxxxxx. Sem DDI → adicione 55. Sem nono dígito → adicione 9.
4. Tipo: exatamente "aluguel", "venda" ou "ajuste". "1º aluguel" → "aluguel".
5. Peças: capture a descrição e o valor da primeira linha de cada seção separadamente.
6. Valores: string numérica sem símbolos (ex: "350.00"). Separador decimal é ponto.
7. pago: true se houver carimbo ou marcação de pago no rodapé. false caso contrário.
8. Campos ilegíveis ou ausentes: null. Nunca invente valores.

Retorne JSON com exatamente este schema:
{
  "numero_ficha": string | null,
  "cliente_nome": string | null,
  "cliente_telefone": string | null,
  "tipo": "aluguel" | "venda" | "ajuste" | null,
  "data_retirada": string | null,
  "data_devolucao": string | null,
  "data_festa": string | null,
  "paleto": { "descricao": string | null, "valor": string | null } | null,
  "calca": { "descricao": string | null, "valor": string | null } | null,
  "camisa": { "descricao": string | null, "valor": string | null } | null,
  "sapato": { "descricao": string | null, "valor": string | null } | null,
  "valor_total": string | null,
  "garantia": string | null,
  "pago": boolean | null
}`

// ============================================================
// HELPERS — Normalização
// ============================================================

function normalizeTelefone(raw: unknown): string | null {
  if (!raw) return null
  let d = String(raw).replace(/\D+/g, '')
  if (!d) return null

  if (d.startsWith('55')) {
    const rest = d.slice(2)
    if (rest.length < 10) return null
    const ddd = rest.slice(0, 2)
    let local = rest.slice(2)
    if (local.length === 8) local = '9' + local
    if (local.length > 9) local = local.slice(-9)
    return `55${ddd}${local}`
  }

  if (d.length === 11) return `55${d}`

  if (d.length === 10) {
    const ddd = d.slice(0, 2)
    const local = '9' + d.slice(2)
    return `55${ddd}${local}`
  }

  if (d.length === 8) d = '9' + d
  if (d.length === 9) return `55${DEFAULT_DDD}${d}`

  return null
}

function pickTipo(value: unknown): string | null {
  if (!value) return null
  const v = String(value).toLowerCase().replace(/\s+/g, '')
  if (v === '1aluguel' || v === '1ºaluguel' || v === '1oaluguel') return 'aluguel'
  return ['aluguel', 'venda', 'ajuste'].includes(v) ? v : null
}

function parseValor(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const s = String(value).replace(/[^\d,\.]/g, '').replace(',', '.')
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

type Secao = { descricao?: unknown; valor?: unknown } | null | undefined

function parseOcrToDbFields(ocr: Record<string, unknown>) {
  const paleto = ocr.paleto as Secao
  const calca  = ocr.calca  as Secao
  const camisa = ocr.camisa as Secao
  const sapato = ocr.sapato as Secao

  return {
    codigo_ficha:     String(ocr.numero_ficha ?? '').trim() || null,
    nome_cliente:     String(ocr.cliente_nome ?? '').trim() || null,
    telefone_cliente: normalizeTelefone(ocr.cliente_telefone),
    tipo:             pickTipo(ocr.tipo),
    data_retirada:    (ocr.data_retirada  as string) || null,
    data_devolucao:   (ocr.data_devolucao as string) || null,
    data_festa:       (ocr.data_festa     as string) || null,
    paleto:           paleto?.descricao ? String(paleto.descricao).trim() : null,
    calca:            calca?.descricao  ? String(calca.descricao).trim()  : null,
    camisa:           camisa?.descricao ? String(camisa.descricao).trim() : null,
    sapato:           sapato?.descricao ? String(sapato.descricao).trim() : null,
    valor:            parseValor(ocr.valor_total),
    valor_paleto:     parseValor(paleto?.valor),
    valor_calca:      parseValor(calca?.valor),
    valor_camisa:     parseValor(camisa?.valor),
    garantia:         parseValor(ocr.garantia),
    pago:             typeof ocr.pago === 'boolean' ? ocr.pago : null,
  }
}

function imageToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 8192
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

// ============================================================
// OCR — Chat Completions com timeout
// ============================================================

async function callOpenAI(base64: string, mimeType: string): Promise<Record<string, unknown>> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OCR_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_MESSAGE },
        {
          role: 'user',
          content: [
            { type: 'text', text: USER_PROMPT },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(120_000),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenAI ${res.status}: ${body}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Resposta vazia da OpenAI')

  return JSON.parse(text)
}

// ============================================================
// BACKGROUND — Etapas 3 a 6
// ============================================================

async function processarBackground(
  supabase: ReturnType<typeof createClient>,
  fichaId: string,
  imageBytes: Uint8Array,
  mimeType: string,
  startTime: number,
) {
  let uploadOk = false
  let base64: string | null = null

  // Cadastro que a ficha já tinha ao nascer. Quando ela veio de uma atividade
  // do funil, `cliente_id`, `nome_cliente` e `telefone_cliente` são do cliente
  // do card — escolhidos por quem está atendendo, não lidos do papel. É a
  // leitura que sustenta a guarda da etapa 6. Serve também a checagem de
  // duplicata (etapa 5.5), que antes buscava a unidade por conta própria.
  const { data: fichaAtual } = await supabase
    .from('fichas')
    .select('unidade_id, cliente_id, nome_cliente, telefone_cliente')
    .eq('id', fichaId)
    .single()

  // Etapas 3 + 4 — Upload e base64 em paralelo
  const [uploadResult, base64Result] = await Promise.allSettled([
    // Etapa 3 — Upload no Storage
    (async () => {
      const { error } = await supabase.storage
        .from('fichas')
        .upload(`${fichaId}.jpg`, imageBytes, { contentType: mimeType, upsert: true })
      if (error) throw error
    })(),
    // Etapa 4 — Conversão base64
    Promise.resolve(imageToBase64(imageBytes)),
  ])

  if (uploadResult.status === 'fulfilled') {
    uploadOk = true
    await supabase.from('fichas').update({ url_bucket: `${fichaId}.jpg` }).eq('id', fichaId)
  }

  if (base64Result.status === 'rejected') {
    await supabase.from('fichas').update({
      status: 'erro',
      erro_etapa: 'conversao_base64',
    }).eq('id', fichaId)
    return
  }

  base64 = base64Result.value

  // Etapa 5 — OCR com retry
  let ocrResult: Record<string, unknown> | null = null

  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    await supabase.from('fichas').update({ ocr_tentativa: tentativa }).eq('id', fichaId)

    try {
      ocrResult = await callOpenAI(base64, mimeType)
      // Debug — guarda o JSON bruto exatamente como o OCR devolveu, antes de
      // qualquer parse/normalização e antes dos ajustes do vendedor. Falha
      // aqui nunca deve interromper o processamento da ficha.
      try {
        await supabase.from('fichas_ocr_log').insert({
          ficha_id: fichaId,
          raw: ocrResult,
          modelo: OCR_MODEL,
          tentativa,
        })
      } catch (logErr) {
        console.error('Falha ao gravar fichas_ocr_log', logErr)
      }
      break
    } catch {
      if (tentativa < 2) {
        await new Promise(r => setTimeout(r, 5_000))
      } else {
        await supabase.from('fichas').update({
          status: 'erro',
          erro_etapa: 'ocr',
        }).eq('id', fichaId)
        return
      }
    }
  }

  if (!ocrResult) return

  // Etapa 5.5 — Verificar numero_ficha duplicado (único POR UNIDADE, não global)
  const numeroFicha = String(ocrResult.numero_ficha ?? '').trim() || null
  if (numeroFicha) {
    // Unidade da ficha atual — a checagem de duplicata é restrita a ela.
    const unidadeAtual = fichaAtual?.unidade_id ?? null

    let dupSel = supabase
      .from('fichas')
      .select('id')
      .eq('codigo_ficha', numeroFicha)
      .neq('id', fichaId)
      .in('status', ['ativa', 'pendente'])
      .limit(1)
    if (unidadeAtual !== null) dupSel = dupSel.eq('unidade_id', unidadeAtual)
    const { data: fichasExistentes } = await dupSel

    const fichaExistente = fichasExistentes?.[0] ?? null

    if (fichaExistente) {
      // Ficha duplicada. Ela NÃO vai para 'erro' nem é apagada pelo front.
      //
      // 'inativa' é o estado de quem precisa existir sem ser vista. Duas razões:
      //   1. o front apagava esta linha, e o `oportunidade_id` dela ia junto —
      //      o card do funil ficava aberto para sempre, e sem rastro, porque o
      //      delete não passa por `excluir_ficha` e a FK de `fichas_ocr_log` é
      //      ON DELETE CASCADE (IGO-182);
      //   2. 'erro' é a caixa de entrada de problemas do vendedor (painel
      //      "Erros recentes"). Duplicata não pede ação dele: ele é levado para
      //      a ficha original e segue o atendimento.
      //
      // 'inativa' fica fora de tudo que importa por allowlist: faturamento,
      // vw_atendimentos, o gatilho de auto-ganha e o índice de código único. Ou
      // seja, o vínculo com a oportunidade sobrevive sem que a ficha duplicada
      // possa fechar o card.
      //
      // `codigo_ficha` vai a null de propósito, e não é a restrição que exige
      // isso (o índice único é parcial em ativa/pendente). É o reprocessamento:
      // ele devolve ficha para 'pendente', e aí o código colidiria com a
      // original. `ficha_original_id` guarda o caminho de volta, e a original
      // tem o código, então nada se perde.
      //
      // Limite conhecido: ficha 'inativa' não pode ser reprocessada (a etapa 2
      // só aceita 'erro'). Se o OCR inventou a duplicata lendo o código errado,
      // a recuperação é manual, pela gestão. Antes era pior: a linha sumia.
      await supabase.from('fichas').update({
        status: 'inativa',
        erro_etapa: 'ficha_duplicada',
        ficha_original_id: fichaExistente.id,
        codigo_ficha: null,
      }).eq('id', fichaId)
      return // não continua para o parse
    }
  }

  // Etapa 6 — Parse
  let dbFields: ReturnType<typeof parseOcrToDbFields>
  try {
    dbFields = parseOcrToDbFields(ocrResult)
  } catch {
    await supabase.from('fichas').update({
      status: 'erro',
      erro_etapa: 'parse',
    }).eq('id', fichaId)
    return
  }

  // Etapa 6 — Ficha nascida de um card não deixa o OCR mexer no cadastro.
  // Nome e telefone vieram do cliente da oportunidade; a letra da ficha de
  // papel é a fonte MENOS confiável que existe para telefone. Deixar o OCR
  // sobrescrever custaria caro nos dois sentidos: lendo null, apagaria o
  // telefone — e o save seguinte devolveria `cliente_id` a null, deixando o
  // card aberto para sempre; lendo um dígito errado, o `criar-cliente` da tela
  // de edição atualizaria o cliente REAL do card com o número errado, porque
  // para ficha já vinculada ele faz update por id. O vendedor continua podendo
  // corrigir os dois campos na tela antes de salvar (a ficha ainda é
  // 'pendente', então o bloqueio de troca de telefone não vale ainda).
  if (fichaAtual?.cliente_id) {
    dbFields.nome_cliente =
      (fichaAtual.nome_cliente as string | null) ?? dbFields.nome_cliente
    dbFields.telefone_cliente =
      (fichaAtual.telefone_cliente as string | null) ?? dbFields.telefone_cliente
  }

  // Etapa 6 — Busca cliente por telefone.
  // Só faz sentido para ficha órfã: se ela já nasceu com dono (veio de um
  // card), sugerir outro cliente lido do papel é convite ao duplicado — que é
  // exatamente o que o vínculo com a oportunidade veio resolver.
  let clienteEncontrado = false
  let clienteSugeridoId: string | null = null
  let clienteSugeridoNome: string | null = null

  if (!fichaAtual?.cliente_id && dbFields.telefone_cliente) {
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id, nome')
      .eq('telefone', dbFields.telefone_cliente)
      .maybeSingle()

    if (cliente) {
      clienteEncontrado = true
      clienteSugeridoId = cliente.id
      clienteSugeridoNome = cliente.nome
    }
  }

  // Retry upload se etapa 3 falhou
  if (!uploadOk) {
    const { error } = await supabase.storage
      .from('fichas')
      .upload(`${fichaId}.jpg`, imageBytes, { contentType: mimeType, upsert: true })
    if (!error) uploadOk = true
  }

  const tempoProcessamento = Math.round((Date.now() - startTime) / 1000)

  // Etapa 6 — Atualiza ficha com todos os dados OCR.
  // Se o upload da imagem falhou (ex.: erro de Storage), sinaliza erro_etapa='upload'
  // MANTENDO status='pendente' — o OCR funcionou e os dados são válidos; a ficha
  // não é bloqueada, apenas avisada no cabeçalho (front). Em caso de sucesso,
  // limpa erro_etapa (importante no reprocessamento).
  await supabase.from('fichas').update({
    ...dbFields,
    ...(uploadOk
      ? { url_bucket: `${fichaId}.jpg`, erro_etapa: null }
      : { erro_etapa: 'upload' }),
    cliente_encontrado: clienteEncontrado,
    cliente_sugerido_id: clienteSugeridoId,
    cliente_sugerido_nome: clienteSugeridoNome,
    tempo_processamento: tempoProcessamento,
    status: 'pendente',
  }).eq('id', fichaId)
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const startTime = Date.now()

  try {
    // Etapa 1 — Validação
    const formData = await req.formData()
    const imageFile        = formData.get('image')    as File   | null
    const userId           = formData.get('user_id')  as string | null
    const fichaIdReprocess = formData.get('ficha_id') as string | null
    // Card do funil, quando a foto foi tirada de dentro de uma atividade: a
    // ficha nasce ligada à oportunidade e o gatilho fecha o card ao promovê-la.
    const oportunidadeId   = formData.get('oportunidade_id') as string | null
    // ...e ligada ao CLIENTE do card, que era o pedaço que faltava. Sem isto o
    // dono da ficha só aparecia no fim, resolvido pelo telefone que o OCR
    // conseguisse ler do papel — e telefone que não casa faz o `criar-cliente`
    // abrir um cliente novo, deixando a ficha do cliente errado enquanto o card
    // fecha certo pelo vínculo explícito. Foi o bug de 24/08. Quem lança de
    // dentro da atividade já sabe de quem é a ficha; o papel não precisa contar.
    const clienteId        = formData.get('cliente_id')       as string | null
    const clienteNome      = formData.get('cliente_nome')     as string | null
    const clienteTelefone  = formData.get('cliente_telefone') as string | null
    // Loja do card. Ausente, vale a do perfil de quem tirou a foto, como sempre.
    const unidadeIdCard    = formData.get('unidade_id')       as string | null

    if (!userId)                                        return json({ error: 'unauthorized' }, 401)
    if (!imageFile)                                     return json({ error: 'image_required' }, 400)
    if (!ACCEPTED_FORMATS.has(imageFile.type))          return json({ error: 'invalid_format' }, 400)
    if (imageFile.size > MAX_SIZE)                      return json({ error: 'file_too_large' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let fichaId: string

    // Etapa 2 — Criação ou atualização da ficha
    if (fichaIdReprocess) {
      const { data: ficha, error } = await supabase
        .from('fichas')
        .select('id, status')
        .eq('id', fichaIdReprocess)
        .single()

      if (error || !ficha) return json({ error: 'ficha não encontrada' }, 400)
      if (ficha.status !== 'erro') return json({ error: 'invalid_status_for_reprocess' }, 400)

      await supabase.from('fichas').update({
        status: 'pendente',
        ocr_tentativa: null,
        cliente_encontrado: null,
        cliente_sugerido_id: null,
        cliente_sugerido_nome: null,
      }).eq('id', fichaIdReprocess)

      fichaId = fichaIdReprocess

    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('unidade_id')
        .eq('id', userId)
        .single()

      const unidadeDoCard = unidadeIdCard ? Number(unidadeIdCard) : NaN

      const { data: ficha, error } = await supabase
        .from('fichas')
        .insert({
          vendedor_id: userId,
          status: 'pendente',
          unidade_id: Number.isFinite(unidadeDoCard) ? unidadeDoCard : profile?.unidade_id,
          oportunidade_id: oportunidadeId,
          // A ficha nasce com dono. O OCR preenche o resto por cima; estes três
          // ele não encosta — ver a guarda da etapa 6 em processarBackground().
          cliente_id: clienteId,
          nome_cliente: clienteNome,
          telefone_cliente: clienteTelefone,
        })
        .select('id')
        .single()

      if (error || !ficha) return json({ error: 'Falha ao criar ficha' }, 500)

      fichaId = ficha.id
    }

    // Lê bytes antes do retorno (File não pode ser lido após a resposta)
    const imageBytes = new Uint8Array(await imageFile.arrayBuffer())

    EdgeRuntime.waitUntil(
      processarBackground(supabase, fichaId, imageBytes, imageFile.type, startTime)
    )

    return json({ ficha_id: fichaId })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return json({ error: message }, 500)
  }
})
