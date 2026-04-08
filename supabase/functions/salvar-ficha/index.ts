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

const TIPOS_VALIDOS = new Set(['aluguel', 'venda', 'ajuste'])

function isValidDate(value: unknown): boolean {
  if (!value || typeof value !== 'string') return false
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()

    // --------------------------------------------------------
    // Etapa 1 — Validação do input
    // --------------------------------------------------------
    const {
      ficha_id,
      user_id,
      cliente_id,
      // Accept both naming conventions: frontend sends nome_cliente/telefone_cliente
      nome_cliente,
      telefone_cliente,
      codigo_ficha,
      tipo,
      data_retirada,
      data_devolucao,
      data_festa,
      paleto,
      calca,
      camisa,
      sapato,
      valor,
      valor_paleto,
      valor_calca,
      valor_camisa,
      garantia,
      pago,
      descricao_cliente,
      tags,
    } = body

    if (!ficha_id)        return json({ error: 'ficha_id é obrigatório' }, 400)
    if (!user_id)         return json({ error: 'user_id é obrigatório' }, 400)
    if (!nome_cliente?.trim()) return json({ error: 'nome_cliente é obrigatório' }, 400)
    if (!telefone_cliente?.trim()) return json({ error: 'telefone_cliente é obrigatório' }, 400)
    if (!tipo || !TIPOS_VALIDOS.has(tipo)) return json({ error: 'tipo inválido — use aluguel, venda ou ajuste' }, 400)
    if (data_retirada && !isValidDate(data_retirada)) return json({ error: 'data_retirada deve estar no formato YYYY-MM-DD' }, 400)
    if (typeof pago !== 'boolean') return json({ error: 'pago é obrigatório e deve ser boolean' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // --------------------------------------------------------
    // Etapa 2 — Resolução do cliente
    // --------------------------------------------------------
    let resolvedClienteId: string

    if (cliente_id) {
      resolvedClienteId = cliente_id
    } else {
      // Chama criar-cliente internamente
      const criarRes = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/criar-cliente`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            nome: nome_cliente.trim(),
            telefone: telefone_cliente.trim(),
            vendedor_id: user_id,
          }),
        },
      )

      if (!criarRes.ok) {
        const err = await criarRes.json().catch(() => ({}))
        throw new Error(`Falha ao criar cliente: ${err.error ?? criarRes.status}`)
      }

      const { cliente_id: novoId } = await criarRes.json()
      if (!novoId) throw new Error('criar-cliente não retornou cliente_id')
      resolvedClienteId = novoId
    }

    // --------------------------------------------------------
    // Etapa 3 — Atualização da ficha
    // --------------------------------------------------------
    const { data: fichaAtual } = await supabase
      .from('fichas')
      .select('status')
      .eq('id', ficha_id)
      .single()

    const novoStatus = fichaAtual?.status === 'pendente' ? 'ativa' : fichaAtual?.status

    const { error: updateError } = await supabase
      .from('fichas')
      .update({
        cliente_id: resolvedClienteId,
        nome_cliente: nome_cliente.trim(),
        telefone_cliente: telefone_cliente.trim(),
        codigo_ficha: codigo_ficha ?? null,
        tipo,
        data_retirada,
        data_devolucao: data_devolucao || null,
        data_festa: data_festa || null,
        paleto: paleto || null,
        calca: calca || null,
        camisa: camisa || null,
        sapato: sapato || null,
        valor: valor ?? null,
        valor_paleto: valor_paleto ?? null,
        valor_calca: valor_calca ?? null,
        valor_camisa: valor_camisa ?? null,
        garantia: garantia ?? null,
        pago,
        descricao_cliente: descricao_cliente || null,
        status: novoStatus,
      })
      .eq('id', ficha_id)

    if (updateError) throw new Error(`Falha ao atualizar ficha: ${updateError.message}`)

    // --------------------------------------------------------
    // Etapa 4 — Salvar tags (acumula — nunca remove)
    // --------------------------------------------------------
    if (Array.isArray(tags) && tags.length > 0) {
      const vinculos = tags.map((id_tag: string) => ({
        cliente_id: resolvedClienteId,
        id_tag,
      }))

      // Ignora duplicatas silenciosamente
      await supabase
        .from('relacao_cliente_tag')
        .upsert(vinculos, { onConflict: 'cliente_id,id_tag', ignoreDuplicates: true })
      // Falha em tags não aborta o salvamento — ficha já foi salva na Etapa 3
    }

    return json({ ficha_id, cliente_id: resolvedClienteId })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return json({ error: message }, 500)
  }
})
