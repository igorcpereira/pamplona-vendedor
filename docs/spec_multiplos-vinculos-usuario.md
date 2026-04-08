# Spec — Múltiplos Vínculos Usuário-Unidade-Role

## Visão geral

| | |
|---|---|
| **Status** | 🔲 A implementar |
| **Propósito** | Suportar múltiplos vínculos usuário-unidade-role com conceito de unidade ativa na sessão |
| **Escopo** | Banco (schema + RLS), funções auxiliares, frontend |
| **Motivação** | Um usuário pode trabalhar em mais de uma unidade com roles distintas. O modelo atual de `profiles.unidade_id` (campo único) e `user_roles` (role global, sem unidade) não suporta esse cenário |

---

## Estado atual — o que existe hoje

### Banco

```
profiles.unidade_id  → bigint, FK unidades(id), NOT NULL — uma única unidade por usuário
user_roles           → (user_id, role) com UNIQUE (user_id, role) — role global, sem unidade
```

### Enum `app_role`

O enum atual tem apenas três valores:

```sql
CREATE TYPE app_role AS ENUM ('gestor', 'franqueado', 'vendedor');
```

`master` e `admin` **não existem no enum**. As políticas RLS que os referenciam (`has_role(auth.uid(), 'master'::app_role)`) falham silenciosamente em runtime — o cast para `app_role` não é válido.

### Funções auxiliares

| Função | Comportamento atual | Problema |
|---|---|---|
| `has_role(user_id, role)` | Busca em `user_roles` sem filtro de unidade — role é global | Uma role vale para todas as unidades |
| `get_user_role(user_id)` | Retorna a role mais alta (gestor > franqueado > vendedor) | `master` e `admin` não estão no CASE — retornam `NULL` |
| `get_user_unidade(user_id)` | Lê `profiles.unidade_id` — ok para conceito de unidade ativa | Nenhum |
| `can_access_unidade(user_id, unidade_id)` | Gestor retorna `true` para qualquer unidade | Bug: gestor deve ver apenas a própria unidade; quem vê tudo é `master`/`admin` |

---

## Modelo proposto

### Princípios

- **Unidade ativa na sessão:** `profiles.unidade_id` continua sendo a unidade ativa. Quando o usuário muda de unidade, esse campo é atualizado. Toda a RLS continua usando `get_user_unidade()`.
- **Vínculo por unidade:** cada linha de `usuario_unidade_role` representa `(usuário, unidade, role)`. Um usuário pode ter papéis diferentes em unidades diferentes.
- **Master e admin:** operam de forma global. São vinculados à unidade de nome **"Todas"** em `usuario_unidade_role`. `has_role()` para essas roles ignora a unidade ativa e sempre retorna `true` se o vínculo existir.
- **Deprecação progressiva:** `user_roles` e `profiles.role` são deprecated após a migração dos dados. Ficam no banco até remoção confirmada.

---

## Mudanças no banco

### 1 — Adicionar `master` e `admin` ao enum `app_role`

```sql
ALTER TYPE public.app_role ADD VALUE 'master';
ALTER TYPE public.app_role ADD VALUE 'admin';
```

> ⚠️ Valores de enum não podem ser removidos depois de adicionados sem recriar o tipo. Garantir que os nomes estão corretos antes de executar.

---

### 2 — Criar tabela `usuario_unidade_role`

```sql
CREATE TABLE public.usuario_unidade_role (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  unidade_id bigint  REFERENCES public.unidades(id) NOT NULL,
  role       public.app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, unidade_id)  -- um usuário tem uma única role por unidade
);

ALTER TABLE public.usuario_unidade_role ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_usuario_unidade_role_user_id ON public.usuario_unidade_role(user_id);
```

**Regra de negócio:** um usuário só pode ter uma role por unidade. Se João é gestor em Maringá, não pode ser simultaneamente vendedor em Maringá — só pode ter roles distintas em unidades distintas.

---

### 3 — Migrar dados de `user_roles` para `usuario_unidade_role`

