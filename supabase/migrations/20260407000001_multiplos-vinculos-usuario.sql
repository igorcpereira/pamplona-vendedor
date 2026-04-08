-- ============================================================
-- Migration: Múltiplos vínculos usuário-unidade-role
-- ============================================================
-- Cobre:
--  1.  Enum: adicionar 'master' e 'admin' a app_role
--  2.  fichas: adicionar campos faltantes
--  3.  fichas: migrar enviada_whatsapp → enviada_whatsapp_geral
--  4.  fichas: remover colunas obsoletas
--  5.  fichas: converter tipo para lowercase
--  6.  fichas: converter url_bucket e url_audio para path relativo
--  7.  fichas: adicionar unidade_id + retroalimentar
--  8.  clientes: remover colunas obsoletas
--  9.  clientes: adicionar unidade_id + retroalimentar
-- 10.  clientes: UNIQUE em telefone (pré-requisito de criar-cliente)
-- 11.  Criar tabela usuario_unidade_role
-- 12.  Migrar user_roles → usuario_unidade_role
-- 13.  Atualizar funções auxiliares
-- 14.  Reescrever RLS de fichas
-- 15.  Reescrever RLS de clientes
-- 16.  Criar RLS de usuario_unidade_role
-- ============================================================


-- ============================================================
-- 1. Enum: master e admin
-- ============================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'master';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';


-- ============================================================
-- 2. fichas: campos faltantes
-- ============================================================

ALTER TABLE public.fichas
  ADD COLUMN IF NOT EXISTS ocr_tentativa         integer,
  ADD COLUMN IF NOT EXISTS erro_etapa            text,
  ADD COLUMN IF NOT EXISTS cliente_encontrado    boolean,
  ADD COLUMN IF NOT EXISTS cliente_sugerido_id   uuid,
  ADD COLUMN IF NOT EXISTS cliente_sugerido_nome text,
  ADD COLUMN IF NOT EXISTS descricao_cliente     text,
  ADD COLUMN IF NOT EXISTS transcricao_audio     text,
  ADD COLUMN IF NOT EXISTS url_audio             text,
  ADD COLUMN IF NOT EXISTS tempo_processamento   integer,
  ADD COLUMN IF NOT EXISTS enviada_whatsapp_geral boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enviada_whatsapp_venda boolean NOT NULL DEFAULT false;


-- ============================================================
-- 3. fichas: migrar enviada_whatsapp → enviada_whatsapp_geral
--    Copia o valor antes de dropar a coluna
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'fichas'
      AND column_name  = 'enviada_whatsapp'
  ) THEN
    UPDATE public.fichas
    SET enviada_whatsapp_geral = enviada_whatsapp
    WHERE enviada_whatsapp IS NOT NULL;

    ALTER TABLE public.fichas DROP COLUMN enviada_whatsapp;
  END IF;
END $$;


-- ============================================================
-- 4. fichas: remover colunas obsoletas
-- ============================================================

ALTER TABLE public.fichas
  DROP COLUMN IF EXISTS vendedor_responsavel,
  DROP COLUMN IF EXISTS tags_url_audio;


-- ============================================================
-- 5. fichas: converter tipo para lowercase
--    Dropa o constraint primeiro, converte os dados, recria lowercase
-- ============================================================

ALTER TABLE public.fichas DROP CONSTRAINT IF EXISTS fichas_tipo_check;

UPDATE public.fichas
SET tipo = lower(tipo)
WHERE tipo IN ('Aluguel', 'Venda', 'Ajuste');

ALTER TABLE public.fichas
  ADD CONSTRAINT fichas_tipo_check
  CHECK (tipo IN ('aluguel', 'venda', 'ajuste'));


-- ============================================================
-- 6. fichas: converter url_bucket e url_audio para path relativo
--    Extrai apenas o nome do arquivo a partir da URL pública completa
--    Ex: https://xxx.supabase.co/storage/v1/object/public/fichas/abc.jpg → abc.jpg
-- ============================================================

UPDATE public.fichas
SET url_bucket = substring(url_bucket FROM '[^/]+$')
WHERE url_bucket LIKE 'https://%'
  AND url_bucket IS NOT NULL;

UPDATE public.fichas
SET url_audio = substring(url_audio FROM '[^/]+$')
WHERE url_audio LIKE 'https://%'
  AND url_audio IS NOT NULL;


-- ============================================================
-- 7. fichas: adicionar unidade_id
-- ============================================================

ALTER TABLE public.fichas
  ADD COLUMN IF NOT EXISTS unidade_id bigint REFERENCES public.unidades(id);

-- Retroalimentar a partir da unidade atual do vendedor
UPDATE public.fichas f
SET unidade_id = p.unidade_id
FROM public.profiles p
WHERE f.vendedor_id = p.id
  AND f.unidade_id IS NULL;

