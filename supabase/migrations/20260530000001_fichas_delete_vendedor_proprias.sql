-- Vendedor comum não conseguia excluir fichas (nem as próprias com erro):
-- a policy de DELETE só permitia gestor/franqueado/master/admin/administrativo.
-- Passa a permitir também que o vendedor exclua as PRÓPRIAS fichas
-- (vendedor_id = auth.uid()) dentro da sua unidade.

DROP POLICY IF EXISTS "fichas_delete" ON public.fichas;

CREATE POLICY "fichas_delete"
ON public.fichas FOR DELETE
TO authenticated
USING (
  public.can_access_unidade(auth.uid(), unidade_id)
  AND (
    auth.uid() = vendedor_id
    OR public.has_role(auth.uid(), 'gestor'::app_role)
    OR public.has_role(auth.uid(), 'franqueado'::app_role)
    OR public.has_role(auth.uid(), 'master'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'administrativo'::app_role)
  )
);
