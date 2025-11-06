-- ================================================
-- FASE 1: Criar enum e tabela de roles
-- ================================================

-- Criar enum para roles da aplicação
CREATE TYPE public.app_role AS ENUM ('gestor', 'franqueado', 'vendedor');

-- Criar tabela de user_roles (roles em tabela separada por segurança)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas suas próprias roles
CREATE POLICY "Usuários veem suas próprias roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- ================================================
-- FASE 2: Adicionar unidade_id em profiles
-- ================================================

-- Adicionar coluna unidade_id em profiles (nullable primeiro)
ALTER TABLE public.profiles 
ADD COLUMN unidade_id bigint REFERENCES public.unidades(id);

-- Migrar dados existentes: atribuir todos os usuários à unidade de Maringá (id = 1)
UPDATE public.profiles 
SET unidade_id = 1 
WHERE unidade_id IS NULL;

-- Tornar a coluna NOT NULL após migration
ALTER TABLE public.profiles 
ALTER COLUMN unidade_id SET NOT NULL;

-- Criar índice para performance
CREATE INDEX idx_profiles_unidade_id ON public.profiles(unidade_id);

-- ================================================
-- FASE 3: Migrar roles existentes para user_roles
-- ================================================

-- Migrar roles da tabela profiles para user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT 
  id,
  CASE 
    WHEN role = 'Gestor' THEN 'gestor'::app_role
    WHEN role = 'Franqueado' THEN 'franqueado'::app_role
    ELSE 'vendedor'::app_role
  END
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- ================================================
-- FASE 4: Criar functions helpers de segurança
-- ================================================

-- Function: Verificar se usuário tem uma role específica
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function: Obter role principal do usuário (primeira encontrada)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'gestor' THEN 1
      WHEN 'franqueado' THEN 2
      WHEN 'vendedor' THEN 3
    END
  LIMIT 1
$$;

-- Function: Obter unidade do usuário
CREATE OR REPLACE FUNCTION public.get_user_unidade(_user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unidade_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Function: Verificar se usuário pode acessar dados de uma unidade
CREATE OR REPLACE FUNCTION public.can_access_unidade(_user_id uuid, _target_unidade_id bigint)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  user_unidade_id bigint;
BEGIN
  -- Obter role e unidade do usuário
  user_role := public.get_user_role(_user_id);
  user_unidade_id := public.get_user_unidade(_user_id);
  
  -- Gestores veem todas as unidades
  IF user_role = 'gestor' THEN
    RETURN true;
  END IF;
  
  -- Franqueados veem apenas sua unidade
  IF user_role = 'franqueado' THEN
    RETURN user_unidade_id = _target_unidade_id;
  END IF;
  
  -- Vendedores não têm acesso baseado em unidade (apenas seus próprios dados)
  RETURN false;
END;
$$;

-- ================================================
-- FASE 5: Atualizar RLS policies de profiles
-- ================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "Usuários veem seu perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários atualizam seu perfil" ON public.profiles;

-- Policy: Vendedores veem apenas seu próprio perfil
-- Franqueados veem perfis da sua unidade
-- Gestores veem todos os perfis
CREATE POLICY "Controle de acesso por role e unidade"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR -- Próprio perfil
  public.has_role(auth.uid(), 'gestor') OR -- Gestor vê todos
  (public.has_role(auth.uid(), 'franqueado') AND unidade_id = public.get_user_unidade(auth.uid())) -- Franqueado vê sua unidade
);

-- Policy: Usuários atualizam apenas seu próprio perfil
CREATE POLICY "Usuários atualizam próprio perfil"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ================================================
-- FASE 6: Atualizar RLS policies de fichas
-- ================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "Vendedores veem apenas suas fichas" ON public.fichas;
DROP POLICY IF EXISTS "Vendedores criam fichas para si" ON public.fichas;
DROP POLICY IF EXISTS "Vendedores atualizam suas fichas" ON public.fichas;
DROP POLICY IF EXISTS "Vendedores deletam suas fichas" ON public.fichas;

-- Policy SELECT: Vendedores veem suas fichas, Franqueados veem fichas da unidade, Gestores veem todas
CREATE POLICY "Controle de visualização de fichas por role"
ON public.fichas
FOR SELECT
USING (
  auth.uid() = vendedor_id OR -- Vendedor vê suas fichas
  public.has_role(auth.uid(), 'gestor') OR -- Gestor vê todas
  (public.has_role(auth.uid(), 'franqueado') AND 
   EXISTS (
     SELECT 1 FROM public.profiles 
     WHERE id = vendedor_id 
     AND unidade_id = public.get_user_unidade(auth.uid())
   )) -- Franqueado vê fichas de vendedores da sua unidade
);

