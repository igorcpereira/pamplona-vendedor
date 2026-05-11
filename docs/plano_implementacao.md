# Plano de Implementação

**Branch:** `desenvolvimento`  
**Data:** 2026-05-11  
**Status:** Aguardando execução

**Direcionamentos base:**
- `direcionamento_editar_ficha.md`
- `direcionamento_perfil_administrativo.md`
- `direcionamento_rls_visibilidade_unidade.md`
- `direcionamento_dashboard_resumo_mes.md`

---

## Visão Geral das Fases

```
Fase 1 — Banco de dados (migrations)
  └─ Fase 2 — Tipos TypeScript (regenerar)
       └─ Fase 3 — Hooks (novos)
            └─ Fase 4 — UI: EditarFichaV3 + EditFichaModal
            └─ Fase 5 — UI: Dashboard
```

Cada fase depende da anterior. Itens dentro da mesma fase podem ser feitos em paralelo.

---

## Fase 1 — Banco de Dados

### Migration 1 — Renomear role e atualizar função de prioridade
**Arquivo:** `supabase/migrations/YYYYMMDDXXXXXX_rename_role_administrativo.sql`

> **Deve ser a primeira migration** — as outras referenciam a role `administrativo`.

```sql
-- Renomear role
ALTER TYPE app_role RENAME VALUE 'suporte' TO 'administrativo';

-- Atualizar get_user_role para incluir administrativo na ordem de prioridade
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
      WHEN 'admin'           THEN 1
      WHEN 'master'          THEN 2
      WHEN 'franqueado'      THEN 3
      WHEN 'gestor'          THEN 4
      WHEN 'administrativo'  THEN 5
      WHEN 'vendedor'        THEN 6
    END
  LIMIT 1
$$;
```

---

### Migration 2 — Alterações de schema
**Arquivo:** `supabase/migrations/YYYYMMDDXXXXXX_schema_editar_ficha.sql`

> Pode rodar em paralelo com a Migration 1, mas **ambas devem ser aplicadas antes** da Migration 3.

```sql
-- 1. tags: campo padrao
ALTER TABLE tags ADD COLUMN padrao boolean NOT NULL DEFAULT false;

-- 2. fichas: campos de detalhes do item com CHECK constraints
ALTER TABLE fichas
  ADD COLUMN paleto_cor text
    CHECK (paleto_cor IN ('Azul', 'Preto', 'Cinza', 'Outros')),
  ADD COLUMN paleto_lanificio text
    CHECK (paleto_lanificio IN ('Reda', 'Paramount', 'Canonico', 'Pietro di Mosso')),
  ADD COLUMN camisa_fios text
    CHECK (camisa_fios IN ('140', '120', '100')),
  ADD COLUMN camisa_cor text
    CHECK (camisa_cor IN ('Branco', 'Outros')),
  ADD COLUMN sapato_tipo text
    CHECK (sapato_tipo IN ('Casual', 'Social'));

-- 3. Nova tabela itens_avulsos_ficha
CREATE TABLE itens_avulsos_ficha (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id uuid NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
  vendedor_id uuid NOT NULL REFERENCES auth.users(id),
  unidade_id integer NOT NULL REFERENCES unidades(id),
  tipo_item text NOT NULL
    CHECK (tipo_item IN ('camiseta', 'gravata', 'sapato', 'meia', 'cinto')),
  quantidade integer NOT NULL DEFAULT 0,
  valor_unitario numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Um registro por tipo por vendedor por ficha
  -- Vendedores diferentes têm entradas independentes; mesmo vendedor faz upsert
  UNIQUE (ficha_id, tipo_item, vendedor_id)
);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_itens_avulsos_updated_at
BEFORE UPDATE ON itens_avulsos_ficha
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS para itens_avulsos_ficha
ALTER TABLE itens_avulsos_ficha ENABLE ROW LEVEL SECURITY;

CREATE POLICY "itens_avulsos_select"
ON public.itens_avulsos_ficha FOR SELECT TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id));

CREATE POLICY "itens_avulsos_insert"
ON public.itens_avulsos_ficha FOR INSERT TO authenticated
WITH CHECK (unidade_id = public.get_user_unidade(auth.uid()));

CREATE POLICY "itens_avulsos_update"
ON public.itens_avulsos_ficha FOR UPDATE TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id))
WITH CHECK (public.can_access_unidade(auth.uid(), unidade_id));

CREATE POLICY "itens_avulsos_delete"
ON public.itens_avulsos_ficha FOR DELETE TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id));
```

