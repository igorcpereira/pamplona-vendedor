-- Adiciona role 'administrativo' à policy de SELECT em profiles
-- (mesmo escopo do 'franqueado': só vê profiles da própria unidade)

DROP POLICY IF EXISTS "Controle de acesso por role e unidade" ON public.profiles;

CREATE POLICY "Controle de acesso por role e unidade" ON public.profiles
  FOR SELECT USING (
    (auth.uid() = id)
    OR has_role(auth.uid(), 'gestor'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'master'::app_role)
    OR (has_role(auth.uid(), 'franqueado'::app_role) AND (unidade_id = get_user_unidade(auth.uid())))
    OR (has_role(auth.uid(), 'administrativo'::app_role) AND (unidade_id = get_user_unidade(auth.uid())))
  );
