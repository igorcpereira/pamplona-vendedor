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
    const { nome, telefone, vendedor_id } = await req.json()

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

    // --- Etapa 2: Upsert ---
    const insertPayload: Record<string, unknown> = {
      nome: nome.trim(),
      telefone: telefoneNormalizado,
      vendedor_id,
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
    if (insertError?.code === '23505') {
      const { data: existing, error: selectError } = await supabase
        .from('clientes')
        .select('id')
        .eq('telefone', telefoneNormalizado)
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
