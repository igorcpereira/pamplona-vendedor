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

// Unidades
const UNIDADE_MARINGA = 1
const UNIDADE_LONDRINA = 2

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
// Config de WhatsApp por unidade (Evolution API)
// --------------------------------------------------------
// Cada unidade pode usar uma instância, servidor (baseUrl) e API key próprios.
// baseUrl e apiKey têm fallback para os valores padrão (mesma instalação
// Evolution de Maringá) — só defina os *_LONDRINA se forem diferentes.
//   - grupoGeral: recebe TODA ficha da unidade
//   - grupoVenda: opcional; recebe só fichas tipo='venda' (Maringá usa; Londrina não)
// --------------------------------------------------------
interface UnidadeWhatsappConfig {
  baseUrl: string
  instance: string
  apiKey: string
  grupoGeral: string
  grupoVenda?: string
}

function getConfigUnidade(unidadeId: number): UnidadeWhatsappConfig | null {
  const baseUrlPadrao = Deno.env.get('EVOLUTION_BASE_URL') ?? ''
  const apiKeyPadrao = Deno.env.get('EVOLUTION_API_KEY') ?? ''

  if (unidadeId === UNIDADE_MARINGA) {
    return {
      baseUrl: baseUrlPadrao,
      instance: Deno.env.get('EVOLUTION_INSTANCE') ?? '',
      apiKey: apiKeyPadrao,
      grupoGeral: Deno.env.get('EVOLUTION_GRUPO_GERAL') ?? '',
      grupoVenda: Deno.env.get('EVOLUTION_GRUPO_VENDA') ?? '',
    }
  }

  if (unidadeId === UNIDADE_LONDRINA) {
    return {
      baseUrl: Deno.env.get('EVOLUTION_BASE_URL_LONDRINA') ?? baseUrlPadrao,
      instance: Deno.env.get('EVOLUTION_INSTANCE_LONDRINA') ?? '',
      apiKey: Deno.env.get('EVOLUTION_API_KEY_LONDRINA') ?? apiKeyPadrao,
      grupoGeral: Deno.env.get('EVOLUTION_GRUPO_LONDRINA') ?? '',
      // Londrina usa grupo único → sem grupoVenda
    }
  }

  // Demais unidades não são notificadas
  return null
}

// --------------------------------------------------------
// Evolution API — envia imagem para um grupo WhatsApp
// --------------------------------------------------------
async function enviarImagem(
  cfg: UnidadeWhatsappConfig,
  grupoId: string,
  urlImagem: string,
  legenda: string,
): Promise<void> {
  const res = await fetch(`${cfg.baseUrl}/message/sendMedia/${cfg.instance}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: cfg.apiKey,
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
      .select('id, tipo, url_bucket, nome_cliente, telefone_cliente, unidade_id, enviada_whatsapp_geral, enviada_whatsapp_venda')
      .eq('id', ficha_id)
      .single()

    if (fichaError || !ficha) return json({ error: 'Ficha não encontrada' }, 400)

    // --------------------------------------------------------
    // Filtro/config de unidade — só unidades configuradas notificam
    // --------------------------------------------------------
    const cfg = getConfigUnidade(ficha.unidade_id)
    if (!cfg) {
      return json({
        ficha_id,
        skipped: 'unidade_nao_notificada',
        enviada_whatsapp_geral: ficha.enviada_whatsapp_geral,
        enviada_whatsapp_venda: ficha.enviada_whatsapp_venda,
      })
    }

    // Config incompleta (ex.: secrets da unidade ainda não definidos) → não
    // tenta enviar nem marca como enviada; apenas sinaliza que falta configurar.
    if (!cfg.baseUrl || !cfg.instance || !cfg.apiKey || !cfg.grupoGeral) {
      return json({
        ficha_id,
        skipped: 'config_incompleta',
        unidade_id: ficha.unidade_id,
        enviada_whatsapp_geral: ficha.enviada_whatsapp_geral,
        enviada_whatsapp_venda: ficha.enviada_whatsapp_venda,
      })
    }

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
    // grupoGeral recebe toda ficha; grupoVenda (se existir) só fichas de venda.
    const deveEnviarGeral = !ficha.enviada_whatsapp_geral
    const deveEnviarVenda = !!cfg.grupoVenda && ficha.tipo === 'venda' && !ficha.enviada_whatsapp_venda

    const legenda = `${titleCaseNome(ficha.nome_cliente)}\n${ficha.telefone_cliente ?? ''}`.trim()

    // --------------------------------------------------------
    // Etapa 4 — Envios (paralelo quando há grupo de venda)
    // --------------------------------------------------------
    let enviouGeral = ficha.enviada_whatsapp_geral
    let enviouVenda = ficha.enviada_whatsapp_venda

    const tarefas: Promise<void>[] = []

    if (deveEnviarGeral) {
      tarefas.push(
        enviarImagem(cfg, cfg.grupoGeral, urlAssinada, legenda)
          .then(() => { enviouGeral = true })
          .catch(() => { /* enviouGeral permanece false */ })
      )
    }

    if (deveEnviarVenda) {
      tarefas.push(
        enviarImagem(cfg, cfg.grupoVenda!, urlAssinada, legenda)
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
