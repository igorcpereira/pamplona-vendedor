-- itens_avulsos_ficha: permite que o perfil administrativo (e demais perfis com
-- acesso à unidade) gerencie itens de pedidos de OUTROS vendedores.
--
-- Antes, as policies de INSERT/UPDATE/DELETE exigiam pedidos.vendedor_id = auth.uid(),
-- o que bloqueava o administrativo ao lançar pedido avulso / editar ficha atribuindo
-- a venda a outro vendedor (o pedido nasce com o vendedor_id do outro usuário).
--
-- Alinha ao mesmo padrão já usado em fichas/pedidos: acesso por unidade +
-- (dono do pedido OU role privilegiada/administrativo). A policy de SELECT já era
-- baseada em can_access_unidade, então permanece inalterada.

DROP POLICY IF EXISTS "itens_avulsos_insert" ON public.itens_avulsos_ficha;
DROP POLICY IF EXISTS "itens_avulsos_update" ON public.itens_avulsos_ficha;
DROP POLICY IF EXISTS "itens_avulsos_delete" ON public.itens_avulsos_ficha;

CREATE POLICY "itens_avulsos_insert"
ON public.itens_avulsos_ficha FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = itens_avulsos_ficha.pedido_id
      AND public.can_access_unidade(auth.uid(), p.unidade_id)
      AND (
        p.vendedor_id = auth.uid()
        OR public.has_role(auth.uid(), 'gestor'::app_role)
        OR public.has_role(auth.uid(), 'franqueado'::app_role)
        OR public.has_role(auth.uid(), 'master'::app_role)
        OR public.has_role(auth.uid(), 'admin'::app_role)
        OR public.has_role(auth.uid(), 'administrativo'::app_role)
      )
  )
);

CREATE POLICY "itens_avulsos_update"
ON public.itens_avulsos_ficha FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = itens_avulsos_ficha.pedido_id
      AND public.can_access_unidade(auth.uid(), p.unidade_id)
      AND (
        p.vendedor_id = auth.uid()
        OR public.has_role(auth.uid(), 'gestor'::app_role)
        OR public.has_role(auth.uid(), 'franqueado'::app_role)
        OR public.has_role(auth.uid(), 'master'::app_role)
        OR public.has_role(auth.uid(), 'admin'::app_role)
        OR public.has_role(auth.uid(), 'administrativo'::app_role)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = itens_avulsos_ficha.pedido_id
      AND public.can_access_unidade(auth.uid(), p.unidade_id)
      AND (
        p.vendedor_id = auth.uid()
        OR public.has_role(auth.uid(), 'gestor'::app_role)
        OR public.has_role(auth.uid(), 'franqueado'::app_role)
        OR public.has_role(auth.uid(), 'master'::app_role)
        OR public.has_role(auth.uid(), 'admin'::app_role)
        OR public.has_role(auth.uid(), 'administrativo'::app_role)
      )
  )
);

CREATE POLICY "itens_avulsos_delete"
ON public.itens_avulsos_ficha FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = itens_avulsos_ficha.pedido_id
      AND public.can_access_unidade(auth.uid(), p.unidade_id)
      AND (
        p.vendedor_id = auth.uid()
        OR public.has_role(auth.uid(), 'gestor'::app_role)
        OR public.has_role(auth.uid(), 'franqueado'::app_role)
        OR public.has_role(auth.uid(), 'master'::app_role)
        OR public.has_role(auth.uid(), 'admin'::app_role)
        OR public.has_role(auth.uid(), 'administrativo'::app_role)
      )
  )
);
