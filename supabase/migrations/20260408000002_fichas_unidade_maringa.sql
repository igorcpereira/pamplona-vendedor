-- Define unidade_id = Maringá (1) para todas as fichas
-- que ainda não têm unidade atribuída ou foram criadas antes da migração multi-unidade.

UPDATE public.fichas
SET unidade_id = 1
WHERE unidade_id IS NULL OR unidade_id != 1;
