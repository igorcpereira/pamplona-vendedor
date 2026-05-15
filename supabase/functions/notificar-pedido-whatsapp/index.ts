import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

async function enviarTexto(grupoId: string, texto: string): Promise<void> {
  const baseUrl  = Deno.env.get('EVOLUTION_BASE_URL')!
  const instance = Deno.env.get('EVOLUTION_INSTANCE')!
  const apiKey   = Deno.env.get('EVOLUTION_API_KEY')!

  const res = await fetch(`${baseUrl}/message/sendText/${instance}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
    },
    body: JSON.stringify({
      number: grupoId,
      text: texto,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Evolution API ${res.status}: ${body}`)
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatarMensagem(
  nomeCliente: string,
  telefoneCliente: string,
  nomeVendedor: string,
  itens: Array<{ tipo_item: string; quantidade: number }>
): string {
  const itensFiltrados = itens.filter(i => i.quantidade > 0)
  const linhasItens = itensFiltrados
    .map(i => `• ${capitalize(i.tipo_item)}: ${i.quantidade} un`)
    .join('\n')

  return [
    '🛍️ *Novo Pedido Registrado*',
    '',
    `👤 *Cliente:* ${nomeCliente}`,
    `📱 *Telefone:* ${telefoneCliente}`,
    '',
    '👔 *Itens do Pedido:*',
    linhasItens,
    '',
    `🧑‍💼 *Vendedor:* ${nomeVendedor}`,
  ].join('\n')
}

Deno.serve(async (req) => {
  try {
    const { pedido_id } = await req.json()
    if (!pedido_id) {
      return new Response(JSON.stringify({ error: 'pedido_id é obrigatório' }), { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('id, vendedor_id, fichas(nome_cliente, telefone_cliente)')
      .eq('id', pedido_id)
      .single()

    if (pedidoError || !pedido) {
      return new Response(JSON.stringify({ error: 'Pedido não encontrado' }), { status: 400 })
    }

    const [perfilRes, itensRes] = await Promise.all([
      supabase.from('profiles').select('nome').eq('id', pedido.vendedor_id).single(),
      supabase.from('itens_avulsos_ficha').select('tipo_item, quantidade').eq('pedido_id', pedido_id),
    ])

    const ficha = pedido.fichas as { nome_cliente: string; telefone_cliente: string } | null
    const nomeCliente     = ficha?.nome_cliente     ?? 'N/A'
    const telefoneCliente = ficha?.telefone_cliente ?? 'N/A'
    const nomeVendedor    = perfilRes.data?.nome    ?? 'N/A'
    const itens           = (itensRes.data ?? []) as Array<{ tipo_item: string; quantidade: number }>

    const mensagem = formatarMensagem(nomeCliente, telefoneCliente, nomeVendedor, itens)

    const grupoGeral = Deno.env.get('EVOLUTION_GRUPO_GERAL')!
    const grupoVenda = Deno.env.get('EVOLUTION_GRUPO_VENDA')!

    await Promise.all([
      enviarTexto(grupoGeral, mensagem).catch(() => {}),
      enviarTexto(grupoVenda, mensagem).catch(() => {}),
    ])

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
})
