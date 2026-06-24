-- ============================================================
-- Correcao: move dados carimbados na unidade virtual "Todas" (3) para Maringa (1)
-- ============================================================
-- Causa: usuarios globais (gestor/admin) tinham profiles.unidade_id = 3, entao
-- fichas/clientes que eles criavam nasciam na unidade 3 (virtual). Isso gerava
-- discrepancia no relatorio ("Todas" != soma das unidades reais).
--
-- Decisao: alocar tudo para Maringa (unidade 1).
--   - 6 clientes + 6 fichas na unidade 3 -> 1
--   - profiles.unidade_id dos globais (estavam em 3) -> 1 (unidade alocada)
-- Dai em diante a unidade alocada e gerida pelo painel (campo "Unidade alocada")
-- e a trava de banco impede novos dados na unidade 3.
-- ============================================================

UPDATE public.clientes SET unidade_id = 1 WHERE unidade_id = 3;
UPDATE public.fichas   SET unidade_id = 1 WHERE unidade_id = 3;

-- Unidade alocada dos usuarios globais (gestor/admin/master) que estavam em "Todas"
UPDATE public.profiles SET unidade_id = 1 WHERE unidade_id = 3;
