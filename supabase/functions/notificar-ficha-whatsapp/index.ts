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
// Title Case do nome — "Igor Corazza Pereira"
// Conectores (de, da, do, dos, das, e) ficam minúsculos,
// exceto quando são a primeira palavra.
// --------------------------------------------------------
const CONECTORES = new Set(['de', 'da', 'do', 'dos', 'das', 'e'])

function titleCaseNome(nome: string | null | undefined): string {
  if (!nome) return ''
  return nome
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((palavra, i) => {
      const lower = palavra.toLowerCase()
      if (i > 0 && CONECTORES.has(lower)) return lower
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

// --------------------------------------------------------
// Evolution API — envia imagem para um grupo WhatsApp
// --------------------------------------------------------
async function enviarImagem(grupoId: string, urlImagem: string, legenda: string): Promise<void> {
  const baseUrl  = Deno.env.get('EVOLUTION_BASE_URL')!
  const instance = Deno.env.get('EVOLUTION_INSTANCE')!
  const apiKey   = Deno.env.get('EVOLUTION_API_KEY')!

  const res = await fetch(`${baseUrl}/message/sendMedia/${instance}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
    },
    body: JSON.stringify({
      number: grupoId,
      mediatype: 'image',
      media: urlImagem,
      caption: legenda,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Evolution API ${res.status}: ${body}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { ficha_id } = await req.json()
    if (!ficha_id) return json({ error: 'ficha_id é obrigatório' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // --------------------------------------------------------
    // Etapa 1 — Busca da ficha
    // --------------------------------------------------------
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas')
      .select('id, tipo, url_bucket, nome_cliente, telefone_cliente, enviada_whatsapp_geral, enviada_whatsapp_venda')
      .eq('id', ficha_id)
      .single()

    if (fichaError || !ficha) return json({ error: 'Ficha não encontrada' }, 400)

    // --------------------------------------------------------
    // Etapa 2 — URL assinada (TTL: 1 hora)
    // --------------------------------------------------------
    if (!ficha.url_bucket) {
      return json({ error: 'Ficha sem imagem — url_bucket ausente' }, 500)
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from('fichas')
      .createSignedUrl(ficha.url_bucket, 3600)

    if (signedError || !signedData?.signedUrl) {
      throw new Error(`Falha ao gerar URL assinada: ${signedError?.message}`)
    }

    const urlAssinada = signedData.signedUrl

    // --------------------------------------------------------
    // Etapa 3 — Verifica campos de controle (reenvio cirúrgico)
    // --------------------------------------------------------
    const deveEnviarGeral = !ficha.enviada_whatsapp_geral
    const deveEnviarVenda = ficha.tipo === 'venda' && !ficha.enviada_whatsapp_venda

    const legenda = `${titleCaseNome(ficha.nome_cliente)}\n${ficha.telefone_cliente ?? ''}`.trim()

    const grupoGeral = Deno.env.get('EVOLUTION_GRUPO_GERAL')!
    const grupoVenda = Deno.env.get('EVOLUTION_GRUPO_VENDA')!

    // --------------------------------------------------------
    // Etapa 4 — Envios (paralelo para fichas de venda)
    // --------------------------------------------------------
    let enviouGeral = ficha.enviada_whatsapp_geral
    let enviouVenda = ficha.enviada_whatsapp_venda

    const tarefas: Promise<void>[] = []

    if (deveEnviarGeral) {
      tarefas.push(
        enviarImagem(grupoGeral, urlAssinada, legenda)
          .then(() => { enviouGeral = true })
          .catch(() => { /* enviouGeral permanece false */ })
      )
    }

    if (deveEnviarVenda) {
      tarefas.push(
        enviarImagem(grupoVenda, urlAssinada, legenda)
          .then(() => { enviouVenda = true })
          .catch(() => { /* enviouVenda permanece false */ })
      )
    }

    await Promise.all(tarefas)

    // --------------------------------------------------------
    // Etapa 5 — Atualiza campos de controle no banco
    // --------------------------------------------------------
    await supabase
      .from('fichas')
      .update({
        enviada_whatsapp_geral: enviouGeral,
        enviada_whatsapp_venda: enviouVenda,
      })
      .eq('id', ficha_id)

    // Sempre retorna HTTP 200 — front lê os campos para saber o resultado
    return json({
      ficha_id,
      enviada_whatsapp_geral: enviouGeral,
      enviada_whatsapp_venda: enviouVenda,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return json({ error: message }, 500)
  }
})
