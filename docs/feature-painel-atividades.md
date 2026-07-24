# Feature: Atividades — v1 (piloto Maringá)

**Status:** 🟢 Implementada e no ar (banco no `public`). App vendedor operante; tipos no CRM.
**Data:** 2026-07-24. Substitui o MVP antigo (schema `dev` + gatilhos), que foi **descartado**.

> Documento vivo. Reflete o que está implementado. As decisões de produto foram tomadas junto
> com o cliente (ver histórico). O plano completo (conceito → testes → dev) foi seguido em TDD.

## 1. O que é

Agenda de **próximos contatos** auditável, **vendedor-first**. Atividade = lembrete interno
(não dispara WhatsApp, não fala com o cliente). Só **criação manual** nesta v1 (gatilhos
automáticos ficam para a fase 2).

## 2. Escopo do piloto

- **Só Maringá** (`unidade_id = 1`) enxerga a feature — corte por unidade + cargos globais.
- Opera **no app vendedor** (`pamplona-vendedor`), página **Início**. O CRM fica fora da
  operação; só hospeda o **cadastro dos tipos** (página Registros).

## 3. Modelo

- **Atividade**: tipo (obrigatório), cliente (obrigatório salvo tipo `lembrete`), responsável
  (usuário), data, descrição, e vínculos opcionais a **ficha** e/ou **pedido** (avulso).
- **Tipos** (cadastráveis em Registros): Casamento, Sob-medida, Aluguel, Pedido avulso, Lembrete.
  Cada tipo tem `exige_cliente` (dirige a obrigatoriedade do cliente).
- **Status** gravado: `a_fazer` · `concluida` · `cancelada`. **`atrasada` é derivado**
  (`a_fazer` + data no passado) — nunca gravado.
- **Auditoria (append-only)**: cada ação (criada/concluida/adiada/cancelada/reatribuida) vira
  uma linha em `atividade_eventos` com autor, quando, observação e de→para
  (data anterior→nova; responsável anterior→novo).

## 4. Permissões

- **Vendedor / franqueado / administrativo**: criam **só para si** (viram o dono); agem nas
  próprias atividades.
- **Gestor / admin / master** (globais): criam **para si ou para outro**, reatribuem e
  acompanham (aba **Equipe**, com filtro por vendedor).

## 5. Banco (`public`)

Migrations em `pamplona-crm/supabase/migrations/`:
- `20260724140000_atividades_v1_limpeza.sql` — dropa o sandbox `dev` e RPCs antigas.
- `20260724140100_atividades_v1_schema.sql` — `tipos_atividade`, `atividades`,
  `atividade_eventos`, RLS, RPCs, seed dos 5 tipos, `is_unidade_piloto`.
- `20260724140200_atividades_v1_rls_scope_vendedor.sql` — RLS de leitura estrita p/ vendedor.

**RPCs** (`SECURITY DEFINER`; cada mutação grava o evento na mesma transação):
`atividades_criar`, `atividades_listar` (enriquecida + `status_visivel`), `atividades_concluir`,
`atividades_adiar`, `atividades_cancelar`, `atividades_reatribuir` (gestor+),
`tipos_atividade_listar`, `tipos_atividade_salvar` (master/admin),
`atividade_historico_cliente`.

**Regras no servidor**: atribuição (gestor+ escolhe; demais forçam self) e escopo do listar
(vendedor só as próprias; gestor+ tudo/filtra) são impostos na RPC. RLS é backstop.

## 6. Frontend

**App vendedor** (`pamplona-vendedor`):
- `lib/atividades.ts` — regras puras (espelham o servidor) + `atividades.test.ts`.
- `hooks/useAtividades.ts`, `useTiposAtividade.ts`, `useHistoricoCliente.ts`.
- `pages/Atividades.tsx` (Início) — toggle Minha/Equipe, agrupamento por data, atrasada.
- `components/atividades/` — `NovaAtividadeDialog`, `AtividadeCard` (concluir/adiar/cancelar +
  histórico do cliente), `HistoricoCliente`.
- Gating em `App.tsx` (`InicioRoute`) via `podeAcessarAtividades`.

**CRM** (`pamplona-crm`): página **Registros** → aba **Tipos de Atividade** (CRUD, master/admin)
via `hooks/useTiposAtividade.ts`.

## 7. Testes

- **Camada 1** (regras puras) e **Camada 2** (componentes): `vitest` no app vendedor
  (`npm run test`). Verdes.
- **Camada 3** (banco): pgTAP em `pamplona-crm/supabase/tests/atividades_test.sql`
  (`supabase test db`). As asserções foram verificadas via MCP (transação com rollback) em
  2026-07-24.

## 8. Fora de escopo (fase 2+)

Gatilhos automáticos, cron, atribuição automática ao dono do cliente, notificações, tela
dedicada de auditoria, uso no CRM e outras unidades além de Maringá.
