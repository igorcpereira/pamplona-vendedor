# Direcionamento: RLS — Visibilidade por Unidade para Todos os Perfis

**Branch:** `desenvolvimento`  
**Data:** 2026-05-11  
**Status:** Aguardando implementação

---

## Visão Geral

Hoje o perfil `vendedor` (e futuramente `administrativo`) vê **apenas suas próprias fichas e clientes** (filtrado por `vendedor_id = auth.uid()`). A mudança desejada é que **todos os perfis com acesso a uma unidade vejam todas as fichas e clientes daquela unidade**, sem restrição por vendedor.

---

## Estado Atual das Policies (o que muda)

### Problema
Nas policies de `fichas` e `clientes`, o SELECT/UPDATE/DELETE exige:

```sql
USING (
  can_access_unidade(auth.uid(), unidade_id)
  AND (
    auth.uid() = vendedor_id          -- ← isso bloqueia vendedor de ver fichas de outros
    OR has_role(auth.uid(), 'gestor')
    OR has_role(auth.uid(), 'franqueado')
    OR has_role(auth.uid(), 'master')
    OR has_role(auth.uid(), 'admin')
  )
)
```

O `vendedor` só passa pelo `auth.uid() = vendedor_id`, então vê apenas o próprio. `gestor` e `franqueado` já veem tudo da unidade.

---

## Nova Lógica Desejada

Qualquer usuário autenticado que tenha acesso à unidade pode ver **todas** as fichas e clientes daquela unidade.

### Regra simplificada
```
pode ver/editar ficha/cliente SE can_access_unidade(auth.uid(), unidade_id)
```

Não há mais distinção por `vendedor_id` no SELECT, UPDATE e DELETE.

---

## SQL das Novas Policies

### Tabela `fichas`

```sql
-- DROP das policies atuais
DROP POLICY IF EXISTS "fichas_select" ON public.fichas;
DROP POLICY IF EXISTS "fichas_insert" ON public.fichas;
DROP POLICY IF EXISTS "fichas_update" ON public.fichas;
DROP POLICY IF EXISTS "fichas_delete" ON public.fichas;

-- SELECT: qualquer um com acesso à unidade vê todas as fichas dela
CREATE POLICY "fichas_select"
ON public.fichas FOR SELECT
TO authenticated
USING (
  public.can_access_unidade(auth.uid(), unidade_id)
);

-- INSERT: qualquer um com acesso à unidade pode criar ficha na unidade
-- vendedor_id pode ser diferente de auth.uid() (caso do administrativo)
CREATE POLICY "fichas_insert"
ON public.fichas FOR INSERT
TO authenticated
WITH CHECK (
  unidade_id = public.get_user_unidade(auth.uid())
);

-- UPDATE: qualquer um com acesso à unidade pode editar fichas dela
CREATE POLICY "fichas_update"
ON public.fichas FOR UPDATE
TO authenticated
USING (
  public.can_access_unidade(auth.uid(), unidade_id)
)
WITH CHECK (
  public.can_access_unidade(auth.uid(), unidade_id)
);

-- DELETE: mantém restrição mais controlada — apenas gestor, franqueado, admin e master
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
```

### Tabela `clientes`

```sql
-- DROP das policies atuais
DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update" ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete" ON public.clientes;

-- SELECT
CREATE POLICY "clientes_select"
ON public.clientes FOR SELECT
TO authenticated
USING (
  public.can_access_unidade(auth.uid(), unidade_id)
);

-- INSERT
CREATE POLICY "clientes_insert"
ON public.clientes FOR INSERT
TO authenticated
WITH CHECK (
  unidade_id = public.get_user_unidade(auth.uid())
);

-- UPDATE
CREATE POLICY "clientes_update"
ON public.clientes FOR UPDATE
TO authenticated
USING (
  public.can_access_unidade(auth.uid(), unidade_id)
)
WITH CHECK (
  public.can_access_unidade(auth.uid(), unidade_id)
);

-- DELETE: restrito a perfis com mais privilégio
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
```

---

## Tabela de Visibilidade Após a Mudança

| Role            | SELECT fichas/clientes | INSERT | UPDATE | DELETE |
|-----------------|------------------------|--------|--------|--------|
| `vendedor`      | Todas da unidade ✓     | ✓      | ✓      | ✗      |
| `administrativo`| Todas da unidade ✓     | ✓      | ✓      | ✓      |
| `franqueado`    | Todas da unidade ✓     | ✓      | ✓      | ✓      |
| `gestor`        | Todas da unidade ✓     | ✓      | ✓      | ✓      |
| `admin`         | Tudo (sem filtro) ✓    | ✓      | ✓      | ✓      |
| `master`        | Tudo (sem filtro) ✓    | ✓      | ✓      | ✓      |

---

## Tabelas Que Precisam da Mesma Revisão

Aplicar a mesma regra de visibilidade por unidade (`can_access_unidade`) nas tabelas abaixo, seguindo o mesmo padrão de `fichas` e `clientes`:

| Tabela | Ação |
|--------|------|
| `provas` | Atualizar policies — todos da unidade veem todas as provas |
| `vendas_avulsas` | Atualizar policies — todos da unidade veem todas as vendas avulsas |
| `itens_avulsos_ficha` | Criada já com a nova lógica (ver `direcionamento_editar_ficha.md`) |

Incluir o DROP + CREATE dessas policies na Migration 3.

---

## Arquivos que Serão Modificados (previsão)

| Arquivo | Tipo de mudança |
|---------|----------------|
| `supabase/migrations/XXXXXXXXX_rls_visibilidade_unidade.sql` | Nova migration com DROP + CREATE das policies |
| `src/integrations/supabase/types.ts` | Sem mudança de schema, mas regenerar se houver rename de role junto |

---

## Dependência com Outros MDs

Esta mudança deve ser aplicada **na mesma migration** ou **após** o rename `suporte → administrativo` documentado em `direcionamento_perfil_administrativo.md`, pois as policies de DELETE referenciam a role `administrativo`.