-- Policy INSERT: Vendedores criam fichas para si
CREATE POLICY "Vendedores criam suas fichas"
ON public.fichas
FOR INSERT
WITH CHECK (auth.uid() = vendedor_id);

-- Policy UPDATE: Vendedores atualizam suas fichas, Franqueados atualizam fichas da unidade, Gestores atualizam todas
CREATE POLICY "Controle de atualização de fichas por role"
ON public.fichas
FOR UPDATE
USING (
  auth.uid() = vendedor_id OR
  public.has_role(auth.uid(), 'gestor') OR
  (public.has_role(auth.uid(), 'franqueado') AND 
   EXISTS (
     SELECT 1 FROM public.profiles 
     WHERE id = vendedor_id 
     AND unidade_id = public.get_user_unidade(auth.uid())
   ))
)
WITH CHECK (
  auth.uid() = vendedor_id OR
  public.has_role(auth.uid(), 'gestor') OR
  (public.has_role(auth.uid(), 'franqueado') AND 
   EXISTS (
     SELECT 1 FROM public.profiles 
     WHERE id = vendedor_id 
     AND unidade_id = public.get_user_unidade(auth.uid())
   ))
);

-- Policy DELETE: Vendedores deletam suas fichas, Franqueados deletam fichas da unidade, Gestores deletam todas
CREATE POLICY "Controle de exclusão de fichas por role"
ON public.fichas
FOR DELETE
USING (
  auth.uid() = vendedor_id OR
  public.has_role(auth.uid(), 'gestor') OR
  (public.has_role(auth.uid(), 'franqueado') AND 
   EXISTS (
     SELECT 1 FROM public.profiles 
     WHERE id = vendedor_id 
     AND unidade_id = public.get_user_unidade(auth.uid())
   ))
);

-- ================================================
-- FASE 7: Atualizar RLS policies de clientes
-- ================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "Vendedores veem apenas seus clientes" ON public.clientes;
DROP POLICY IF EXISTS "Vendedores criam seus clientes" ON public.clientes;
DROP POLICY IF EXISTS "Vendedores atualizam seus clientes" ON public.clientes;

-- Policy SELECT: Similar a fichas
CREATE POLICY "Controle de visualização de clientes por role"
ON public.clientes
FOR SELECT
USING (
  auth.uid() = vendedor_id OR
  public.has_role(auth.uid(), 'gestor') OR
  (public.has_role(auth.uid(), 'franqueado') AND 
   EXISTS (
     SELECT 1 FROM public.profiles 
     WHERE id = vendedor_id 
     AND unidade_id = public.get_user_unidade(auth.uid())
   ))
);

-- Policy INSERT
CREATE POLICY "Vendedores criam seus clientes"
ON public.clientes
FOR INSERT
WITH CHECK (auth.uid() = vendedor_id);

-- Policy UPDATE
CREATE POLICY "Controle de atualização de clientes por role"
ON public.clientes
FOR UPDATE
USING (
  auth.uid() = vendedor_id OR
  public.has_role(auth.uid(), 'gestor') OR
  (public.has_role(auth.uid(), 'franqueado') AND 
   EXISTS (
     SELECT 1 FROM public.profiles 
     WHERE id = vendedor_id 
     AND unidade_id = public.get_user_unidade(auth.uid())
   ))
)
WITH CHECK (
  auth.uid() = vendedor_id OR
  public.has_role(auth.uid(), 'gestor') OR
  (public.has_role(auth.uid(), 'franqueado') AND 
   EXISTS (
     SELECT 1 FROM public.profiles 
     WHERE id = vendedor_id 
     AND unidade_id = public.get_user_unidade(auth.uid())
   ))
);

-- ================================================
-- FASE 8: Atualizar trigger de criação de usuário
-- ================================================

-- Recriar function handle_new_user para incluir unidade padrão e role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir perfil com unidade padrão (Maringá = 1)
  INSERT INTO public.profiles (id, nome, unidade_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Vendedor'),
    1 -- Unidade padrão: Maringá
  );
  
  -- Inserir role padrão (vendedor)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'vendedor'::app_role);
  
  RETURN NEW;
END;
$$;