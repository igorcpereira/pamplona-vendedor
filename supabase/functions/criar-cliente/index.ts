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

// Espelha public.normalize_phone() do banco (trigger trg_clientes_normalize_phone).
// Regra: o único critério é chegar a 13 dígitos (55 + DDD + 9 + 8), inserindo o 9
// quando vier 55 + DDD + 8. NÃO policiamos qual dígito é o 9. Validamos aqui antes
// para devolver 400 com mensagem clara em vez de deixar o INSERT estourar 500.
function normalizePhone(input: unknown): string | null {
  if (input == null) return null
  const trimmed = String(input).trim()
  if (trimmed === '') return null

  let d = trimmed.replace(/\D/g, '')
  let len = d.length

  // > 13: trunca para os PRIMEIROS 13 (mantém DDI 55 + DDD)
  if (len > 13) {
    d = d.slice(0, 13)
    len = 13
  }

  if (len === 13) {
    // 55 + DDD + 9 dígitos de local: aceita como está
    return d.slice(0, 2) === '55' ? d : null
  } else if (len === 12) {
    // 55 + DDD + 8 dígitos → insere o 9 antes dos 8 dígitos
    return d.slice(0, 2) === '55' ? d.slice(0, 4) + '9' + d.slice(4) : null
  } else if (len === 11) {
    // DDD + 9 dígitos → prefixa o DDI 55
    return '55' + d
  } else if (len === 10) {
    // DDD + 8 dígitos → prefixa 55 e insere o 9
    return '55' + d.slice(0, 2) + '9' + d.slice(2)
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nome, telefone, vendedor_id, cliente_id } = await req.json()

    // --- Etapa 1: Validação ---
    if (!nome?.trim())      return json({ error: 'nome é obrigatório' }, 400)
    if (!telefone?.trim())  return json({ error: 'telefone é obrigatório' }, 400)
    if (!vendedor_id?.trim()) return json({ error: 'vendedor_id é obrigatório' }, 400)

    // Usa a MESMA regra do banco (normalize_phone) e devolve o número já em 13
    // dígitos. Só é rejeitado quando não dá para chegar a 13 (menos de 10 dígitos,
    // ou 12/13 dígitos sem o DDI 55).
    const telefoneNormalizado = normalizePhone(telefone)
    if (!telefoneNormalizado) {
      return json({
        error: `Telefone inválido. Não foi possível normalizar para 13 dígitos (55 + DDD + 9 + 8). Recebido: ${telefone}`,
      }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // --- Etapa 1a: de que mundo é este vendedor ---
    // Esta função roda com SERVICE ROLE, e sob service role `auth.uid()` é NULL.
    // Por isso o trigger do banco não consegue derivar o mundo aqui, e quem deriva
    // é esta função, lendo o perfil do vendedor NO SERVIDOR. O `is_demo` nunca vem
    // do corpo da requisição: se viesse, a tela poderia escolher em que mundo
    // escrever.
    //
    // Vendedor sem perfil cai no mundo real, que é o comportamento de antes desta
    // mudança e o único seguro: na dúvida, o dado é de verdade.
    const { data: perfilVendedor } = await supabase
      .from('profiles')
      .select('is_demo')
      .eq('id', vendedor_id)
      .maybeSingle()
    const mundoDemo = perfilVendedor?.is_demo === true

    // --- Etapa 1b: Cliente já vinculado → UPDATE por id (não duplica) ---
    // Quando a ficha já aponta para um cliente, atualizamos ESSE registro em vez
    // de re-resolver por telefone. Assim, corrigir o telefone de uma ficha
    // vinculada altera o cliente existente, sem criar duplicata.
    if (typeof cliente_id === 'string' && cliente_id.trim() !== '') {
      // O `.eq('is_demo', mundoDemo)` impede que um id de outro mundo, chegando
      // pelo corpo, faça esta função renomear cliente REAL a partir da conta de
      // demonstração (ou o contrário). Sem ele, bastaria conhecer um uuid.
      const { data: updated, error: updateError } = await supabase
        .from('clientes')
        .update({ nome: nome.trim(), telefone: telefoneNormalizado })
        .eq('id', cliente_id)
        .eq('is_demo', mundoDemo)
        .select('id')
        .single()

      if (updated?.id) {
        return json({ cliente_id: updated.id })
      }

      // Telefone novo colide com OUTRO cliente (unique 23505): não dá para mover
      // este número; devolve 409 com mensagem clara em vez de estourar.
      if (updateError?.code === '23505') {
        return json({
          error: 'Já existe outro cliente com este telefone. Ajuste o cadastro do cliente diretamente.',
        }, 409)
      }
      // Qualquer outro caso (ex.: cliente_id órfão, sem linha para atualizar) cai
      // no fluxo normal de insert/upsert abaixo, em vez de estourar.
    }

    // --- Etapa 2: Upsert ---
    const insertPayload: Record<string, unknown> = {
      nome: nome.trim(),
      telefone: telefoneNormalizado,
      vendedor_id,
      is_demo: mundoDemo,
    }
    // Cliente é entidade do negócio: não carrega mais unidade_id (a unidade vive na ficha).

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
    //
    // O `.eq('is_demo', mundoDemo)` aqui é o conserto do vazamento mais silencioso
    // do sistema. Sem ele, um telefone digitado na apresentação que já exista na
    // produção faz esta busca devolver o id do cliente REAL, e a ficha fictícia
    // passa a apontar para uma pessoa de verdade, sem erro nenhum na tela.
    if (insertError?.code === '23505') {
      const { data: existing, error: selectError } = await supabase
        .from('clientes')
        .select('id')
        .eq('telefone', telefoneNormalizado)
        .eq('is_demo', mundoDemo)
        .single()

      if (selectError || !existing) {
        throw new Error('Falha ao buscar cliente existente por telefone')
      }

      return json({ cliente_id: existing.id })
    }

    // Violação de check (23514) → normalmente o trigger de telefone. Já validamos
    // acima, mas mantemos como rede de segurança para devolver 400, não 500.
    if (insertError?.code === '23514') {
      return json({ error: insertError.message || 'Telefone inválido.' }, 400)
    }

    throw insertError ?? new Error('Erro inesperado no insert')

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return json({ error: message }, 500)
  }
})
