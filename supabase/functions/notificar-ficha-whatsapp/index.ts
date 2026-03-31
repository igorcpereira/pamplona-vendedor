import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EVOLUTION_BASE_URL = 'https://evolutionaws.agenciakadin.com.br'
const EVOLUTION_INSTANCE = 'igor'

const GRUPOS: Record<string, string> = {
  venda: '120363404490361259@g.us',
  aluguel: '120363351121159168@g.us',
  ajuste: '120363351121159168@g.us',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { ficha_id } = await req.json()

    if (!ficha_id) {
      throw new Error('ficha_id é obrigatório')
    }

    console.log('Iniciando notificação WhatsApp para ficha:', ficha_id)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Busca dados da ficha
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas')
      .select('nome_cliente, telefone_cliente, tipo, url_bucket')
      .eq('id', ficha_id)
      .single()

    if (fichaError || !ficha) {
      throw new Error('Ficha não encontrada: ' + fichaError?.message)
    }

    console.log('Ficha encontrada:', JSON.stringify(ficha))

    // Determina o grupo pelo tipo
    const tipoNorm = (ficha.tipo ?? '').toLowerCase()
    const grupoId = GRUPOS[tipoNorm]

    if (!grupoId) {
      throw new Error(`Tipo desconhecido para roteamento de grupo: "${ficha.tipo}"`)
    }

    console.log('Grupo destino:', grupoId)

    // Monta legenda
    const caption = [
      ficha.nome_cliente ?? '',
      ficha.telefone_cliente ?? '',
    ].filter(Boolean).join('\n')

    // Chama Evolution API
    const evolutionResponse = await fetch(
      `${EVOLUTION_BASE_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': Deno.env.get('EVOLUTION_API_KEY')!,
        },
        body: JSON.stringify({
          number: grupoId,
          mediatype: 'image',
          mimetype: 'image/jpeg',
          caption,
          media: ficha.url_bucket,
          fileName: 'ficha.jpg',
        }),
      }
    )

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text()
      console.error('Evolution API erro:', evolutionResponse.status, errorText)
      throw new Error(`Evolution API retornou status ${evolutionResponse.status}: ${errorText}`)
    }

    const evolutionData = await evolutionResponse.json()
    console.log('Mensagem enviada com sucesso:', JSON.stringify(evolutionData))

    return new Response(
      JSON.stringify({ success: true, ficha_id, grupo: grupoId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao notificar WhatsApp:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
