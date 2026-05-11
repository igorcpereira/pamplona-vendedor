-- Atualiza RLS de fichas, clientes, provas e vendas_avulsas para visibilidade
-- por unidade: qualquer perfil com acesso à unidade vê todos os registros dela,
-- sem restrição por vendedor_id.
-- DELETE permanece restrito a perfis com mais privilégio.
-- Depende da migration 20260511000001 (role 'administrativo' já existe).

-- ============================================================
-- fichas
-- ============================================================

DROP POLICY IF EXISTS "fichas_select" ON public.fichas;
DROP POLICY IF EXISTS "fichas_insert" ON public.fichas;
DROP POLICY IF EXISTS "fichas_update" ON public.fichas;
DROP POLICY IF EXISTS "fichas_delete" ON public.fichas;

CREATE POLICY "fichas_select"
ON public.fichas FOR SELECT
TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id));

-- INSERT: vendedor_id pode diferir de auth.uid() (caso do administrativo)
CREATE POLICY "fichas_insert"
ON public.fichas FOR INSERT
TO authenticated
WITH CHECK (unidade_id = public.get_user_unidade(auth.uid()));

CREATE POLICY "fichas_update"
ON public.fichas FOR UPDATE
TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id))
WITH CHECK (public.can_access_unidade(auth.uid(), unidade_id));

CREATE POLICY "fichas_delete"
ON public.fichas FOR DELETE
TO authenticated
USING (
  public.can_access_unidade(auth.uid(), unidade_id)
  AND (
    public.has_role(auth.uid(), 'gestor'::app_role)
    OR public.has_role(auth.uid(), 'franqueado'::app_role)
    OR public.has_role(auth.uid(), 'master'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'administrativo'::app_role)
  )
);


-- ============================================================
-- clientes
-- ============================================================

DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update" ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete" ON public.clientes;

CREATE POLICY "clientes_select"
ON public.clientes FOR SELECT
TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id));

CREATE POLICY "clientes_insert"
ON public.clientes FOR INSERT
TO authenticated
WITH CHECK (unidade_id = public.get_user_unidade(auth.uid()));

CREATE POLICY "clientes_update"
ON public.clientes FOR UPDATE
TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id))
WITH CHECK (public.can_access_unidade(auth.uid(), unidade_id));

CREATE POLICY "clientes_delete"
ON public.clientes FOR DELETE
TO authenticated
USING (
  public.can_access_unidade(auth.uid(), unidade_id)
  AND (
    public.has_role(auth.uid(), 'gestor'::app_role)
    OR public.has_role(auth.uid(), 'franqueado'::app_role)
    OR public.has_role(auth.uid(), 'master'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'administrativo'::app_role)
  )
);


-- ============================================================
-- provas
-- ============================================================

DROP POLICY IF EXISTS "provas_select" ON public.provas;
DROP POLICY IF EXISTS "provas_insert" ON public.provas;
DROP POLICY IF EXISTS "provas_update" ON public.provas;
DROP POLICY IF EXISTS "provas_delete" ON public.provas;

CREATE POLICY "provas_select"
ON public.provas FOR SELECT
TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id));

CREATE POLICY "provas_insert"
ON public.provas FOR INSERT
TO authenticated
WITH CHECK (unidade_id = public.get_user_unidade(auth.uid()));

CREATE POLICY "provas_delete"
ON public.provas FOR DELETE
TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id));


-- ============================================================
-- vendas_avulsas
-- ============================================================

DROP POLICY IF EXISTS "vendas_avulsas_select" ON public.vendas_avulsas;
DROP POLICY IF EXISTS "vendas_avulsas_insert" ON public.vendas_avulsas;
DROP POLICY IF EXISTS "vendas_avulsas_update" ON public.vendas_avulsas;
DROP POLICY IF EXISTS "vendas_avulsas_delete" ON public.vendas_avulsas;

CREATE POLICY "vendas_avulsas_select"
ON public.vendas_avulsas FOR SELECT
TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id));

CREATE POLICY "vendas_avulsas_insert"
ON public.vendas_avulsas FOR INSERT
TO authenticated
WITH CHECK (unidade_id = public.get_user_unidade(auth.uid()));

CREATE POLICY "vendas_avulsas_update"
ON public.vendas_avulsas FOR UPDATE
TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id))
WITH CHECK (public.can_access_unidade(auth.uid(), unidade_id));

CREATE POLICY "vendas_avulsas_delete"
ON public.vendas_avulsas FOR DELETE
TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id));