```sql
INSERT INTO public.usuario_unidade_role (user_id, unidade_id, role)
SELECT ur.user_id, p.unidade_id, ur.role
FROM public.user_roles ur
JOIN public.profiles p ON p.id = ur.user_id
ON CONFLICT (user_id, unidade_id) DO NOTHING;
```

> Usuários com múltiplas roles em `user_roles` (ex: gestor + vendedor no mesmo usuário) terão apenas a primeira migrada por conflito de `UNIQUE (user_id, unidade_id)`. Revisar manualmente se existirem casos assim antes de executar.

---

### 4 — Atualizar `handle_new_user()`

O trigger de criação de usuário deve inserir em `usuario_unidade_role` ao invés de (ou além de) `user_roles`:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
```

---

## Atualização das funções auxiliares

### `has_role()`

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuario_unidade_role
    WHERE user_id = _user_id
      AND role = _role
      AND (
        -- master e admin: válidos globalmente, independente da unidade ativa
        _role IN ('master', 'admin')
        OR
        -- demais roles: válidas apenas na unidade ativa da sessão
        unidade_id = public.get_user_unidade(_user_id)
      )
  )
$$;
```

### `get_user_role()`

```sql
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role
  FROM public.usuario_unidade_role
  WHERE user_id = _user_id
    AND (
      role IN ('master', 'admin')
      OR unidade_id = public.get_user_unidade(_user_id)
    )
  ORDER BY
    CASE role
      WHEN 'admin'     THEN 1
      WHEN 'master'    THEN 2
      WHEN 'franqueado' THEN 3
      WHEN 'gestor'    THEN 4
      WHEN 'vendedor'  THEN 5
    END
  LIMIT 1
$$;
```

> Corrige o bug atual onde `master` e `admin` retornavam `NULL`.

### `get_user_unidade()`

Sem alteração — continua lendo `profiles.unidade_id`.

### `can_access_unidade()` — corrigir bug

```sql
CREATE OR REPLACE FUNCTION public.can_access_unidade(_user_id uuid, _target_unidade_id bigint)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_role app_role;
  user_unidade bigint;
BEGIN
  user_role    := public.get_user_role(_user_id);
  user_unidade := public.get_user_unidade(_user_id);

  -- master e admin enxergam tudo
  IF user_role IN ('admin', 'master') THEN RETURN true; END IF;

  -- demais roles: apenas a unidade ativa
  RETURN user_unidade = _target_unidade_id;
END;
$$;
```

> Corrige o bug atual onde `gestor` retornava `true` para qualquer unidade. Agora apenas `master` e `admin` têm acesso irrestrito.

---

## Adicionar `unidade_id` em `fichas` e `clientes`

A tabela `fichas` não tem `unidade_id` — ela só tem `vendedor_id`. Se filtrarmos pela unidade ativa do vendedor em tempo de query, uma ficha criada em Maringá desaparece quando o vendedor troca para Londrina. O correto é gravar a unidade **na ficha no momento da criação**.

O mesmo se aplica a `clientes`.

### Migration

```sql
-- fichas
ALTER TABLE public.fichas ADD COLUMN unidade_id bigint REFERENCES public.unidades(id);

-- Retroalimentar fichas existentes com a unidade do vendedor
UPDATE public.fichas f
SET unidade_id = p.unidade_id
FROM public.profiles p
WHERE f.vendedor_id = p.id
  AND f.unidade_id IS NULL;

CREATE INDEX idx_fichas_unidade_id ON public.fichas(unidade_id);

-- clientes
ALTER TABLE public.clientes ADD COLUMN unidade_id bigint REFERENCES public.unidades(id);

UPDATE public.clientes c
SET unidade_id = p.unidade_id
FROM public.profiles p
WHERE c.vendedor_id = p.id
  AND c.unidade_id IS NULL;

CREATE INDEX idx_clientes_unidade_id ON public.clientes(unidade_id);
```

> ⚠️ A retroalimentação usa `profiles.unidade_id` atual de cada vendedor. Para fichas/clientes criados antes desta migration, a unidade gravada reflete onde o vendedor está hoje — não necessariamente onde o registro foi criado. Aceitável dado que hoje todos os vendedores estão em Maringá.

