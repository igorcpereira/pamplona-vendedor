# Direcionamento: Dashboard — Resumo do Mês

**Branch:** `desenvolvimento`  
**Data:** 2026-05-11  
**Status:** Aguardando implementação

---

## Visão Geral

Atualizar a página `Dashboard.tsx` para:
1. Adicionar card dedicado de **Vendas Avulsas** (soma das duas tabelas de avulsos)
2. Garantir que as queries busquem dados das tabelas novas (`itens_avulsos_ficha`) além das existentes
3. Manter o escopo pessoal: cada usuário vê apenas os **próprios números** (fichas onde `vendedor_id = auth.uid()`)

---

## Estado Atual dos Cards

| Card | Dado exibido | Fonte atual |
|------|-------------|-------------|
| Fichas Lançadas | Contagem de fichas do mês | `fichas` filtrado por mês + vendedor_id |
| Provas Feitas | Contagem de provas do mês | `provas` filtrado por mês + vendedor_id |
| Vendas | Valor total (fichas tipo Venda + vendas_avulsas) | `fichas` + `vendas_avulsas` |
| Aluguéis | Valor total fichas tipo Aluguel | `fichas` |
| Valor Total | Soma geral | `fichas` + `vendas_avulsas` |

---

## Mudanças nos Cards

### Card novo: Vendas Avulsas

Adicionar um card dedicado que exibe o **valor total de avulsos do mês** do vendedor logado.

**Composição do valor:**
```
total_avulsos = soma(vendas_avulsas.valor) + soma(itens_avulsos_ficha.quantidade × itens_avulsos_ficha.valor_unitario)
```

Ambas as tabelas filtradas por:
- Mês atual (`created_at` entre início e fim do mês)
- Vendedor: `vendedor_id = auth.uid()` — direto nas duas tabelas, sem join

### Atualizar card "Valor Total"

O card de Valor Total já soma `fichas + vendas_avulsas`. Após a mudança, deve incluir também `itens_avulsos_ficha`:

```
valor_total = soma(fichas.valor) + soma(vendas_avulsas.valor) + soma(itens_avulsos_ficha.quantidade × valor_unitario)
```

---

## Queries Necessárias

### Query 1 — `vendas_avulsas` do mês (já existe, apenas confirmar filtro)

```sql
SELECT COALESCE(SUM(valor), 0) AS total
FROM vendas_avulsas
WHERE vendedor_id = auth.uid()
  AND created_at >= :inicio_mes
  AND created_at < :fim_mes;
```

### Query 2 — `itens_avulsos_ficha` do mês (nova)

```sql
SELECT COALESCE(SUM(quantidade * valor_unitario), 0) AS total
FROM itens_avulsos_ficha
WHERE vendedor_id = auth.uid()
  AND created_at >= :inicio_mes
  AND created_at < :fim_mes;
```

> **Regra de negócio:** `itens_avulsos_ficha` tem seu próprio `vendedor_id` — o vendedor que atendeu na visita (prova), que pode ser diferente do vendedor original da ficha. Filtrar diretamente por `vendedor_id`, sem join com `fichas`. Mesmo modelo da tabela `provas`.

---

## Escopo dos Dados

O dashboard continua mostrando **dados pessoais do usuário logado**, não da unidade.

| Perfil | O que vê no dashboard |
|--------|----------------------|
| `vendedor` | Suas fichas, provas e avulsos |
| `administrativo` | Dashboard vazio — comportamento esperado. Administrativo lança fichas para outros vendedores, nunca para si mesmo. |
| `franqueado` | Suas fichas, provas e avulsos |
| `gestor` | Suas fichas, provas e avulsos |

> Isso é independente das mudanças de RLS na listagem — lá todos veem a unidade, mas o resumo continua sendo pessoal.

---

## Hook a Criar ou Atualizar

### Novo hook `useItensAvulsosDoMes`

Responsável por buscar o total de `itens_avulsos_ficha` do mês para o usuário logado.

```typescript
// src/hooks/useItensAvulsosDoMes.ts
// Retorna: { total: number, isLoading: boolean }
// Query key: ['itens-avulsos-mes', userId, mesAtual]
// Depende: itens_avulsos_ficha com vendedor_id direto
```

### Atualizar hook/query de `vendas_avulsas`

Verificar se o hook existente já filtra corretamente por `vendedor_id` e mês. Se sim, apenas combinar os dois valores no Dashboard.

---

## Layout do Dashboard Após a Mudança

**Grid atual:** 2×2 cards + 1 card full-width (Valor Total)

**Grid proposto:** 2×3 cards + 1 card full-width (Valor Total)

```
┌─────────────────┬─────────────────┐
│ Fichas Lançadas │  Provas Feitas  │
├─────────────────┼─────────────────┤
│    Aluguéis     │     Vendas      │
├─────────────────┼─────────────────┤
│  Vendas Avulsas │                 │
├─────────────────┴─────────────────┤
│           Valor Total             │
└───────────────────────────────────┘
```

> Layout exato (grid 2 ou 3 colunas, posição do card avulsos) a decidir na implementação conforme visual desejado.

---

## Arquivos que Serão Modificados (previsão)

| Arquivo | Tipo de mudança |
|---------|----------------|
| `src/pages/Dashboard.tsx` | Adicionar card Vendas Avulsas, atualizar cálculo do Valor Total |
| `src/hooks/useItensAvulsosDoMes.ts` | **Novo hook** — total de itens_avulsos_ficha do mês |
| `src/hooks/useFichas.ts` | Sem mudança (escopo pessoal mantido) |

---

## Dependência com Outros MDs

- Depende da criação da tabela `itens_avulsos_ficha` documentada em `direcionamento_editar_ficha.md`
- A query de `itens_avulsos_ficha` só funciona após a migration da nova tabela estar aplicada
- Não depende das mudanças de RLS (`direcionamento_rls_visibilidade_unidade.md`) pois `itens_avulsos_ficha` tem `vendedor_id` próprio e o filtro direto já garante o escopo correto
