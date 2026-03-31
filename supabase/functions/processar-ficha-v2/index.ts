import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Funções utilitárias ───────────────────────────────────────────────────────

function capitalizarNome(nome?: string): string {
  if (!nome) return ''
  return nome.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function onlyDefined(obj: any): any {
  if (obj == null) return null
  if (typeof obj !== 'object') return obj

  const out: any = Array.isArray(obj) ? [] : {}

  for (const [k, v] of Object.entries(obj)) {
    const val = typeof v === 'object' && v !== null ? onlyDefined(v) : v
    const keep =
      val !== null &&
      val !== undefined &&
      !(typeof val === 'string' && val.trim() === '') &&
      !(typeof val === 'object' && val !== null && Object.keys(val).length === 0)

    if (keep) {
      if (Array.isArray(out)) out.push(val)
      else out[k] = val
    }
  }

  if (!Array.isArray(out) && Object.keys(out).length === 0) return null
  if (Array.isArray(out) && out.length === 0) return null
  return out
}

function toISO(s: any): string | null {
  if (!s) return null
  const txt = String(s).trim()

  let m = txt.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`

  m = txt.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (m) {
    const d = m[1].padStart(2, '0')
    const mo = m[2].padStart(2, '0')
    let y = m[3]
    if (y.length === 2) {
      const n = parseInt(y, 10)
      y = (n < 50 ? 2000 + n : 1900 + n).toString()
    }
    return `${y}-${mo}-${d}`
  }

  m = txt.match(/^(\d{1,2})[\/\-](\d{1,2})$/)
  if (m) {
    const y = new Date().getFullYear()
    return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }

  return null
}

const DEFAULT_DDD = '44'

function normalizeBRPhone(raw: any): string | null {
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

  if (d.length === 11) {
    const ddd = d.slice(0, 2)
    const local = d.slice(2)
    if (local.length !== 9) return null
    return `55${ddd}${local}`
  }

  if (d.length === 10) {
    const ddd = d.slice(0, 2)
    let local = d.slice(2)
    if (local.length === 8) local = '9' + local
    return `55${ddd}${local}`
  }

  if (d.length === 8) d = '9' + d
  if (d.length === 9) return `55${DEFAULT_DDD}${d}`

  return null
}

function splitDescricaoValor(s: any): { descricao: string | null; valor: string | null } {
  if (!s) return { descricao: null, valor: null }
  const txt = String(s).trim()
  const m = txt.match(/\s(\d{1,3}(?:\.\d{3})*,\d{2}|\d+(?:[.,]\d{2})?)\s*$/)
  if (m) {
    const valor = m[1]
    const descricao = txt.slice(0, txt.length - m[0].length).trim()
    return { descricao: descricao || null, valor }
  }
  return { descricao: txt || null, valor: null }
}

function pickTipo(value: any): string | null {
  if (!value) return null

  if (typeof value === 'string') {
    const v = value.toLowerCase().replace(/\s+/g, '')
    if (v === '1aluguel' || v === '1ºaluguel' || v === '1oaluguel') return 'aluguel'
    return ['aluguel', 'venda', 'ajuste'].includes(v) ? v : null
  }

  if (Array.isArray(value) && value.length) {
    const v = String(value[0]).toLowerCase().replace(/\s+/g, '')
    if (v === '1aluguel' || v === '1ºaluguel' || v === '1oaluguel') return 'aluguel'
    return ['aluguel', 'venda', 'ajuste'].includes(v) ? v : null
  }

  return null
}

function normSecao(sec: any): { descricao: string | null; valor: string | null } | null {
  if (!sec) return null

  if (typeof sec === 'string') {
    return splitDescricaoValor(sec)
  }

  if (typeof sec === 'object') {
    const desc = sec.descricao ?? sec.descritivo ?? sec.text ?? ''
    const val = sec.valor ?? null
    const { descricao, valor } = splitDescricaoValor(desc || '')
    const obj = { descricao: descricao || null, valor: val ?? valor ?? null }
    return onlyDefined(obj)
  }

  return null
}

// ── Parser da resposta OpenAI ─────────────────────────────────────────────────

function safeParseGPT(raw: any): any {
  // Chat Completions format: choices[0].message.content
  const chatContent = raw?.choices?.[0]?.message?.content
  if (chatContent) {
    return typeof chatContent === 'string' ? JSON.parse(chatContent) : chatContent
  }

  // Fallback: já veio como objeto parseado
  const root = Array.isArray(raw) ? raw[0] : raw
  if (root && typeof root === 'object' && 'numero_ficha' in root) return root

  throw new Error('Formato de resposta do GPT não reconhecido.')
}

function buildDescricaoPaleto(paleto: any): string | null {
  if (!paleto) return null
  const parts = [
    paleto.modelo,
    paleto.cor_especifica || paleto.cor_base,
    paleto.detalhe,
    paleto.tamanho ? `T${paleto.tamanho}` : null,
  ]
  return parts.filter(Boolean).join(' ') || null
}

function buildDescricaoCamisa(camisa: any): string | null {
  if (!camisa) return null
  const parts = [
    camisa.tecido,
    camisa.cor,
    camisa.estampa,
    camisa.punho,
    camisa.tamanho ? `T${camisa.tamanho}` : null,
  ]
  return parts.filter(Boolean).join(' ') || null
}

function buildDescricaoSapato(sapato: any): string | null {
  if (!sapato) return null
  const parts = [
    sapato.modelo,
    sapato.cor,
    sapato.tamanho ? `N${sapato.tamanho}` : null,
  ]
  return parts.filter(Boolean).join(' ') || null
}

function buildDescricaoCalca(calca: any, paleto: any): string | null {
  if (!calca) return null
  const tamanho = calca.tamanho ?? paleto?.tamanho ?? null
  return tamanho ? `T${tamanho}` : null
}

function parseGptPayload(payloadJson: any): any {
  const p = safeParseGPT(payloadJson)

  const numero_ficha = String(p.numero_ficha ?? '').trim()
  const cliente_nome = String(p.cliente_nome ?? '').trim()

  const telNorm = normalizeBRPhone(p.cliente_telefone ?? null)
  const cliente_telefone = telNorm ?? String(p.cliente_telefone ?? '').replace(/\D+/g, '')

  return {
    numero_ficha,
    cliente_nome,
    cliente_telefone,
    tipo: pickTipo(p.tipo),
    data_retirada: toISO(p.data_retirada),
    data_devolucao: toISO(p.data_devolucao),
    data_festa: toISO(p.data_festa),
    paleto: {
      descricao: buildDescricaoPaleto(p.paleto),
      valor: p.paleto?.valor ?? null,
    },
    calca: {
      descricao: buildDescricaoCalca(p.calca, p.paleto),
      valor: p.calca?.valor ?? null,
    },
    camisa: {
      descricao: buildDescricaoCamisa(p.camisa),
      valor: p.camisa?.valor ?? null,
    },
    sapato: {
      descricao: buildDescricaoSapato(p.sapato),
      valor: null,
    },
    valor_total: p.valor_total ?? null,
    garantia: p.garantia ?? null,
    pago: typeof p.pago === 'boolean' ? p.pago : null,
  }
}

// ── Chamada OpenAI ────────────────────────────────────────────────────────────

const CATALOGO_CONTEXTO = `{
  "instrucao_geral": "Você é um assistente especializado em identificar peças de vestuário masculino de alfaiataria a partir de fichas manuscritas. Analise a imagem da ficha e extraia os campos abaixo com precisão. Use EXATAMENTE os valores listados nas opções de cada campo. Se não conseguir identificar um campo, retorne null.",
  "paleto": {
    "instrucao": "Identifique o paletó/terno. Combine modelo, cor e detalhe com as opções abaixo.",
    "opcoes_linha": ["Italiano", "Premium"],
    "opcoes_modelo": ["Canônico","s'120","Reda Flexo","Reda s'130","Canônico s'150","Linho Belga","Linho com Algodão","Pietro di Mosso","Tech","Summer","PV"],
    "opcoes_cor_base": ["Azul","Cinza","Preto","Bege","Marrom","Branco","Verde"],
    "opcoes_cor_especifica": ["Azul Marinho","Azul Noite","Azul Médio","Azul Claro","Azul Claro Barreto","Azul Claro Roberto Carlos","Cinza Chumbo","Cinza Médio","Cinza Claro","Bege Claro","Bege Caqui","Bege Médio","Preto","Preto Azulado","Verde Escuro","Summer"],
    "opcoes_detalhe": ["Liso","T.A.","P.G.","W.P.","P.G. + W.P.","D.B.","M.P.","Moleton","Full Canva","Liso c/ elastano","Liso Paramount"],
    "opcoes_tamanho": [44,46,48,50,52,54,56,58,60,62,64]
  },
  "calca": {
    "instrucao": "A calça geralmente faz parte do mesmo conjunto do paletó. O tamanho da calça pode ser DIFERENTE do paletó — ex: 'do 56' significa tamanho 56. Capture o tamanho separadamente.",
    "opcoes_tamanho": [44,46,48,50,52,54,56,58,60,62,64]
  },
  "camisa": {
    "instrucao": "Identifique a camisa pelo tecido (fio), cor, estampa e tipo de punho.",
    "opcoes_tecido": ["Fio 70","Fio 80","Fio 100","Fio 120","Fio 140","Stretch"],
    "opcoes_cor": ["Branca","Azul Clara","Azul Marinho","Cinza","Preta"],
    "opcoes_estampa": ["Lisa","Listra Fina"],
    "opcoes_punho": ["Punho Simples","Punho Duplo"],
    "opcoes_tamanho": [37,38,39,40,41,42,43,44,45,46,47]
  },
  "sapato": {
    "instrucao": "Identifique o sapato pelo modelo e cor.",
    "opcoes_modelo": ["Oxford","Oxford Wholecut","Derby","Derby Canadian Tratorado","Brogue","Austerity Brogue","Penny Loafer","Penny Loafer Genebra","Tassel Loafer Capri","Loafer Prada","Bota Chelsea","Tênis","Tênis Suede","Slip Couro","Slip Suede","Milano Suede","Calfanil","Cervo","Mocassim Tratorado","SI","Summer Walk"],
    "opcoes_cor": ["Preto","Whisky","Conhaque","Moca","Burgundy","Café","Marrom","Havana","Moss","Coelho","Branco","Branco c/ Marrom","Azul","Cinza","Marinho"],
    "opcoes_tamanho": [37,38,39,40,41,42,43,44]
  }
}`

const SYSTEM_MESSAGE = `Você é um assistente especializado em identificar peças de vestuário masculino de alfaiataria a partir de fichas manuscritas.

Contexto do catálogo e instruções de identificação de peças:
<contexto>
${CATALOGO_CONTEXTO}
</contexto>

Além das peças, extraia também os campos do cabeçalho: numero_ficha, cliente_nome, cliente_telefone, tipo (aluguel/venda/ajuste), datas no formato YYYY-MM-DD (data_retirada, data_devolucao, data_festa), valor de cada peça (paleto.valor, calca.valor, camisa.valor), valor_total, garantia e pago (boolean).

Retorne APENAS um JSON válido, sem texto adicional, sem markdown.`

const USER_PROMPT = `Leia esta ficha e extraia todos os campos conforme as instruções.

Regras para o cabeçalho:
(1) Datas: use exatamente os números da ficha no formato YYYY-MM-DD. Se o ano tiver 2 dígitos (ex: 26), converta para 2026. Nunca inverta a ordem DD/MM/AA. Se ilegível, retorne null.
(2) Nome: COMPLETO, exatamente como impresso, sem abreviações.
(3) Telefone: normalize para 55xx9xxxxxxxx. Se não tiver DDI, prefixe com 55 e garanta o dígito 9.
(4) Tipo: exatamente aluguel, venda ou ajuste.
(5) Rodapé: extraia valor_total e garantia como string numérica. O carimbo de pago pode estar de cabeça para baixo — responda como boolean.

Regras para as peças:
(6) Use EXATAMENTE as opções do catálogo para cada campo. Se não identificar, use null.
(7) Se houver valor ao final da linha de cada peça, capture em paleto.valor, calca.valor, camisa.valor.`

async function chamarOpenAI(file: File): Promise<any> {
  const buffer = await file.arrayBuffer()
  const uint8 = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i])
  }
  const base64 = btoa(binary)

  const mimeType = file.type || 'image/jpeg'

  const body = {
    model: 'gpt-5.4',
    messages: [
      {
        role: 'system',
        content: SYSTEM_MESSAGE,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
          {
            type: 'text',
            text: USER_PROMPT,
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI retornou status ${response.status}: ${errorText}`)
  }

  return response.json()
}

