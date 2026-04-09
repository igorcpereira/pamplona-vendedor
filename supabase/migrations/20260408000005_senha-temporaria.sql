-- ============================================================
-- Migration: Senha temporária no primeiro acesso
-- ============================================================
-- Adiciona flag senha_temporaria em profiles.
-- Novos usuários (handle_new_user) herdam o DEFAULT true.
-- Usuários existentes recebem false — já definiram suas senhas.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS senha_temporaria boolean NOT NULL DEFAULT true;

-- Usuários existentes não precisam trocar
UPDATE public.profiles SET senha_temporaria = false;