---

### Migration 3 — Atualizar RLS de `fichas`, `clientes`, `provas` e `vendas_avulsas`
**Arquivo:** `supabase/migrations/YYYYMMDDXXXXXX_rls_visibilidade_unidade.sql`

> **Depende da Migration 1** — referencia a role `administrativo`.

```sql
-- fichas
DROP POLICY IF EXISTS "fichas_select" ON public.fichas;
DROP POLICY IF EXISTS "fichas_insert" ON public.fichas;
DROP POLICY IF EXISTS "fichas_update" ON public.fichas;
DROP POLICY IF EXISTS "fichas_delete" ON public.fichas;

CREATE POLICY "fichas_select"
ON public.fichas FOR SELECT TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id));

CREATE POLICY "fichas_insert"
ON public.fichas FOR INSERT TO authenticated
WITH CHECK (unidade_id = public.get_user_unidade(auth.uid()));

CREATE POLICY "fichas_update"
ON public.fichas FOR UPDATE TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id))
WITH CHECK (public.can_access_unidade(auth.uid(), unidade_id));

CREATE POLICY "fichas_delete"
ON public.fichas FOR DELETE TO authenticated
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

-- clientes
DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update" ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete" ON public.clientes;

CREATE POLICY "clientes_select"
ON public.clientes FOR SELECT TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id));

CREATE POLICY "clientes_insert"
ON public.clientes FOR INSERT TO authenticated
WITH CHECK (unidade_id = public.get_user_unidade(auth.uid()));

CREATE POLICY "clientes_update"
ON public.clientes FOR UPDATE TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id))
WITH CHECK (public.can_access_unidade(auth.uid(), unidade_id));

CREATE POLICY "clientes_delete"
ON public.clientes FOR DELETE TO authenticated
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

-- provas: todos da unidade veem todas as provas
DROP POLICY IF EXISTS "provas_select" ON public.provas;
DROP POLICY IF EXISTS "provas_insert" ON public.provas;
DROP POLICY IF EXISTS "provas_update" ON public.provas;
DROP POLICY IF EXISTS "provas_delete" ON public.provas;

CREATE POLICY "provas_select"
ON public.provas FOR SELECT TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id));

CREATE POLICY "provas_insert"
ON public.provas FOR INSERT TO authenticated
WITH CHECK (unidade_id = public.get_user_unidade(auth.uid()));

CREATE POLICY "provas_update"
ON public.provas FOR UPDATE TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id))
WITH CHECK (public.can_access_unidade(auth.uid(), unidade_id));

CREATE POLICY "provas_delete"
ON public.provas FOR DELETE TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id));

-- vendas_avulsas: todos da unidade veem todas
DROP POLICY IF EXISTS "vendas_avulsas_select" ON public.vendas_avulsas;
DROP POLICY IF EXISTS "vendas_avulsas_insert" ON public.vendas_avulsas;
DROP POLICY IF EXISTS "vendas_avulsas_update" ON public.vendas_avulsas;
DROP POLICY IF EXISTS "vendas_avulsas_delete" ON public.vendas_avulsas;

CREATE POLICY "vendas_avulsas_select"
ON public.vendas_avulsas FOR SELECT TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id));

CREATE POLICY "vendas_avulsas_insert"
ON public.vendas_avulsas FOR INSERT TO authenticated
WITH CHECK (unidade_id = public.get_user_unidade(auth.uid()));

CREATE POLICY "vendas_avulsas_update"
ON public.vendas_avulsas FOR UPDATE TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id))
WITH CHECK (public.can_access_unidade(auth.uid(), unidade_id));

CREATE POLICY "vendas_avulsas_delete"
ON public.vendas_avulsas FOR DELETE TO authenticated
USING (public.can_access_unidade(auth.uid(), unidade_id));
```

