-- RPC para buscar clientes por nome, telefone ou código de ficha (subquery em fichas) com paginação.
-- SECURITY INVOKER mantém RLS tanto em clientes quanto em fichas (subquery respeita policies).

CREATE OR REPLACE FUNCTION public.buscar_clientes(
  p_search text DEFAULT NULL,
  p_offset int DEFAULT 0,
  p_limit int DEFAULT 20
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
    p_search IS NULL
    OR length(trim(p_search)) < 2
    OR c.nome ILIKE '%' || p_search || '%'
    OR c.telefone ILIKE '%' || p_search || '%'
    OR EXISTS (
      SELECT 1 FROM public.fichas f
      WHERE f.cliente_id = c.id
        AND f.codigo_ficha ILIKE '%' || p_search || '%'
    )
  ORDER BY c.created_at DESC
  OFFSET GREATEST(p_offset, 0)
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
$$;

GRANT EXECUTE ON FUNCTION public.buscar_clientes(text, int, int) TO authenticated;
