-- ============================================================
-- get_usuarios_completos: expor a unidade ALOCADA (profiles.unidade_id)
-- ============================================================
-- Antes retornava uur.unidade_id (o vinculo) -> para cargos globais isso era 3
-- ("Todas"). O painel de Usuarios gerencia a "unidade alocada" (onde os
-- lancamentos do usuario sao aplicados), que vive em profiles.unidade_id e e
-- sempre uma unidade REAL. Passa a retornar p.unidade_id + o nome dela.
-- Para cargos de unidade unica, profiles.unidade_id == vinculo (mesma unidade).
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_usuarios_completos()
RETURNS TABLE(id uuid, nome text, email text, unidade_id bigint, unidade_nome text, role text, ativo boolean, created_at timestamp with time zone, avatar_url text, is_vendedor_adicional boolean, is_teste boolean, ultimo_acesso timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_show_teste boolean;
BEGIN
  v_show_teste := EXISTS (
    SELECT 1 FROM public.usuario_unidade_role r
    WHERE r.user_id = auth.uid() AND r.role IN ('master','admin')
  );
  RETURN QUERY
  SELECT
    p.id, p.nome, au.email::text, p.unidade_id, u.nome AS unidade_nome,
    uur.role::text, p.ativo, p.created_at, p.avatar_url,
    false::boolean AS is_vendedor_adicional, p.is_teste, p.ultimo_acesso
  FROM public.profiles p
  INNER JOIN auth.users au ON p.id = au.id
  INNER JOIN public.usuario_unidade_role uur ON p.id = uur.user_id
  LEFT JOIN public.unidades u ON p.unidade_id = u.id
  WHERE (
      EXISTS (
        SELECT 1 FROM public.usuario_unidade_role r
        WHERE r.user_id = auth.uid() AND r.role IN ('master','admin','gestor')
      )
      OR EXISTS (
        SELECT 1 FROM public.usuario_unidade_role r
        WHERE r.user_id = auth.uid() AND r.role = 'franqueado'
          AND uur.unidade_id = r.unidade_id
      )
      OR p.id = auth.uid()
    )
    AND (v_show_teste OR NOT COALESCE(p.is_teste, false));
END;
$function$;
