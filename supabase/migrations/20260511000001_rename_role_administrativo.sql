-- Renomeia a role 'suporte' para 'administrativo' e atualiza a função
-- get_user_role para incluir 'administrativo' na ordem de prioridade.

-- ============================================================
-- 1. Renomear valor do enum
-- ============================================================

ALTER TYPE public.app_role RENAME VALUE 'suporte' TO 'administrativo';


-- ============================================================
-- 2. Atualizar get_user_role com 'administrativo' na ordem
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role
  FROM public.usuario_unidade_role
  WHERE user_id = _user_id
    AND (
      role IN ('master', 'admin')
      OR unidade_id = public.get_user_unidade(_user_id)
    )
  ORDER BY
    CASE role
      WHEN 'admin'          THEN 1
      WHEN 'master'         THEN 2
      WHEN 'franqueado'     THEN 3
      WHEN 'gestor'         THEN 4
      WHEN 'administrativo' THEN 5
      WHEN 'vendedor'       THEN 6
    END
  LIMIT 1
$$;