// ── Processamento em background ───────────────────────────────────────────────

async function processarFichaEmBackground(
  supabaseClient: any,
  fichaId: string,
  file: File
) {
  const inicioBackground = Date.now()

  try {
    console.log('Iniciando background para ficha:', fichaId)

    // 2. Upload da imagem
    const fileName = `${fichaId}_${Date.now()}.${file.name.split('.').pop()}`
    const { error: uploadError } = await supabaseClient.storage
      .from('fichas')
      .upload(fileName, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError)
      await supabaseClient.from('fichas').update({ status: 'erro' }).eq('id', fichaId)
      return
    }

    console.log('Upload concluído:', fileName)

    await supabaseClient
      .from('log_processo_ficha')
      .update({ upload_concluido: new Date().toISOString() })
      .eq('ficha_id', fichaId)

    // 5. Chama OpenAI
    await supabaseClient
      .from('log_processo_ficha')
      .update({ webhook_enviado: new Date().toISOString() })
      .eq('ficha_id', fichaId)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000)

    let openaiData: any
    try {
      openaiData = await chamarOpenAI(file)
      clearTimeout(timeoutId)
    } catch (err) {
      clearTimeout(timeoutId)
      throw err
    }

    console.log('Resposta da OpenAI recebida')

    await supabaseClient
      .from('log_processo_ficha')
      .update({ webhook_resposta: new Date().toISOString() })
      .eq('ficha_id', fichaId)

    const p = parseGptPayload(openaiData)
    console.log('Payload parseado:', JSON.stringify(p, null, 2))

    const { data: publicUrlData } = supabaseClient.storage
      .from('fichas')
      .getPublicUrl(fileName)

    const updateData: any = {
      updated_at: new Date().toISOString(),
      url_bucket: publicUrlData.publicUrl,
    }
    const camposIgnorados: string[] = []

    if (p.numero_ficha) updateData.codigo_ficha = p.numero_ficha
    else camposIgnorados.push('codigo_ficha')

    if (p.cliente_nome) updateData.nome_cliente = capitalizarNome(p.cliente_nome)
    else camposIgnorados.push('nome_cliente')

    if (p.cliente_telefone) updateData.telefone_cliente = p.cliente_telefone
    else camposIgnorados.push('telefone_cliente')

    if (p.tipo) {
      updateData.tipo = p.tipo.charAt(0).toUpperCase() + p.tipo.slice(1)
    } else camposIgnorados.push('tipo')

    if (p.data_retirada) updateData.data_retirada = p.data_retirada
    else camposIgnorados.push('data_retirada')

    if (p.data_devolucao) updateData.data_devolucao = p.data_devolucao
    else camposIgnorados.push('data_devolucao')

    if (p.data_festa) updateData.data_festa = p.data_festa
    else camposIgnorados.push('data_festa')

    if (p.paleto?.descricao) updateData.paleto = capitalizarNome(p.paleto.descricao)
    else camposIgnorados.push('paleto')

    if (p.paleto?.valor) {
      const v = parseFloat(String(p.paleto.valor).replace(',', '.'))
      if (!isNaN(v)) updateData.valor_paleto = v
    }

    if (p.calca?.descricao) updateData.calca = capitalizarNome(p.calca.descricao)
    else camposIgnorados.push('calca')

    if (p.calca?.valor) {
      const v = parseFloat(String(p.calca.valor).replace(',', '.'))
      if (!isNaN(v)) updateData.valor_calca = v
    }

    if (p.camisa?.descricao) updateData.camisa = capitalizarNome(p.camisa.descricao)
    else camposIgnorados.push('camisa')

    if (p.camisa?.valor) {
      const v = parseFloat(String(p.camisa.valor).replace(',', '.'))
      if (!isNaN(v)) updateData.valor_camisa = v
    }

    if (p.sapato?.descricao) updateData.sapato = p.sapato.descricao
    else camposIgnorados.push('sapato')

    if (p.valor_total != null && p.valor_total !== '') {
      const v = parseFloat(String(p.valor_total).replace(',', '.'))
      if (!isNaN(v)) updateData.valor = v
      else camposIgnorados.push('valor (inválido)')
    } else camposIgnorados.push('valor')

    if (p.garantia != null && p.garantia !== '') {
      const v = parseFloat(String(p.garantia).replace(',', '.'))
      if (!isNaN(v)) updateData.garantia = v
      else camposIgnorados.push('garantia (inválido)')
    } else camposIgnorados.push('garantia')

    if (p.pago !== null && p.pago !== undefined) updateData.pago = p.pago

    if (camposIgnorados.length > 0) {
      console.log('Campos ignorados (null/vazio):', camposIgnorados.join(', '))
    }

    const temDadosEssenciais = updateData.codigo_ficha || updateData.nome_cliente
    if (!temDadosEssenciais) {
      console.error('ERRO: OpenAI não retornou dados essenciais (codigo_ficha ou nome_cliente)')
      await supabaseClient.from('fichas').update({ status: 'erro' }).eq('id', fichaId)
      return
    }

    updateData.status = 'pendente'
    updateData.tempo_processamento = Math.round((Date.now() - inicioBackground) / 1000)
    console.log('Dados finais para atualização:', JSON.stringify(updateData, null, 2))

    const { error: updateError } = await supabaseClient
      .from('fichas')
      .update(updateData)
      .eq('id', fichaId)

    if (updateError) throw updateError

    console.log('Ficha atualizada com sucesso!')

    await supabaseClient
      .from('log_processo_ficha')
      .update({ ficha_processada: new Date().toISOString() })
      .eq('ficha_id', fichaId)

  } catch (error) {
    console.error('Erro no processamento em background:', error)
    await supabaseClient.from('fichas').update({ status: 'erro' }).eq('id', fichaId)
  }
}