### Preencher `unidade_id` na criação

**`processar-ficha-v2`** deve passar `unidade_id` ao criar a ficha no banco (Etapa 2). O valor vem de `profiles.unidade_id` do vendedor autenticado — já consultado na função para validar o `user_id`.

**`salvar-ficha`** deve passar `unidade_id` ao criar o cliente em `criar-cliente` e ao atualizar a ficha.

---

## RLS por tabela — o que muda

### `fichas`

Remover as policies existentes e recriar com filtro por `fichas.unidade_id`:

```sql
-- Remover policies antigas
DROP POLICY IF EXISTS "Controle de visualização de fichas por role" ON public.fichas;
DROP POLICY IF EXISTS "Vendedores criam suas fichas" ON public.fichas;
DROP POLICY IF EXISTS "Controle de atualização de fichas por role" ON public.fichas;
DROP POLICY IF EXISTS "Controle de exclusão de fichas por role" ON public.fichas;

-- SELECT: vendedor e demais roles veem fichas da unidade ativa
CREATE POLICY "Fichas da unidade ativa"
ON public.fichas FOR SELECT
USING (
  public.can_access_unidade(auth.uid(), unidade_id)
  AND (
    auth.uid() = vendedor_id  -- vendedor vê as suas
    OR public.has_role(auth.uid(), 'gestor'::app_role)
    OR public.has_role(auth.uid(), 'franqueado'::app_role)
    OR public.has_role(auth.uid(), 'master'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- INSERT: vendedor cria ficha na própria unidade ativa
CREATE POLICY "Vendedor cria ficha na unidade ativa"
ON public.fichas FOR INSERT
WITH CHECK (
  auth.uid() = vendedor_id
  AND unidade_id = public.get_user_unidade(auth.uid())
);

-- UPDATE: mesma lógica do SELECT
CREATE POLICY "Fichas da unidade ativa — atualização"
ON public.fichas FOR UPDATE
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
```

### `clientes`

Mesma lógica de `fichas` — filtrar por `clientes.unidade_id`:

```sql
DROP POLICY IF EXISTS "Controle de visualização de clientes por role" ON public.clientes;
DROP POLICY IF EXISTS "Vendedores criam seus clientes" ON public.clientes;
DROP POLICY IF EXISTS "Controle de atualização de clientes por role" ON public.clientes;

CREATE POLICY "Clientes da unidade ativa"
ON public.clientes FOR SELECT
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

CREATE POLICY "Vendedor cria cliente na unidade ativa"
ON public.clientes FOR INSERT
WITH CHECK (
  auth.uid() = vendedor_id
  AND unidade_id = public.get_user_unidade(auth.uid())
);

CREATE POLICY "Clientes da unidade ativa — atualização"
ON public.clientes FOR UPDATE
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
```

### `profiles`

Sem alteração nas policies — já funciona corretamente com as funções atualizadas.

### `usuario_unidade_role`

```sql
-- Usuário vê apenas seus próprios vínculos
CREATE POLICY "Usuário vê seus vínculos"
ON public.usuario_unidade_role FOR SELECT
USING (auth.uid() = user_id);

-- Admin e master gerenciam vínculos de qualquer usuário
CREATE POLICY "Admin gerencia vínculos"
ON public.usuario_unidade_role FOR ALL
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'master'::app_role)
);
```

### `user_roles`

Manter policies existentes enquanto a tabela não for removida.

---

## Fluxo de seleção de unidade — frontend

### Após login

```
Usuário faz login (Supabase Auth)
  → frontend busca usuario_unidade_role WHERE user_id = auth.uid()
    → 1 resultado → seleciona automaticamente
        → atualiza profiles.unidade_id se necessário
        → redireciona para home
    → N resultados → exibe tela de seleção de unidade
        → lista: "Maringá — Gestor", "Londrina — Vendedor"
        → usuário seleciona
          → atualiza profiles.unidade_id via Supabase client
          → redireciona para home
```

### Trocar unidade sem logout

Um seletor deve estar disponível no app (header ou menu) para usuários com mais de uma unidade.