-- Fallback: fichas sem vendedor_id → Maringá (id = 1)
UPDATE public.fichas
SET unidade_id = 1
WHERE unidade_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_fichas_unidade_id ON public.fichas(unidade_id);


-- ============================================================
-- 8. clientes: remover colunas obsoletas
-- ============================================================

ALTER TABLE public.clientes
  DROP COLUMN IF EXISTS nome_vendedor,
  DROP COLUMN IF EXISTS ltv;


-- ============================================================
-- 9. clientes: adicionar unidade_id
-- ============================================================

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS unidade_id bigint REFERENCES public.unidades(id);

UPDATE public.clientes c
SET unidade_id = p.unidade_id
FROM public.profiles p
WHERE c.vendedor_id = p.id
  AND c.unidade_id IS NULL;

UPDATE public.clientes
SET unidade_id = 1
WHERE unidade_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_clientes_unidade_id ON public.clientes(unidade_id);


-- ============================================================
-- 10. clientes: UNIQUE em telefone (pré-requisito de criar-cliente)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clientes_telefone_unique'
      AND conrelid = 'public.clientes'::regclass
  ) THEN
    ALTER TABLE public.clientes
      ADD CONSTRAINT clientes_telefone_unique UNIQUE (telefone);
  END IF;
END $$;


-- ============================================================
-- 11. Criar tabela usuario_unidade_role
-- ============================================================

CREATE TABLE IF NOT EXISTS public.usuario_unidade_role (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unidade_id bigint  NOT NULL REFERENCES public.unidades(id),
  role       public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, unidade_id)
);

ALTER TABLE public.usuario_unidade_role ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_usuario_unidade_role_user_id
  ON public.usuario_unidade_role(user_id);


-- ============================================================
-- 12. Migrar user_roles → usuario_unidade_role
--     Em caso de múltiplas roles por usuário, mantém a mais alta
-- ============================================================

INSERT INTO public.usuario_unidade_role (user_id, unidade_id, role)
SELECT DISTINCT ON (ur.user_id)
  ur.user_id,
  p.unidade_id,
  ur.role
FROM public.user_roles ur
JOIN public.profiles p ON p.id = ur.user_id
ORDER BY
  ur.user_id,
  CASE ur.role
    WHEN 'gestor'     THEN 1
    WHEN 'franqueado' THEN 2
    WHEN 'vendedor'   THEN 3
    ELSE 9
  END
ON CONFLICT (user_id, unidade_id) DO NOTHING;


-- ============================================================
-- 13. Atualizar funções auxiliares
-- ============================================================

-- get_user_unidade: sem alteração na lógica, apenas garantir que está atualizada
CREATE OR REPLACE FUNCTION public.get_user_unidade(_user_id uuid)
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT unidade_id FROM public.profiles WHERE id = _user_id
$$;

-- has_role: verifica role do usuário na unidade ativa
-- master e admin são verificados globalmente
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuario_unidade_role
    WHERE user_id = _user_id
      AND role    = _role
      AND (
        _role IN ('master', 'admin')
        OR unidade_id = public.get_user_unidade(_user_id)
      )
  )
$$;

-- get_user_role: retorna a role mais alta na unidade ativa
-- Corrige bug anterior onde master e admin retornavam NULL
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role
  FROM public.usuario_unidade_role
  WHERE user_id = _user_id
    AND (
      role IN ('master', 'admin')
      OR unidade_id = public.get_user_unidade(_user_id)
    )
  ORDER BY
    CASE role
      WHEN 'admin'      THEN 1
      WHEN 'master'     THEN 2
      WHEN 'franqueado' THEN 3
      WHEN 'gestor'     THEN 4
      WHEN 'vendedor'   THEN 5
    END
  LIMIT 1
$$;

-- can_access_unidade: corrige bug onde gestor retornava true para qualquer unidade
-- Apenas master e admin têm acesso global
CREATE OR REPLACE FUNCTION public.can_access_unidade(_user_id uuid, _target_unidade_id bigint)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role    app_role;
  v_unidade bigint;
BEGIN
  v_role    := public.get_user_role(_user_id);
  v_unidade := public.get_user_unidade(_user_id);

  IF v_role IN ('admin', 'master') THEN
    RETURN true;
  END IF;

  RETURN v_unidade = _target_unidade_id;
END;
$$;

-- handle_new_user: passa a inserir em usuario_unidade_role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, unidade_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Vendedor'),
    1  -- Unidade padrão: Maringá
  );

  INSERT INTO public.usuario_unidade_role (user_id, unidade_id, role)
  VALUES (NEW.id, 1, 'vendedor'::app_role);

  RETURN NEW;
END;
$$;


-- ============================================================
-- 14. Reescrever RLS de fichas com filtro por unidade_id
-- ============================================================

