-- Define unidade_id = Maringá (1) para todos os clientes
UPDATE public.clientes
SET unidade_id = 1
WHERE unidade_id IS NULL OR unidade_id != 1;
