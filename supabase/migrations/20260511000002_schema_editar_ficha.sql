-- Alterações de schema para as novas features de editar ficha:
--  1. tags: campo padrao
--  2. fichas: campos de detalhes do item (cor, lanifício, fios, sapato)
--  3. Nova tabela itens_avulsos_ficha com UNIQUE, CHECK, trigger e RLS

-- ============================================================
-- 1. tags: campo padrao
-- ============================================================

ALTER TABLE public.tags
  ADD COLUMN IF NOT EXISTS padrao boolean NOT NULL DEFAULT false;


-- ============================================================
-- 2. fichas: campos de detalhes do item
-- ============================================================

ALTER TABLE public.fichas
  ADD COLUMN IF NOT EXISTS paleto_cor text
    CHECK (paleto_cor IN ('Azul', 'Preto', 'Cinza', 'Outros')),
  ADD COLUMN IF NOT EXISTS paleto_lanificio text
    CHECK (paleto_lanificio IN ('Reda', 'Paramount', 'Canonico', 'Pietro di Mosso')),
  ADD COLUMN IF NOT EXISTS camisa_fios text
    CHECK (camisa_fios IN ('140', '120', '100')),
  ADD COLUMN IF NOT EXISTS camisa_cor text
    CHECK (camisa_cor IN ('Branco', 'Outros')),
  ADD COLUMN IF NOT EXISTS sapato_tipo text
    CHECK (sapato_tipo IN ('Casual', 'Social'));


-- ============================================================
-- 3. Nova tabela itens_avulsos_ficha
-- ============================================================

CREATE TABLE IF NOT EXISTS public.itens_avulsos_ficha (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id      uuid        NOT NULL REFERENCES public.fichas(id) ON DELETE CASCADE,
  vendedor_id   uuid        NOT NULL REFERENCES auth.users(id),
  unidade_id    bigint      NOT NULL REFERENCES public.unidades(id),
  tipo_item     text        NOT NULL
    CHECK (tipo_item IN ('camiseta', 'gravata', 'sapato', 'meia', 'cinto')),
  quantidade    integer     NOT NULL DEFAULT 0,
  valor_unitario numeric(10,2),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  -- Um registro por tipo por vendedor por ficha.
  -- Mesmo vendedor faz upsert; vendedores diferentes têm entradas independentes.
  UNIQUE (ficha_id, tipo_item, vendedor_id)
);

CREATE INDEX IF NOT EXISTS idx_itens_avulsos_ficha_id
  ON public.itens_avulsos_ficha(ficha_id);
CREATE INDEX IF NOT EXISTS idx_itens_avulsos_vendedor_id
  ON public.itens_avulsos_ficha(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_itens_avulsos_unidade_id
  ON public.itens_avulsos_ficha(unidade_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_itens_avulsos_updated_at
  BEFORE UPDATE ON public.itens_avulsos_ficha
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.itens_avulsos_ficha ENABLE ROW LEVEL SECURITY;

CREATE POLICY "itens_avulsos_select"
ON public.itens_avulsos_ficha FOR SELECT
TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id));

CREATE POLICY "itens_avulsos_insert"
ON public.itens_avulsos_ficha FOR INSERT
TO authenticated
WITH CHECK (unidade_id = public.get_user_unidade(auth.uid()));

CREATE POLICY "itens_avulsos_update"
ON public.itens_avulsos_ficha FOR UPDATE
TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id))
WITH CHECK (public.can_access_unidade(auth.uid(), unidade_id));

CREATE POLICY "itens_avulsos_delete"
ON public.itens_avulsos_ficha FOR DELETE
TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id));