> **Atenção antes de aplicar:** verificar os nomes exatos das policies atuais de `provas` e `vendas_avulsas` com `\dp provas` no banco — os nomes no DROP devem bater exatamente.

---

## Fase 2 — Tipos TypeScript

Após aplicar as 3 migrations:

```bash
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

**Verificar no arquivo gerado:**
- `app_role` contém `"administrativo"` (não mais `"suporte"`)
- Tabela `itens_avulsos_ficha` com todos os campos
- Campos novos de `fichas` (`paleto_cor`, etc.)
- Campo `padrao` em `tags`

**Grep por referências ao valor antigo:**
```
"suporte"  →  substituir por "administrativo" em todos os .ts e .tsx
```

---

## Fase 3 — Hooks

Todos dependem dos tipos da Fase 2. Podem ser desenvolvidos em paralelo entre si.

### 3.1 Novo: `useVendedoresUnidade`
**Arquivo:** `src/hooks/useVendedoresUnidade.ts`

- Busca usuários da mesma unidade do logado, excluindo role `master`
- **Antes de implementar:** verificar se `profiles.ativo` existe (`\d profiles` no banco). Se existir, filtrar por `ativo = true`; se não, omitir o filtro
- Retorna `{ id: string, nome: string }[]`
- Usado pelos dois dropdowns de vendedor do perfil `administrativo`

### 3.2 Novo: `useItensAvulsosFicha`
**Arquivo:** `src/hooks/useItensAvulsosFicha.ts`

- Carrega `itens_avulsos_ficha` da ficha pelo `ficha_id` e `vendedor_id` resolvido
- Sempre retorna os 5 tipos (camiseta, gravata, sapato, meia, cinto) — inicializa com quantidade 0 os que ainda não existem no banco
- Salvar faz **upsert** com `onConflict: ['ficha_id', 'tipo_item', 'vendedor_id']`
- Expõe: `itens`, `salvarItens(itens[])`, `isLoading`

### 3.3 Novo: `useItensAvulsosDoMes`
**Arquivo:** `src/hooks/useItensAvulsosDoMes.ts`

- Filtra por `vendedor_id = auth.uid()` + intervalo do mês atual
- Soma `quantidade × valor_unitario`
- Retorna `{ total: number, isLoading: boolean }`

---

## Fase 4 — UI: EditarFichaV3 e EditFichaModal

> Todas as mudanças abaixo se aplicam a **ambos** os arquivos: `src/pages/EditarFichaV3.tsx` e `src/components/EditFichaModal.tsx`, salvo indicação contrária.

### 4.1 Remover observações e áudio

- Remover campos `observacoes_cliente` / `descricao_cliente` da UI
- Remover componente de gravação de áudio (microfone, controles, estado de gravação)
- Remover exibição de `transcricao_audio`
- Não alterar o banco — campos permanecem na tabela

### 4.2 Tags padrão como toggle buttons

- Substituir busca atual de tags por query filtrada em `padrao = true`
- Renderizar como botões toggle: ativo = cor da tag (filled), inativo = outline
- Múltipla seleção permitida
- Ao salvar: operação **cirúrgica** em `relacao_cliente_tag` — inserir/remover apenas registros de tags com `padrao = true`; nunca fazer DELETE geral das tags do cliente

### 4.3 Detalhes do item — 3 seções com radio buttons

| Seção | Grupo | Opções | Campo no banco |
|-------|-------|--------|----------------|
| Paletó / Calça | Cor | Azul, Preto, Cinza, Outros | `paleto_cor` |
| Paletó / Calça | Lanifício | Reda, Paramount, Canonico, Pietro di Mosso | `paleto_lanificio` |
| Camisa | Fios | 140, 120, 100 | `camisa_fios` |
| Camisa | Cor | Branco, Outros | `camisa_cor` |
| Sapato | Tipo | Casual, Social | `sapato_tipo` |

- Botão selecionado = filled; demais = outline
- Clicar no selecionado desmarca (valor → null)
- Incluir novos campos no submit da ficha

### 4.4 Peças avulsas reestruturadas

- Substituir modal/campo livre pela nova seção de itens fixos
- Usar `useItensAvulsosFicha` para carregar e salvar
- 5 linhas fixas: Camiseta, Gravata, Sapato, Meia, Cinto
- Cada linha: `[-] [qty] [+]` | input valor unitário | subtotal (leitura)
- Rodapé: total geral (leitura), atualizado em tempo real
- Botão `-` desabilitado quando quantidade = 0

**Resolução do `vendedor_id` ao salvar:**

| Perfil | vendedor_id dos itens |
|--------|-----------------------|
| `vendedor` / `gestor` / `franqueado` | `auth.uid()` |
| `administrativo` | vendedor selecionado no dropdown da seção de avulsos |

### 4.5 Dropdowns de vendedor para `administrativo`

Visíveis **somente** quando o usuário logado tem role `administrativo`.

**Dropdown 1 — Vendedor da ficha:**
- Fonte: `useVendedoresUnidade`
- Obrigatório ao salvar a ficha
- Edição: pré-populado com `vendedor_id` atual; criação: vazio
- Define `fichas.vendedor_id`

**Dropdown 2 — Vendedor dos avulsos** (dentro da seção de peças avulsas):
- Fonte: `useVendedoresUnidade` (mesma lista)
- Obrigatório se qualquer item tiver quantidade > 0
- Pré-populado com o vendedor da ficha, mas independente
- Define `itens_avulsos_ficha.vendedor_id`

---

## Fase 5 — UI: Dashboard

**Arquivo:** `src/pages/Dashboard.tsx`

### 5.1 Novo card: Vendas Avulsas
- `useItensAvulsosDoMes` para total de `itens_avulsos_ficha`
- Somar com total de `vendas_avulsas` já existente
- Exibir soma como card "Vendas Avulsas"

### 5.2 Atualizar card: Valor Total
- `valor_total = fichas.valor + vendas_avulsas.valor + itens_avulsos_ficha.(qtd × valor_unitario)`

### 5.3 Layout
- Ajustar grid para novo card (sugestão: 2 colunas, 3 linhas + full-width)

> **Nota:** dashboard do perfil `administrativo` ficará zerado — comportamento esperado, pois ele não tem fichas em seu nome.

---

## Checklist de Entrega

### Banco
- [ ] Migration 1: rename `suporte → administrativo` + atualizar `get_user_role`
- [ ] Migration 2: schema (tags, fichas, itens_avulsos_ficha + UNIQUE + CHECK + trigger + RLS)
- [ ] Migration 3: RLS de fichas, clientes, provas e vendas_avulsas

### Código
- [ ] Tipos TypeScript regenerados
- [ ] Referências a `"suporte"` substituídas por `"administrativo"`
- [ ] Verificar se `profiles.ativo` existe (antes de implementar hook)
- [ ] Hook `useVendedoresUnidade` criado
- [ ] Hook `useItensAvulsosFicha` criado (upsert por ficha+tipo+vendedor)
- [ ] Hook `useItensAvulsosDoMes` criado
- [ ] `EditarFichaV3` + `EditFichaModal`: observações/áudio removidos
- [ ] `EditarFichaV3` + `EditFichaModal`: tags padrão como toggles (save cirúrgico)
- [ ] `EditarFichaV3` + `EditFichaModal`: detalhes do item em 3 seções
- [ ] `EditarFichaV3` + `EditFichaModal`: peças avulsas reestruturadas
- [ ] `EditarFichaV3` + `EditFichaModal`: dropdowns de vendedor para `administrativo`
- [ ] `Dashboard`: card Vendas Avulsas
- [ ] `Dashboard`: Valor Total atualizado
