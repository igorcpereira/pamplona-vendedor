-- Permite registrar "prova avulsa": uma prova vinculada apenas ao vendedor,
-- sem ficha associada. ficha_id passa a ser opcional e guardamos nome/telefone
-- do cliente direto na prova.

ALTER TABLE public.provas
  ALTER COLUMN ficha_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS nome_cliente text,
  ADD COLUMN IF NOT EXISTS telefone_cliente text;
