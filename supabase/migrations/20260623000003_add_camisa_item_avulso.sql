-- ============================================================
-- Adiciona o tipo de item avulso 'camisa' a itens_avulsos_ficha
-- ============================================================
-- Novo item "Camisa" (distinto de "Camiseta", que ja existia).
-- Atualiza o CHECK constraint para aceitar o novo valor.
--
-- ROLLBACK: recriar o CHECK sem 'camisa' (so e seguro se nao houver linhas
-- com tipo_item = 'camisa'):
--   ALTER TABLE public.itens_avulsos_ficha
--     DROP CONSTRAINT IF EXISTS itens_avulsos_ficha_tipo_item_check;
--   ALTER TABLE public.itens_avulsos_ficha
--     ADD CONSTRAINT itens_avulsos_ficha_tipo_item_check
--     CHECK (tipo_item = ANY (ARRAY['camiseta','gravata','sapato','meia','cinto']::text[]));
-- ============================================================

ALTER TABLE public.itens_avulsos_ficha
  DROP CONSTRAINT IF EXISTS itens_avulsos_ficha_tipo_item_check;

ALTER TABLE public.itens_avulsos_ficha
  ADD CONSTRAINT itens_avulsos_ficha_tipo_item_check
  CHECK (tipo_item = ANY (ARRAY['camiseta','camisa','gravata','sapato','meia','cinto']::text[]));
