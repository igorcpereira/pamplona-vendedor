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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { ficha_nova_id, is_prova, vendedor_id } = await req.json()

    if (!ficha_nova_id || typeof is_prova !== 'boolean' || !vendedor_id) {
      return json({ error: 'parametros_invalidos' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    if (is_prova) {
      // Busca ficha_nova para obter ficha_original_id
      const { data: fichaNova, error: errNova } = await supabase
        .from('fichas')
        .select('id, ficha_original_id')
        .eq('id', ficha_nova_id)
        .single()

      if (errNova || !fichaNova) return json({ error: 'ficha_nova_nao_encontrada' }, 404)
      if (!fichaNova.ficha_original_id) return json({ error: 'ficha_original_id_ausente' }, 400)

      const fichaOriginalId = fichaNova.ficha_original_id

      // Busca ficha_original para verificar slots livres
      const { data: fichaOriginal, error: errOriginal } = await supabase
        .from('fichas')
        .select('id, prova1_data, prova2_data, prova3_data')
        .eq('id', fichaOriginalId)
        .single()

      if (errOriginal || !fichaOriginal) return json({ error: 'ficha_original_nao_encontrada' }, 404)

      // Determina próximo slot livre
      let slotData: string
      let slotVendedor: string
      if (!fichaOriginal.prova1_data) {
        slotData = 'prova1_data'
        slotVendedor = 'prova1_vendedor_id'
      } else if (!fichaOriginal.prova2_data) {
        slotData = 'prova2_data'
        slotVendedor = 'prova2_vendedor_id'
      } else if (!fichaOriginal.prova3_data) {
        slotData = 'prova3_data'
        slotVendedor = 'prova3_vendedor_id'
      } else {
        slotData = 'prova3_data'
        slotVendedor = 'prova3_vendedor_id'
      }

      // Atualiza ficha_original com a prova
      await supabase.from('fichas').update({
        [slotData]: new Date().toISOString(),
        [slotVendedor]: vendedor_id,
      }).eq('id', fichaOriginalId)

      // Deleta ficha_nova (era só um placeholder)
      await supabase.from('fichas').delete().eq('id', ficha_nova_id)

      return json({ ficha_id: fichaOriginalId })

    } else {
      // Não é prova — marca como erro de ficha duplicada
      await supabase.from('fichas').update({
        status: 'erro',
        erro_etapa: 'ficha_duplicada',
      }).eq('id', ficha_nova_id)

      return json({ ficha_id: ficha_nova_id })
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return json({ error: message }, 500)
  }
})
