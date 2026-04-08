-- Garante que usuários autenticados possam ler a tabela unidades
-- (necessário para que a join em usuario_unidade_role funcione no frontend)

ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "unidades_select" ON public.unidades;

CREATE POLICY "unidades_select"
  ON public.unidades
  FOR SELECT
  TO authenticated
  USING (true);