// ── Handler principal ─────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const formData = await req.formData()
    const file = formData.get('image') as File
    const userId = formData.get('user_id') as string

    if (!file) {
      throw new Error('Nenhuma imagem foi enviada')
    }

    console.log('Recebido arquivo:', file.name, file.type, file.size)

    // 1. Cria a ficha
    const { data: ficha, error: fichaError } = await supabaseClient
      .from('fichas')
      .insert({
        status: 'pendente',
        vendedor_id: userId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (fichaError) {
      console.error('Erro ao criar ficha:', fichaError)
      throw fichaError
    }

    console.log('Ficha criada:', ficha.id)

    const agora = new Date().toISOString()
    await supabaseClient.from('log_processo_ficha').insert({
      ficha_id: ficha.id,
      edge_function_inicio: agora,
      ficha_criada: agora,
    })

    // 4. Retorna imediatamente — upload e OCR acontecem em background
    console.log('Ficha criada. Retornando ficha_id imediatamente:', ficha.id)

    // 2→3→5. Upload + url_bucket + OpenAI em background
    // waitUntil mantém o runtime vivo até o background concluir
    EdgeRuntime.waitUntil(
      processarFichaEmBackground(supabaseClient, ficha.id, file).catch((err) =>
        console.error('Erro no background task:', err)
      )
    )

    return new Response(
      JSON.stringify({ success: true, ficha_id: ficha.id, message: 'Ficha criada com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Erro na edge function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