```
Usuário acessa seletor de unidade
  → exibe apenas as unidades de usuario_unidade_role deste usuário
    (master/admin veem todas as unidades para escolher onde operar)
  → usuário seleciona nova unidade
    → atualiza profiles.unidade_id
    → frontend recarrega dados da nova unidade
```

### Como atualizar a unidade ativa

A troca de unidade é uma atualização direta no Supabase client — não precisa de edge function:

```typescript
await supabase
  .from('profiles')
  .update({ unidade_id: novaUnidadeId })
  .eq('id', userId)
```

> A policy `"Usuários atualizam próprio perfil"` já permite isso — o usuário pode atualizar apenas o próprio perfil.

---

## Tela de seleção de unidade

A tela é exibida após login quando o usuário tem mais de uma unidade. É uma tela simples — não faz parte do fluxo principal do app.

**O que exibir:**

```
Selecione em qual unidade você está trabalhando hoje

[ Maringá — Gestor       ]
[ Londrina — Vendedor    ]
```

**Dados necessários:**

```typescript
// Query para montar a lista
const { data } = await supabase
  .from('usuario_unidade_role')
  .select('role, unidade:unidades(id, nome)')
  .eq('user_id', userId)
```

---

## Deprecação progressiva

Após a migration e validação em produção:

| Artefato | Ação | Quando |
|---|---|---|
| `user_roles` | Manter durante transição — remover após estabilização | Ciclo seguinte |
| `profiles.role` | Manter durante transição — remover após estabilização | Ciclo seguinte |
| `can_access_unidade()` — versão antiga | Sobrescrita pela nova versão nesta migration | Nesta migration |
| `has_role()` — versão antiga | Sobrescrita pela nova versão nesta migration | Nesta migration |

---

## Impacto em outros documentos

| Documento | O que atualizar |
|---|---|
| `controle_de_acesso.md` | Remover pendências de múltiplos vínculos e roles — implementadas. Atualizar seção de funções auxiliares com novas implementações |
| `modelo_de_dados.md` | Adicionar `usuario_unidade_role` ao diagrama e tabelas. Marcar `user_roles` como deprecated |
| `roadmap.md` | Mover "Suporte a múltiplos vínculos" de "Futuro" para "Em implementação" ou "Produção" |

---

## Ordem de execução da migration

1. `ALTER TYPE app_role ADD VALUE 'master'` + `'admin'`
2. `CREATE TABLE usuario_unidade_role` + índice + RLS
3. Migrar dados de `user_roles` → `usuario_unidade_role`
4. `ALTER TABLE fichas ADD COLUMN unidade_id` + retroalimentação
5. `ALTER TABLE clientes ADD COLUMN unidade_id` + retroalimentação
6. `CREATE OR REPLACE FUNCTION has_role()` — nova versão
7. `CREATE OR REPLACE FUNCTION get_user_role()` — nova versão
8. `CREATE OR REPLACE FUNCTION can_access_unidade()` — corrigida
9. `CREATE OR REPLACE FUNCTION handle_new_user()` — atualizada
10. Recriar policies de `fichas` (drop + create)
11. Recriar policies de `clientes` (drop + create)
12. Validar em dev antes de aplicar em produção

> ⚠️ Executar em uma única migration. Se qualquer etapa falhar, reverter tudo.

---

## Impacto em edge functions

| Função | O que atualizar |
|---|---|
| `processar-ficha-v2` | Etapa 2: incluir `unidade_id` no INSERT da ficha — valor vem do `user_id` via lookup em `profiles` |
| `salvar-ficha` | Incluir `unidade_id` no UPDATE da ficha e no input de `criar-cliente` |
| `criar-cliente` | Incluir `unidade_id` no INSERT do cliente |

---

## Pendências

| Pendência | Impacto |
|---|---|
| Verificar se existem usuários com múltiplas roles em `user_roles` antes de migrar | Conflito de UNIQUE pode deixar roles sem migrar — revisar via SELECT no banco antes de executar |
| Interface de administração para gerenciar `usuario_unidade_role` | Hoje só via Dashboard/SQL — pendência de longo prazo |
