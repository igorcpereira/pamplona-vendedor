-- RPC para listar fichas com status 'ativa' paginadas (15 por página) com busca opcional.
-- SECURITY INVOKER mantém o RLS de fichas filtrando por escopo do usuário (vendedor/franqueado/gestor).

CREATE OR REPLACE FUNCTION public.listar_fichas_processadas(
  p_offset int DEFAULT 0,
  p_limit int DEFAULT 15,
  p_search text DEFAULT NULL
)
RETURNS SETOF public.fichas
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT *
  FROM public.fichas
  WHERE status = 'ativa'
    AND (
      p_search IS NULL
      OR length(trim(p_search)) = 0
      OR nome_cliente ILIKE '%' || p_search || '%'
      OR codigo_ficha ILIKE '%' || p_search || '%'
    )
  ORDER BY created_at DESC
  OFFSET GREATEST(p_offset, 0)
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
$$;

GRANT EXECUTE ON FUNCTION public.listar_fichas_processadas(int, int, text) TO authenticated;
