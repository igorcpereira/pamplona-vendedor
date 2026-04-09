-- ============================================================
-- Migration: Remover user_roles e profiles.role
-- ============================================================
-- A tabela usuario_unidade_role já substitui user_roles
-- completamente desde a migration 20260407000001.
-- Esta migration finaliza a transição removendo os artefatos
-- legados.
-- ============================================================


-- ============================================================
-- 1. Dropar user_roles (policies + tabela)
-- ============================================================

DROP POLICY IF EXISTS "Usuários veem suas próprias roles" ON public.user_roles;

DROP TABLE IF EXISTS public.user_roles;


-- ============================================================
-- 2. Remover profiles.role
-- ============================================================

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS role;