DROP POLICY IF EXISTS "Controle de visualização de fichas por role"  ON public.fichas;
DROP POLICY IF EXISTS "Vendedores criam suas fichas"                  ON public.fichas;
DROP POLICY IF EXISTS "Controle de atualização de fichas por role"   ON public.fichas;
DROP POLICY IF EXISTS "Controle de exclusão de fichas por role"      ON public.fichas;
-- Limpa nomes antigos que possam existir
DROP POLICY IF EXISTS "fichas_select" ON public.fichas;
DROP POLICY IF EXISTS "fichas_insert" ON public.fichas;
DROP POLICY IF EXISTS "fichas_update" ON public.fichas;
DROP POLICY IF EXISTS "fichas_delete" ON public.fichas;

CREATE POLICY "fichas_select"
ON public.fichas FOR SELECT
TO authenticated
USING (
  public.can_access_unidade(auth.uid(), unidade_id)
  AND (
    auth.uid() = vendedor_id
    OR public.has_role(auth.uid(), 'gestor'::app_role)
    OR public.has_role(auth.uid(), 'franqueado'::app_role)
    OR public.has_role(auth.uid(), 'master'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "fichas_insert"
ON public.fichas FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = vendedor_id
  AND unidade_id = public.get_user_unidade(auth.uid())
);

CREATE POLICY "fichas_update"
ON public.fichas FOR UPDATE
TO authenticated
USING (
  public.can_access_unidade(auth.uid(), unidade_id)
  AND (
    auth.uid() = vendedor_id
    OR public.has_role(auth.uid(), 'gestor'::app_role)
    OR public.has_role(auth.uid(), 'franqueado'::app_role)
    OR public.has_role(auth.uid(), 'master'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
)
WITH CHECK (
  public.can_access_unidade(auth.uid(), unidade_id)
  AND (
    auth.uid() = vendedor_id
    OR public.has_role(auth.uid(), 'gestor'::app_role)
    OR public.has_role(auth.uid(), 'franqueado'::app_role)
    OR public.has_role(auth.uid(), 'master'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

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
  )
);


-- ============================================================
-- 15. Reescrever RLS de clientes com filtro por unidade_id
-- ============================================================

DROP POLICY IF EXISTS "Controle de visualização de clientes por role" ON public.clientes;
DROP POLICY IF EXISTS "Vendedores criam seus clientes"                ON public.clientes;
DROP POLICY IF EXISTS "Controle de atualização de clientes por role"  ON public.clientes;
DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update" ON public.clientes;

CREATE POLICY "clientes_select"
ON public.clientes FOR SELECT
TO authenticated
USING (
  public.can_access_unidade(auth.uid(), unidade_id)
  AND (
    auth.uid() = vendedor_id
    OR public.has_role(auth.uid(), 'gestor'::app_role)
    OR public.has_role(auth.uid(), 'franqueado'::app_role)
    OR public.has_role(auth.uid(), 'master'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "clientes_insert"
ON public.clientes FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = vendedor_id
  AND unidade_id = public.get_user_unidade(auth.uid())
);

CREATE POLICY "clientes_update"
ON public.clientes FOR UPDATE
TO authenticated
USING (
  public.can_access_unidade(auth.uid(), unidade_id)
  AND (
    auth.uid() = vendedor_id
    OR public.has_role(auth.uid(), 'gestor'::app_role)
    OR public.has_role(auth.uid(), 'franqueado'::app_role)
    OR public.has_role(auth.uid(), 'master'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
)
WITH CHECK (
  public.can_access_unidade(auth.uid(), unidade_id)
  AND (
    auth.uid() = vendedor_id
    OR public.has_role(auth.uid(), 'gestor'::app_role)
    OR public.has_role(auth.uid(), 'franqueado'::app_role)
    OR public.has_role(auth.uid(), 'master'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);


-- ============================================================
-- 16. RLS de usuario_unidade_role
-- ============================================================

DROP POLICY IF EXISTS "usuario_unidade_role_select" ON public.usuario_unidade_role;
DROP POLICY IF EXISTS "usuario_unidade_role_insert"  ON public.usuario_unidade_role;
DROP POLICY IF EXISTS "usuario_unidade_role_update"  ON public.usuario_unidade_role;
DROP POLICY IF EXISTS "usuario_unidade_role_delete"  ON public.usuario_unidade_role;

-- Usuário vê apenas seus próprios vínculos
CREATE POLICY "usuario_unidade_role_select"
ON public.usuario_unidade_role FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin e master gerenciam vínculos de qualquer usuário
-- Usuário regular não pode inserir vínculos — apenas recebe via admin/master
CREATE POLICY "usuario_unidade_role_insert"
ON public.usuario_unidade_role FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'master'::app_role)
);

CREATE POLICY "usuario_unidade_role_update"
ON public.usuario_unidade_role FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'master'::app_role)
);

CREATE POLICY "usuario_unidade_role_delete"
ON public.usuario_unidade_role FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'master'::app_role)
);
