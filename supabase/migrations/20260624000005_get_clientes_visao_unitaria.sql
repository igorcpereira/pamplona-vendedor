-- ============================================================
-- get_clientes: visao unitaria para cargos de unidade unica
-- ============================================================
-- Antes: vendedor/administrativo viam apenas os proprios clientes
-- (c.vendedor_id = auth.uid()). Novo modelo: todo membro da unidade ve TODOS
-- os clientes da sua unidade. Global (master/admin/gestor) ve tudo, com filtro
-- opcional por _unidade_id (unidade ativa selecionada no painel).
-- O filtro opcional _vendedor_id continua disponivel (ex.: drill-down).
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_clientes(
  _unidade_id bigint DEFAULT NULL::bigint,
  _vendedor_id uuid DEFAULT NULL::uuid,
  _page integer DEFAULT 1,
  _search text DEFAULT NULL::text
)
RETURNS TABLE(
  id uuid, nome text, telefone text, ltv numeric, vendedor_id uuid,
  nome_vendedor text, unidade_id bigint, unidade_nome text, tipo_atendimento text,
  tags jsonb, created_at timestamp with time zone, updated_at timestamp with time zone,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_master_admin_gestor boolean;
  _offset int := (_page - 1) * 50;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.usuario_unidade_role
    WHERE user_id = auth.uid() AND role IN ('master','admin','gestor')
  ) INTO is_master_admin_gestor;

  RETURN QUERY
  SELECT
    c.id, c.nome, c.telefone,
    COALESCE((SELECT SUM(f.valor)
              FROM public.fichas f
              WHERE f.cliente_id = c.id), 0) AS ltv,
    c.vendedor_id,
    p.nome AS nome_vendedor,
    c.unidade_id,
    u.nome AS unidade_nome,
    c.tipo_atendimento,
    COALESCE(
      (SELECT jsonb_agg(
                jsonb_build_object('id', t.id, 'nome', t.nome, 'cor', t.cor)
                ORDER BY t.nome
              )
       FROM public.relacao_cliente_tag rct
       JOIN public.tags t ON t.id = rct.id_tag AND t.ativa = true
       WHERE rct.id_cliente = c.id),
      '[]'::jsonb
    ) AS tags,
    c.created_at, c.updated_at,
    COUNT(*) OVER() AS total_count
  FROM public.clientes c
  LEFT JOIN public.unidades u ON u.id = c.unidade_id
  LEFT JOIN public.profiles p ON p.id = c.vendedor_id
  WHERE
    CASE
      WHEN is_master_admin_gestor THEN
        (_unidade_id IS NULL OR c.unidade_id = _unidade_id)
      ELSE
        -- Cargos de unidade unica (franqueado/vendedor/administrativo):
        -- toda a unidade do usuario.
        c.unidade_id = public.get_user_unidade(auth.uid())
    END
    AND (_vendedor_id IS NULL OR c.vendedor_id = _vendedor_id)
    AND (
      _search IS NULL
      OR c.nome ILIKE '%' || _search || '%'
      OR c.telefone ILIKE '%' || _search || '%'
      OR EXISTS (
        SELECT 1 FROM public.fichas f
        WHERE f.cliente_id = c.id
          AND f.codigo_ficha ILIKE '%' || _search || '%'
      )
    )
  ORDER BY c.nome, c.id
  LIMIT 50 OFFSET _offset;
END;
$function$;
