# Feature: Atividades — v1 (agenda do vendedor)

**Status:** 🟢 Banco no ar (`public`). App vendedor migrado ao v1 em 2026-07-28; kanban no CRM.
**Data:** 2026-07-24 (banco) · 2026-07-28 (fronts). Substitui o MVP antigo (schema `dev` +
gatilhos), que foi **descartado e dropado** (`20260724140000_atividades_v1_limpeza.sql`).

> Documento vivo. Reflete o que está implementado. Houve duas implementações paralelas do
> front do vendedor (24/07 no branch `desenvolvimento` e 28/07 sobre `main`); a de 28/07
> prevaleceu, com os testes e o histórico de cliente aproveitados da primeira.

## 1. O que é

Agenda de **próximos contatos** auditável. Atividade = lembrete interno (não dispara
WhatsApp, não fala com o cliente). Só **criação manual** nesta v1 (gatilhos automáticos
ficam para a fase 2).

## 2. Acesso (estado atual)

- **App vendedor** (`pamplona-vendedor`, página **Início**): restrito a **master** por
  enquanto (`InicioRoute` em `App.tsx`) — validação antes de liberar à equipe. A página é
  "Minha agenda": lista sempre com `p_responsavel_id = user.id`.
- **CRM** (`pamplona-crm`): kanban em `/atividades` para `master/admin/gestor/franqueado`
  (visão de gestão: reatribuir, cancelar, filtro por unidade/responsável) + cadastro dos
  tipos na página **Registros**.

## 3. Modelo

- **Atividade**: tipo (obrigatório), cliente (obrigatório salvo `exige_cliente=false`, ex.
  tipo `lembrete`), responsável, data, descrição, vínculos opcionais a ficha/pedido.
- **Tipos** (cadastráveis no CRM): Casamento, Sob-medida, Aluguel, Pedido avulso, Lembrete.
- **Status** gravado: `a_fazer` · `concluida` · `cancelada`. **`atrasada` é derivado** no
  servidor (`status_visivel`, fuso `America/Sao_Paulo`) — nunca gravado.
- **Auditoria (append-only)**: cada ação vira linha em `atividade_eventos` (autor, quando,
  observação, de→para).

## 4. Regras de produto (decisões 2026-07-28)

- **Cancelar é ação de gestão**: só pelo CRM. O app do vendedor oferece **concluir** e
  **adiar**; atividade cancelada aparece em modo leitura no filtro "Todas".
- **Criação no app em 2 passos**: (1) cliente — atalhos com os últimos 10 clientes com
  lançamento do vendedor (fonte: `fichas`, que cobre ficha e venda avulsa via ficha-fantasma
  `status='avulso'`), busca, ou "Continuar sem cliente"; (2) tipo (sem cliente, só
  `exige_cliente=false`) + data com atalhos de dia útil (amanhã/+6/+27/+150; **sábado é dia
  útil**, domingo rola para segunda) + calendário livre.
- **Datas como string `YYYY-MM-DD` de ponta a ponta** no front (nunca `Date` — fuso).

## 5. Banco (`public`)

Migrations em `pamplona-crm/supabase/migrations/` (`20260724140000` a `20260724150000`) e
`pamplona-db/supabase/migrations/20260727200000_atividades_listar_unidade.sql`
(`p_unidade_id` + correção de fuso do `atrasada`). O repo canônico de banco é o
**pamplona-db**.

**RPCs** (`SECURITY DEFINER`; cada mutação grava o evento na mesma transação):
`atividades_criar` (fan-out por responsável, retorna `grupo_id`), `atividades_listar`
(enriquecida + `status_visivel`, LIMIT 500), `atividades_concluir`, `atividades_adiar`,
`atividades_cancelar`, `atividades_reatribuir` (gestor+), `tipos_atividade_listar`,
`tipos_atividade_salvar` (master/admin), `atividade_historico_cliente`.

**Regras no servidor**: atribuição (gestor+ escolhe; demais forçam self) e escopo do listar
(vendedor só as próprias) são impostos na RPC. RLS é backstop (escrita só via RPC).

## 6. Frontend (app vendedor)

- `lib/atividades.ts` — regras puras (datas ISO, grupos, dia útil) + `atividades.test.ts`.
- `hooks/useAtividades.ts` (listar/criar/concluir/adiar + tipos), `useUltimosClientes.ts`,
  `useHistoricoCliente.ts`.
- `pages/Atividades.tsx` (Início) — grupos Atrasadas/Hoje/Amanhã/Esta semana/Mais tarde,
  filtros Ativas|Todas.
- `components/atividades/` — `NovaAtividadeDialog` (2 passos), `AtividadeCard`
  (concluir/adiar + histórico do cliente), `HistoricoCliente`.

## 7. Testes

- Regras puras e componentes: `vitest` (`npm run test`) no app vendedor.
- Banco: pgTAP em `pamplona-crm/supabase/tests/atividades_test.sql` (verificado via MCP em
  2026-07-24).

## 8. Fora de escopo (fase 2+)

Gatilhos automáticos, cron, notificações, liberar o Início além de master, aba Equipe no
app do vendedor, tela dedicada de auditoria.
