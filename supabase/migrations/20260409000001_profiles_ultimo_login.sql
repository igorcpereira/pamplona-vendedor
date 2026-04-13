-- Adiciona coluna ultimo_login na tabela profiles (se ainda não existir)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ultimo_login TIMESTAMPTZ;
