-- Tabelas para registrar provas (ajustes/medidas) e vendas avulsas vinculadas a uma ficha.
-- RLS espelha o padrão de fichas: vendedor vê as próprias, franqueado vê da unidade, gestor/master/admin veem todas.

-- ============================================================
-- TABELA: provas
-- ============================================================

CREATE TABLE IF NOT EXISTS public.provas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id    uuid NOT NULL REFERENCES public.fichas(id) ON DELETE CASCADE,
  vendedor_id uuid NOT NULL REFERENCES auth.users(id),
  unidade_id  bigint REFERENCES public.unidades(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provas_ficha_id ON public.provas(ficha_id);
CREATE INDEX IF NOT EXISTS idx_provas_vendedor_id ON public.provas(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_provas_unidade_id ON public.provas(unidade_id);

ALTER TABLE public.provas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provas_select"
ON public.provas FOR SELECT
TO authenticated
USING (
  public.can_access_unidade(auth.uid(), unidade_id)
  AND (
    auth.uid() = vendedor_id
    OR public.has_role(auth.uid(), 'franqueado'::app_role)
    OR public.has_role(auth.uid(), 'gestor'::app_role)
    OR public.has_role(auth.uid(), 'master'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "provas_insert"
ON public.provas FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = vendedor_id
  AND unidade_id = public.get_user_unidade(auth.uid())
);

CREATE POLICY "provas_delete"
ON public.provas FOR DELETE
TO authenticated
USING (
  public.can_access_unidade(auth.uid(), unidade_id)
  AND (
    auth.uid() = vendedor_id
    OR public.has_role(auth.uid(), 'franqueado'::app_role)
    OR public.has_role(auth.uid(), 'gestor'::app_role)
    OR public.has_role(auth.uid(), 'master'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- ============================================================
-- TABELA: vendas_avulsas
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vendas_avulsas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id    uuid NOT NULL REFERENCES public.fichas(id) ON DELETE CASCADE,
  vendedor_id uuid NOT NULL REFERENCES auth.users(id),
  unidade_id  bigint REFERENCES public.unidades(id),
  descricao   text,
  valor       numeric,
  pago        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendas_avulsas_ficha_id ON public.vendas_avulsas(ficha_id);
CREATE INDEX IF NOT EXISTS idx_vendas_avulsas_vendedor_id ON public.vendas_avulsas(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_vendas_avulsas_unidade_id ON public.vendas_avulsas(unidade_id);

ALTER TABLE public.vendas_avulsas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendas_avulsas_select"
ON public.vendas_avulsas FOR SELECT
TO authenticated
USING (
  public.can_access_unidade(auth.uid(), unidade_id)
  AND (
    auth.uid() = vendedor_id
    OR public.has_role(auth.uid(), 'franqueado'::app_role)
    OR public.has_role(auth.uid(), 'gestor'::app_role)
    OR public.has_role(auth.uid(), 'master'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "vendas_avulsas_insert"
ON public.vendas_avulsas FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = vendedor_id
  AND unidade_id = public.get_user_unidade(auth.uid())
);

CREATE POLICY "vendas_avulsas_update"
ON public.vendas_avulsas FOR UPDATE
TO authenticated
USING (
  public.can_access_unidade(auth.uid(), unidade_id)
  AND (
    auth.uid() = vendedor_id
    OR public.has_role(auth.uid(), 'franqueado'::app_role)
    OR public.has_role(auth.uid(), 'gestor'::app_role)
    OR public.has_role(auth.uid(), 'master'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "vendas_avulsas_delete"
ON public.vendas_avulsas FOR DELETE
TO authenticated
USING (
  public.can_access_unidade(auth.uid(), unidade_id)
  AND (
    auth.uid() = vendedor_id
    OR public.has_role(auth.uid(), 'franqueado'::app_role)
    OR public.has_role(auth.uid(), 'gestor'::app_role)
    OR public.has_role(auth.uid(), 'master'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);
