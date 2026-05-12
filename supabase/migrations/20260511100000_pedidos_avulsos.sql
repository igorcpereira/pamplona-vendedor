-- ============================================================
-- 1. Tabela pedidos
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pedidos (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id      uuid        NOT NULL REFERENCES public.fichas(id) ON DELETE CASCADE,
  vendedor_id   uuid        NOT NULL REFERENCES auth.users(id),
  unidade_id    bigint      NOT NULL REFERENCES public.unidades(id),
  pago          boolean     NOT NULL DEFAULT false,
  garantia      numeric(10,2),
  valor_total   numeric(10,2) NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_ficha_id    ON public.pedidos(ficha_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_vendedor_id ON public.pedidos(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_unidade_id  ON public.pedidos(unidade_id);

-- reutiliza set_updated_at() criada em 20260511000002
CREATE TRIGGER trg_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- 2. Migrar dados existentes de itens_avulsos_ficha → pedidos
-- ============================================================

INSERT INTO public.pedidos (ficha_id, vendedor_id, unidade_id, pago, valor_total, created_at)
SELECT
  i.ficha_id,
  i.vendedor_id,
  i.unidade_id,
  false AS pago,
  COALESCE(SUM(i.quantidade * COALESCE(i.valor_unitario, 0)), 0) AS valor_total,
  MIN(i.created_at) AS created_at
FROM public.itens_avulsos_ficha i
GROUP BY i.ficha_id, i.vendedor_id, i.unidade_id;


-- ============================================================
-- 3. Modificar itens_avulsos_ficha: vincular a pedidos
-- ============================================================

-- 3a. Adicionar pedido_id (nullable temporariamente para popular)
ALTER TABLE public.itens_avulsos_ficha
  ADD COLUMN IF NOT EXISTS pedido_id uuid REFERENCES public.pedidos(id) ON DELETE CASCADE;

-- 3b. Popular pedido_id com base no par original (ficha_id, vendedor_id)
UPDATE public.itens_avulsos_ficha i
SET pedido_id = p.id
FROM public.pedidos p
WHERE p.ficha_id = i.ficha_id
  AND p.vendedor_id = i.vendedor_id;

-- 3c. Tornar NOT NULL após popular
ALTER TABLE public.itens_avulsos_ficha
  ALTER COLUMN pedido_id SET NOT NULL;

-- 3d. Remover constraint UNIQUE antiga
ALTER TABLE public.itens_avulsos_ficha
  DROP CONSTRAINT IF EXISTS itens_avulsos_ficha_ficha_id_tipo_item_vendedor_id_key;

-- 3e. Nova UNIQUE por pedido
ALTER TABLE public.itens_avulsos_ficha
  ADD CONSTRAINT itens_avulsos_ficha_pedido_id_tipo_item_key
  UNIQUE (pedido_id, tipo_item);

-- 3f. Remover colunas que agora ficam no pedido
ALTER TABLE public.itens_avulsos_ficha
  DROP COLUMN IF EXISTS ficha_id,
  DROP COLUMN IF EXISTS vendedor_id,
  DROP COLUMN IF EXISTS unidade_id;

-- 3g. Atualizar índices
DROP INDEX IF EXISTS idx_itens_avulsos_ficha_id;
DROP INDEX IF EXISTS idx_itens_avulsos_vendedor_id;
DROP INDEX IF EXISTS idx_itens_avulsos_unidade_id;
CREATE INDEX IF NOT EXISTS idx_itens_avulsos_pedido_id ON public.itens_avulsos_ficha(pedido_id);


-- ============================================================
-- 4. Trigger: manter valor_total do pedido sincronizado
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_pedido_valor_total()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_pedido_id uuid;
BEGIN
  v_pedido_id := COALESCE(NEW.pedido_id, OLD.pedido_id);

  UPDATE public.pedidos
  SET valor_total = COALESCE((
    SELECT SUM(quantidade * COALESCE(valor_unitario, 0))
    FROM public.itens_avulsos_ficha
    WHERE pedido_id = v_pedido_id
  ), 0)
  WHERE id = v_pedido_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_pedido_valor_total
  AFTER INSERT OR UPDATE OR DELETE ON public.itens_avulsos_ficha
  FOR EACH ROW EXECUTE FUNCTION public.sync_pedido_valor_total();


-- ============================================================
-- 5. RLS em pedidos
-- ============================================================

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedidos_select"
ON public.pedidos FOR SELECT TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id));

CREATE POLICY "pedidos_insert"
ON public.pedidos FOR INSERT TO authenticated
WITH CHECK (unidade_id = public.get_user_unidade(auth.uid()));

CREATE POLICY "pedidos_update"
ON public.pedidos FOR UPDATE TO authenticated
USING (
  public.can_access_unidade(auth.uid(), unidade_id)
  AND (
    vendedor_id = auth.uid()
    OR public.has_role(auth.uid(), 'gestor'::app_role)
    OR public.has_role(auth.uid(), 'franqueado'::app_role)
    OR public.has_role(auth.uid(), 'master'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'administrativo'::app_role)
  )
)
WITH CHECK (
  public.can_access_unidade(auth.uid(), unidade_id)
  AND (
    vendedor_id = auth.uid()
    OR public.has_role(auth.uid(), 'gestor'::app_role)
    OR public.has_role(auth.uid(), 'franqueado'::app_role)
    OR public.has_role(auth.uid(), 'master'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'administrativo'::app_role)
  )
);
-- DELETE bloqueado intencionalmente


-- ============================================================
-- 6. Atualizar RLS em itens_avulsos_ficha (acesso via pedido pai)
-- ============================================================

DROP POLICY IF EXISTS "itens_avulsos_select" ON public.itens_avulsos_ficha;
DROP POLICY IF EXISTS "itens_avulsos_insert" ON public.itens_avulsos_ficha;
DROP POLICY IF EXISTS "itens_avulsos_update" ON public.itens_avulsos_ficha;
DROP POLICY IF EXISTS "itens_avulsos_delete" ON public.itens_avulsos_ficha;

CREATE POLICY "itens_avulsos_select"
ON public.itens_avulsos_ficha FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = pedido_id
      AND public.can_access_unidade(auth.uid(), p.unidade_id)
  )
);

CREATE POLICY "itens_avulsos_insert"
ON public.itens_avulsos_ficha FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = pedido_id AND p.vendedor_id = auth.uid()
  )
);

CREATE POLICY "itens_avulsos_update"
ON public.itens_avulsos_ficha FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = pedido_id AND p.vendedor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = pedido_id AND p.vendedor_id = auth.uid()
  )
);

CREATE POLICY "itens_avulsos_delete"
ON public.itens_avulsos_ficha FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = pedido_id AND p.vendedor_id = auth.uid()
  )
);
