-- ============================================================
-- Limpeza de objetos orfaos deixados pelo drop de `vendas_avulsas`
-- (migration 20260623000001). O DROP ... CASCADE removeu a tabela, suas
-- policies, indices, triggers e a FK de vendas_atribuidas, mas NAO removeu:
--   1. a funcao public.atribuir_avulsa_campanhas(uuid) -- referencia a tabela
--      inexistente; nao era mais chamada (o trigger trg_avulsas_atribuir caiu
--      junto com a tabela);
--   2. a coluna vendas_atribuidas.venda_avulsa_id -- sem FK, sempre null
--      (tabela vendas_atribuidas vazia). O DROP COLUMN remove tambem o indice
--      unico parcial `vendas_atribuidas_uniq_avulsa`.
--
-- Verificado antes do drop: a funcao acima era a unica que referenciava a
-- coluna, e nao havia triggers em vendas_atribuidas.
-- ============================================================

DROP FUNCTION IF EXISTS public.atribuir_avulsa_campanhas(uuid);

ALTER TABLE public.vendas_atribuidas
  DROP COLUMN IF EXISTS venda_avulsa_id;
