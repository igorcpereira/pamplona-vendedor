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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nome, telefone, vendedor_id, unidade_id } = await req.json()

    // --- Etapa 1: Validação ---
    if (!nome?.trim())      return json({ error: 'nome é obrigatório' }, 400)
    if (!telefone?.trim())  return json({ error: 'telefone é obrigatório' }, 400)
    if (!vendedor_id?.trim()) return json({ error: 'vendedor_id é obrigatório' }, 400)

    if (!/^55\d{11}$/.test(telefone)) {
      return json({ error: 'telefone fora do formato 55xx9xxxxxxxx' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // --- Etapa 2: Upsert ---
    const insertPayload: Record<string, unknown> = {
      nome: nome.trim(),
      telefone,
      vendedor_id,
    }
    if (unidade_id) insertPayload.unidade_id = unidade_id

    const { data: inserted, error: insertError } = await supabase
      .from('clientes')
      .insert(insertPayload)
      .select('id')
      .single()

    // Cliente criado com sucesso
    if (inserted?.id) {
      return json({ cliente_id: inserted.id })
    }

    // Conflito de telefone (23505) → busca o existente
    if (insertError?.code === '23505') {
      const { data: existing, error: selectError } = await supabase
        .from('clientes')
        .select('id')
        .eq('telefone', telefone)
        .single()

      if (selectError || !existing) {
        throw new Error('Falha ao buscar cliente existente por telefone')
      }

      return json({ cliente_id: existing.id })
    }

    throw insertError ?? new Error('Erro inesperado no insert')

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return json({ error: message }, 500)
  }
})
