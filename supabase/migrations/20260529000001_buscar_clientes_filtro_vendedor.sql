-- Adiciona filtro opcional por vendedor à RPC buscar_clientes.
-- Quando p_vendedor_id é informado, retorna apenas clientes daquele vendedor (vendedor ativo).
-- SECURITY INVOKER mantém RLS tanto em clientes quanto em fichas (subquery respeita policies).

DROP FUNCTION IF EXISTS public.buscar_clientes(text, int, int);

CREATE OR REPLACE FUNCTION public.buscar_clientes(
  p_search text DEFAULT NULL,
  p_offset int DEFAULT 0,
  p_limit int DEFAULT 20,
  p_vendedor_id uuid DEFAULT NULL
)
RETURNS SETOF public.clientes
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT c.*
  FROM public.clientes c
  WHERE
    (p_vendedor_id IS NULL OR c.vendedor_id = p_vendedor_id)
    AND (
      p_search IS NULL
      OR length(trim(p_search)) < 2
      OR c.nome ILIKE '%' || p_search || '%'
      OR c.telefone ILIKE '%' || p_search || '%'
      OR EXISTS (
        SELECT 1 FROM public.fichas f
        WHERE f.cliente_id = c.id
          AND f.codigo_ficha ILIKE '%' || p_search || '%'
      )
    )
  ORDER BY c.created_at DESC
  OFFSET GREATEST(p_offset, 0)
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
$$;

GRANT EXECUTE ON FUNCTION public.buscar_clientes(text, int, int, uuid) TO authenticated;
