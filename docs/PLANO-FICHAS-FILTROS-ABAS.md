# Plano — Página Fichas (App Vendedor): filtros persistentes + reorganização de abas

Duas mudanças na página `src/pages/Fichas.tsx` (IGO-125 + reorg de abas).

## Escopo consolidado

### A) Abas — nova estrutura
De **Pendente · Processadas · Erro** para **Pendente · Processadas · Pedidos Avulsos**:
- **Pendente**: passa a mostrar `status IN ('pendente','erro')` (mescla; aba Erro removida). Contador soma os dois; o card continua exibindo o status real (Pendente/Erro). Mantém o realtime e a lista client-side (`cards`) já existentes — só muda o filtro de `card.status === 'pendente'` para incluir `'erro'`.
- **Processadas**: como hoje (RPC `listar_fichas_processadas`, scroll infinito), **agora com o menu de filtros**.
- **Pedidos Avulsos** (nova): lista **todos os pedidos** (cada pedido = uma avulsa; bate com o "Avulsa" do dashboard). Card mostra cliente, código, valor, data, vendedor, pago. **Clique → abre a ficha vinculada** (`/editar-ficha-v3/{ficha_id}`). Scroll infinito.

### B) Filtros persistentes (menu)
Menu de filtros (botão "Filtros" + painel), com estado **persistido em `localStorage`** (sobrevive a navegar/voltar e a recarregar):
- **Minhas fichas** (toggle) — `vendedor_id = usuário`.
- **Tipo** (chips multi: Aluguel / Venda / Ajuste) — **só Processadas**.
- **Data** (intervalo de/até, ambos opcionais).
- **Unidade** (select) — **só para perfis globais** (`gestor`/`admin`/`master`); demais perfis não veem (já são de 1 unidade).
- Badge com contagem de filtros ativos + botão "Limpar".
- **Aplicação:** Processadas (todos os filtros) e Pedidos Avulsos (Minhas/Data/Unidade — sem Tipo). Pendente segue só com a busca.
- A **busca** (cliente/código) atual permanece e vale em Processadas e Pedidos Avulsos.

## Backend (migrations no `pamplona-db`, via MCP)
1. **`listar_fichas_processadas`** — ✅ **já aplicada** (params `p_minhas`, `p_tipos`, `p_data_inicio`, `p_data_fim`, `p_unidade_id`; aditiva; RLS preservada). Versionada: `20260715172212_*`.
2. **Nova `listar_pedidos_avulsos(p_offset, p_limit, p_search, p_minhas, p_data_inicio, p_data_fim, p_unidade_id)`** — `STABLE SECURITY DEFINER`, escopo por `can_access_unidade(auth.uid(), p.unidade_id)` (espelha a visibilidade das fichas). Retorna: `id, ficha_id, codigo_ficha, nome_cliente, vendedor_id, vendedor_nome, valor_total, pago, created_at` (join `pedidos`→`fichas`→`profiles`). Filtros idênticos aos params. Ordena por `created_at desc`, paginação `offset/limit`.

## Front
- **`src/integrations/supabase/types.ts`** — regenerar (via MCP) para tipar `listar_fichas_processadas` (novos params) e `listar_pedidos_avulsos`.
- **`src/hooks/useFichasProcessadas.ts`** — aceitar objeto `filtros` e repassar os params; incluir os filtros na `queryKey`.
- **Novo `src/hooks/usePedidosAvulsos.ts`** — `useInfiniteQuery` chamando `listar_pedidos_avulsos` (search + filtros); `queryKey` com search+filtros.
- **Novo `src/components/FiltrosFichas.tsx`** — o menu (Minhas/Tipo/Data/Unidade), recebe/atualiza o estado; esconde Tipo/Unidade conforme aba/role. Lista de unidades via `supabase.from('unidades').select('id,nome')` (RLS já permite `select` a autenticados).
- **Novo `src/lib/useFiltrosPersistentes.ts`** (ou inline) — hook de estado persistido em `localStorage` (chave `fichas:filtros`).
- **`src/pages/Fichas.tsx`** — nova estrutura de abas; Pendente mescla pendente+erro; render da aba Pedidos Avulsos (lista + scroll infinito + clique→ficha); monta o menu de filtros e passa aos hooks; Tipo só em Processadas.

## Verificação
1. Aba Pendente mostra pendente **e** erro; contador soma os dois; excluir/guarda de dono seguem valendo.
2. Processadas: filtros Minhas/Tipo/Data/Unidade funcionam e **persistem** ao trocar de aba, navegar e recarregar.
3. Pedidos Avulsos: lista todos os pedidos do escopo, clique abre a ficha; Minhas/Data/Unidade + busca aplicam.
4. Unidade só aparece para gestor/admin/master; contagem por unidade coerente.
5. `tsc --noEmit` e `vite build` verdes.

## Entrega
- RPC nova aplicada via MCP + versionada no `pamplona-db`.
- Front commitado nas branches de deploy (vendedor `main`+`desenvolvimento`). Deploy é do usuário. Independente da Fase 4 (cliente/unidade) pendente.
