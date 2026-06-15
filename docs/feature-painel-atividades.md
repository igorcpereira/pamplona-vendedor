# Feature: Painel de Atividades (Agenda do Vendedor)

**Branch:** `desenvolvimento`
**Data:** 2026-05-29 (atualizado 2026-06-05)
**Status:** 🟢 Camada de banco do MVP **implementada e testada no schema `dev`** (sandbox). Frontend pendente. Promoção ao `public` quando validado.

### Status de implementação (2026-06-05)
- ✅ **`fichas.is_noivo`** adicionada ao `public` (migration `20260605182147`, aditiva, default false).
- ✅ Schema **`dev`** criado com `dev.gatilhos` e `dev.atividades` (índices, dedupe, triggers `updated_at`, RLS por unidade — gestor global). DDL em `supabase/dev/atividades_dev.sql`.
- ✅ Gerador **`dev.gerar_atividades(responsavel)`** com os **6 gatilhos**, lendo dados reais do `public`, com **dedupe** (rodar 2x → 0 duplicatas — testado).
- ✅ Testado com dados reais: `apos_casamento` gerou 6 (ex.: casou 20/12/2025 → atividade 20/12/2026), `antes_retirada` 85, `apos_ultima_venda` 6; criação manual com contato avulso OK; telefone fora do formato rejeitado.
- ⏳ **Pendente:** página `/atividades` (frontend), expor `dev` no PostgREST p/ testar pela UI, e a migration de **promoção** (`SET SCHEMA public`).
- 📌 **Decisões de implementação** (além do §7): `status`/`origem` como `text + CHECK` (não enum, mais fácil de promover); dedupe = `(gatilho_id, cliente_id, data)`; no MVP o `responsavel_id` das atividades de gatilho = **quem clicou "Gerar agora"** (gestor); datas: `apos_casamento`/reativação usam a data-alvo calculada, `sem_contato`/`antes_retirada` usam `current_date`.

---

## ⚠️ Como usar este documento

Este é um **documento de design vivo**. Estamos definindo **todas as regras antes de
escrever qualquer código**. Nada aqui deve ser implementado até o status mudar para
"Aprovado para implementação". Conforme conversamos, novas decisões são adicionadas/ajustadas aqui.

---

## 1. Objetivo

Criar um **painel de atividades** = uma **agenda de lembretes para o vendedor** saber o que
precisa fazer em um dia / semana específicos.

Exemplo norteador (do cliente): *"passou 1 ano do casamento de um noivo → aparece um lembrete
para o vendedor entrar em contato com esse cliente."*

O gestor poderá:
- Criar **atividades pontuais** (lembretes manuais).
- Criar **gatilhos** que geram atividades **automaticamente, de tempos em tempos**.

---

## 2. Conceitos e fronteiras (importante)

| Conceito | O que é | Quem age |
|---|---|---|
| **Campanha** | Mensagem **automática** disparada **para o cliente** (WhatsApp). JÁ EXISTE. | Robô (sistema envia sozinho) |
| **Atividade** | **Lembrete interno** na agenda do vendedor. O sistema **NÃO envia nada** nem fala com o cliente. | Humano (vendedor lê e decide o que fazer) |
| **Gatilho** | Regra que **gera atividades sozinha** na agenda, periodicamente. | Sistema cria o lembrete; humano executa |

**Atividade ≠ Campanha.** A atividade é só um "to-do/lembrete". Concluir uma atividade =
marcar como feita (NÃO dispara WhatsApp, NÃO abre conversa). Isso é decisão firmada.

---

## 3. Escopo do MVP (primeira versão para validar com o cliente)

Objetivo do MVP: colocar **algo clicável na frente do cliente** para entender se é isso que ele
precisa, antes de investir em infra pesada.

**Dentro do escopo:**
- Apenas a **visão do GESTOR**. (Visão do vendedor fica para a fase 2.)
- Uma **página nova** (ex.: `/atividades` ou `/agenda`) com:
  1. **Lista / calendário** das atividades (filtrável por data, vendedor, unidade).
  2. **Criar atividade manual** (lembrete pontual).
  3. **Catálogo de gatilhos** (6 tipos no MVP, liga/desliga + parâmetro; catálogo cresce com o tempo).
- **Botão "Gerar atividades agora"** que roda as regras na hora (ver §6).

**Fora do escopo do MVP (fase 2+):**
- Visão do vendedor / agenda individual.
- Cron automático (no MVP é manual via botão).
- Notificações (badge, digest diário).
- Integração com WhatsApp / disparo de mensagem.
- Gatilhos com condições livres ("se campo X = Y"). Começamos com **catálogo curado**.
- Atribuição automática a vendedor (ver dívida em §8).

---

## 4. Achados do banco (dados reais — base das decisões)

Projeto Supabase: `pamplona_mvp` (`pukcbqfjzswqmjkhwzfk`). Levantamento em 2026-05-29.

### Tag "Noivo"
- Existe a tag **"Noivo"** (global, `unidade_id` nulo, ativa). **133 clientes** a possuem.
- A tag vive em `clientes` (via `relacao_cliente_tag`), **não na ficha**.

### data_festa (data do evento)
- Caminho que liga noivo → data do casamento hoje:
  `tags (nome='Noivo') → relacao_cliente_tag → clientes → fichas (data_festa)`
- **Só 6 dos 133 noivos** têm ficha com `data_festa` preenchida.
- Banco todo: **479 fichas** com `data_festa`; **391** já passaram; **apenas 4** têm festa
  há mais de 1 ano. Festa mais antiga: **31/12/2024** (o sistema é novo, dados desde fim de 2025).
- **Implicação:** um gatilho "1 ano após a festa" **literal** geraria a tela quase **vazia** hoje.
  → O gatilho deve ser **parametrizável** ("X tempo após a festa") e, no demo, usar um período
  curto (ex.: 1 mês) para encher a tela com casos reais.

### Vendedor responsável
- `clientes.vendedor_id` e `fichas.vendedor_id` estão **zerados** para os noivos.
- Como o MVP é só visão do gestor, **não trava agora** (atividade cai em lista geral do gestor).
- **Dívida conhecida** para a fase 2 (visão do vendedor): falta o dado de "dono do cliente".

### Múltiplas fichas por cliente (o problema do "qual é a data do casamento?")
- **31 clientes** já têm mais de uma ficha.
- **9** têm `data_festa` **divergente** entre fichas.
- Noivos atuais têm 1 ficha cada (por sorte), mas é **frágil**: a tag "Noivo" diz *"é noivo"*,
  não diz *"qual `data_festa` é o casamento dele"*. Um noivo que volta (padrinho, compra
  posterior, ajuste) quebra o gatilho silenciosamente.

---

## 5. Mudança estrutural na FICHA (decidida)

**Problema:** `data_festa` é atributo da **transação** (cada ficha tem a data do seu evento).
O **aniversário de casamento** é atributo da **pessoa** (o noivo tem um casamento só). Hoje
estão misturados e não dá para saber qual ficha representa o casamento do próprio cliente.

**Decisão (firmada):** marcar na **própria ficha** quando ela representa o casamento do
próprio cliente, com um **campo booleano**.

- Campo novo na tabela `fichas`: **`is_noivo`** `boolean`, **default `false`**.
- Quando `is_noivo = true`, a `data_festa` daquela ficha é o **casamento do próprio cliente** →
  é a data-base do gatilho de aniversário.
- A data continua morando na ficha (sem duplicar dado) e a ambiguidade de "qual ficha é o
  casamento" fica resolvida pelo flag.
- A tag "Noivo" **continua existindo** para segmentação/campanha — papéis diferentes
  (tag = "é noivo"; `is_noivo` na ficha = "esta ficha é o casamento dele").

**Escopo desta mudança:** é **apenas no banco** — adicionar a coluna `is_noivo` (default `false`).
A **lógica de quando marcar/desmarcar** esse campo será tratada **em outra parte do projeto**
(fora desta feature) — NÃO entra no escopo do painel de atividades. Aqui só consumimos o valor.

---

## 6. O que o gestor pode criar

O gestor tem **dois modos de criar atividades**, com propósitos diferentes:

| Modo | O que é | Quantas atividades gera |
|---|---|---|
| **Atividade pontual (manual)** | Um lembrete único, criado na mão. Ex.: *"Falar com o cliente X"*. | **Uma** atividade, na data escolhida. |
| **Gatilho (automático)** | Uma regra que gera atividades sozinha, para todos os clientes que se encaixam. Ex.: *"1 ano após o casamento"*. | **Várias** (uma por cliente elegível), repetindo no tempo. |

> Regra de bolso: **pontual = um cliente, uma vez** (criação manual). **Gatilho = muitos
> clientes, recorrente** (criação por regra). Recorrência é trabalho de gatilho, não de
> atividade manual.

### 6.1 Atividade pontual (manual)

O gestor abre **"+ Nova atividade"** e preenche um formulário (dialog). Campos:

- **Título** (obrigatório) — ex.: "Falar com cliente", "Cobrar retirada".
- **Contato** (opcional) — duas formas, e o cliente **não precisa estar cadastrado**:
  - **Cliente cadastrado**: busca por nome e vincula via `cliente_id` (ex.: "cliente X").
  - **Contato avulso**: o gestor digita **nome + telefone** à mão (cliente que ainda não está
    no banco). Mesma convenção da tabela `fichas` (`nome_cliente`/`telefone_cliente`).
    **Telefone com formato rígido** (ver §9): máscara no front `55 (DD) 9 XXXX - XXXX`, com o
    `55` fixo; armazenado como `55DD9XXXXXXXX`.
  - Pode ficar **vazio** para tarefas gerais (ex.: reunião, "organizar vitrine").
- **Descrição / observação** (opcional) — texto livre com o contexto.
- **Data** (obrigatório) — o dia em que aparece na agenda.
- **Responsáveis** (um ou mais — **obrigatório, no mínimo um**) — o gestor escolhe **quem
  executa**: pode ser **vendedor ou não** (gestor, administrativo, etc.). Seleção múltipla
  (ex.: uma **reunião**). Ao salvar, o sistema **cria uma cópia da atividade para cada
  responsável selecionado** (cada um com status próprio). → Ver fan-out e `grupo_id` em §7.
- **Unidade** — herda do filtro/contexto atual.

A atividade criada nasce com `origem = manual` e `status = pendente`.

### 6.2 Gatilhos (automáticos) — catálogo inicial

Começamos com **catálogo fixo** (tipos hardcoded no código; tabela guarda só liga/desliga +
parâmetro). Candidatos que **não exigem dado novo** (além da mudança da ficha):

1. 🎉 **"X tempo após o casamento"** — usa fichas com `is_noivo = true` + `data_festa`.
   Parâmetro: quanto tempo depois (meses/anos). *É o exemplo do noivo.*
2. 🔇 **"Cliente sem contato há N dias"** — usa `historico_whatsapp`. Mostra inteligência do sistema.
3. 📅 *(opcional)* **"N dias antes da retirada"** — usa `fichas.data_retirada`.
4. 📄 **"X tempo após a última ficha do cliente"** — qualquer ficha (aluguel/venda/ajuste).
   Reativação geral. *(Definir âncora de data: `created_at` da ficha vs. data do evento.)*
5. 🛒 **"X tempo após a última compra (ficha)"** — última ficha com `tipo = 'venda'`.
   Winback de venda.
6. 🧾 **"X tempo após a última compra (avulsa)"** — último registro em `vendas_avulsas`.
   Winback de avulso.

> Gatilhos #4, #5 e #6 são variações de "faz X tempo desde a última vez" (reativação).
> Cada um é **parametrizável** (quanto tempo) e tem **dedupe** por cliente.
> **Âncora de data (firmada):** `created_at` do registro (ficha / venda avulsa).

**No MVP entram os 6 gatilhos.** E o catálogo **vai crescer** (teremos mais tipos depois) —
portanto a arquitetura deve tornar **barato adicionar um gatilho novo**: cada tipo é um módulo
isolado (uma query + parâmetros + metadados), e a tela lista os tipos dinamicamente. Evitar
qualquer coisa que exija mexer em N lugares para criar o gatilho #7.

**Execução no MVP:** sem cron. Botão **"Gerar atividades agora"** roda a regra sob demanda.
Com **dedupe** (não recriar a mesma atividade já gerada). Cron automático fica para fase 2.

---

## 7. Modelo de dados proposto (rascunho — a refinar)

> Esboço inicial. Detalhar colunas/tipos quando fecharmos as regras.

- **`atividades`** — o lembrete em si (sempre de **um** usuário responsável):
  `id`, `responsavel_id` (**obrigatório** — usuário que executa, **vendedor ou não**:
  pode ser gestor, administrativo, etc.), `unidade_id`,
  `titulo`, `descricao`, `data` (dia/semana na agenda),
  `status` (pendente / feita / adiada / cancelada), `origem` (manual | gatilho),
  `gatilho_id` (se origem=gatilho), `grupo_id` (opcional — ver abaixo), timestamps.
  *(FK para o usuário/perfil; papel-agnóstico — não é exclusivo de vendedor.)*
  - **Contato (cliente pode não estar cadastrado)** — espelha a convenção de `fichas`:
    - `cliente_id` (nullable) — quando o contato é um cliente cadastrado.
    - `nome_contato` / `telefone_contato` (nullable, texto) — quando é avulso (não está no banco).
    - Os três podem ficar nulos (tarefa sem contato, ex.: reunião).
- **Atividade para vários usuários (ex.: reunião) = uma cópia por usuário.**
  O gestor escolhe os participantes (vendedores ou não) e o sistema **cria uma atividade para
  cada um** (fan-out na criação). Cada cópia é independente → cada um tem o **seu próprio status**.
  - `grupo_id` (**incluído** — decidido): liga as cópias da mesma criação, para que no futuro
    seja possível **editar/cancelar a reunião inteira de uma vez**. No MVP só é gravado.
- **`gatilhos`** — a regra configurável:
  `id`, `tipo` (qual gatilho do catálogo, ex.: `apos_casamento`), `ativo` (liga/desliga),
  `parametros` `jsonb` (a "caixinha" de parâmetros), `unidade_id`, timestamps.
- **Ficha** — campo novo `is_noivo` `boolean` default `false` (só no banco; lógica de
  marcação tratada fora desta feature) — ver §5.

### Por que `parametros` é `jsonb` (a "caixinha")

Cada gatilho precisa de **parâmetros diferentes**. Em vez de criar uma coluna para cada um
(tabela cheia de colunas vazias, e uma migração `ALTER TABLE` toda vez que surgir um gatilho
novo), guardamos tudo em **uma única coluna `jsonb`** — uma caixinha livre onde cada gatilho
salva só o que usa:

| Gatilho (`tipo`) | `parametros` (jsonb) |
|---|---|
| `apos_casamento` | `{ "tempo": 12, "unidade": "meses" }` |
| `sem_contato` | `{ "dias": 90 }` |
| `antes_retirada` | `{ "dias_antes": 3 }` |
| `apos_ultima_ficha` | `{ "tempo": 6, "unidade": "meses" }` |
| (futuro #7) | `{ "tempo": 6, "tag": "VIP" }` ← sem mexer no banco |

**Vantagem:** criar um gatilho novo no futuro **não exige mudar a estrutura do banco** — é só
salvar um JSON com formato diferente nessa mesma coluna.
**Preço (consciente):** o banco não valida o conteúdo do `jsonb`; quem garante o formato
correto é o **código**. Para uma tabela de configuração com poucas linhas, editada só pelo
gestor, o preço é baixíssimo e compensa.

### "Catálogo = módulos isolados" (por que é barato adicionar gatilho)

A `jsonb` resolve o lado do **banco**; este ponto resolve o lado do **código**. Cada tipo de
gatilho é um **módulo autossuficiente** que declara tudo sobre si: o nome que aparece na tela,
quais parâmetros pede, e a query que busca os clientes elegíveis. Existe uma **lista (catálogo)**
de módulos; a tela e o gerador de atividades **leem essa lista dinamicamente**.

→ Resultado: adicionar o gatilho #7 = criar **um** módulo novo e registrá-lo na lista. Não se
mexe na tela, nem no gerador, nem no banco. Um lugar só.

---

## 8. Reaproveitamento do que já existe

- **Padrão de cron** das campanhas (`process-campaign-queue`): mesma ideia de "job periódico"
  para gerar atividades — MAS só na fase 2. **Não** reaproveitamos envio/disparo.
- **`usuario_unidade_role`** (gestor/vendedor/...): hierarquia já existe (gestor cria, vendedor executa).
- **`tags` + `relacao_cliente_tag`**: segmentação de clientes para gatilhos.
- **`fichas`** (datas): fonte rica de gatilhos (`data_festa`, `data_retirada`, `data_devolucao`, provas).
- **`historico_whatsapp`**: último contato / gatilho de inatividade.

---

## 9. Decisões firmadas ✅

- [x] Atividade é lembrete interno; **não** envia WhatsApp nem fala com cliente.
- [x] MVP só **visão do gestor**.
- [x] Catálogo de gatilhos **fixo/curado** (não condições livres) na primeira rodada.
- [x] Primeiro entregar versão clicável para **validar conceito** com o cliente.
- [x] Gatilho do casamento deve ser **parametrizável** ("X tempo após"), não "1 ano" fixo.
- [x] Marcar na ficha com booleano **`is_noivo`** (default `false`) — **só mudança de banco**;
      a lógica de marcar/desmarcar é tratada em outra parte do projeto, fora desta feature.
- [x] Sem cron no MVP — botão **"Gerar atividades agora"**.
- [x] **`is_noivo` duplicado**: o sistema **não adivinha**. Mantém os dois e **mostra um aviso
      ao gestor** ("há clientes com mais de uma data de casamento marcada"), permitindo que ele
      vá corrigir a marcação (a correção em si é feita em outra parte do projeto).
- [x] Catálogo de gatilhos ampliado com **reativação**: última ficha (#4), última compra
      ficha/venda (#5) e última compra avulsa (#6).
- [x] **Os 6 gatilhos entram no MVP** (não começamos enxuto).
- [x] Catálogo **vai crescer** → arquitetura deve tornar **barato** adicionar um gatilho novo
      (cada tipo = módulo isolado; tela lista tipos dinamicamente).
- [x] **Âncora de data** dos gatilhos de reativação (#4/#5/#6) = **`created_at`** do registro.
- [x] **Layout**: aba Agenda oferece **duas visualizações alternáveis — Tabela e Calendário** —
      e o gestor escolhe qual usar (ver §12).
- [x] **Dois modos de criação** (ver §6): **atividade pontual/manual** (um cliente, uma vez,
      ex.: "falar com cliente X") e **gatilho** (muitos clientes, recorrente). Recorrência é
      sempre trabalho de gatilho — atividade manual é sempre única.
- [x] Atividade para **vários responsáveis** (ex.: reunião) = **uma cópia por responsável**
      (fan-out na criação), cada uma com status próprio. O gestor define os participantes.
      Modelo unificado: `atividades.responsavel_id` é **único** (ver §7). Resolve o status por pessoa.
- [x] **Toda atividade tem sempre um responsável (obrigatório)** — um **usuário, vendedor ou
      não** (gestor, administrativo, etc.). `responsavel_id` é **not null**. Isso elimina a
      questão de "atividade sem dono".
- [x] **Incluir `grupo_id`** (liga as cópias da mesma reunião; usado para editar/cancelar em
      lote na fase 2; no MVP só gravado).
- [x] O contato da atividade **não precisa estar cadastrado**: ou `cliente_id` (cadastrado), ou
      `nome_contato`+`telefone_contato` (avulso), ou nenhum. Espelha `fichas`.
- [x] **Telefone do contato avulso = formato rígido**, igual ao resto do sistema
      (`^55[0-9]{2}9[0-9]{8}$`). No front, máscara fixa **`55 (DD) 9 XXXX - XXXX`**: o `55` aparece
      fixo, o DD entre parênteses, e o número como `9 XXXX - XXXX`. Armazenado como `55DD9XXXXXXXX`.

- [x] **Aniversário** do exemplo = **casamento** (`data_festa`), não data de nascimento.
      (Toda a lógica `is_noivo` + `data_festa` já parte disso.)
- [x] **Rota da página = `/atividades`.**
- [x] **Visualização padrão = Tabela**; a escolha do gestor (Tabela/Calendário) é **lembrada
      por conta** e usada como padrão nas próximas visitas.

## 10. Decisões em aberto ❓

- [ ] Fase 2: para gatilhos automáticos, de onde virá o `responsavel_id` (dono do cliente)?
      Hoje `clientes.vendedor_id`/`fichas.vendedor_id` estão zerados. (Atividade manual não tem
      esse problema — o gestor escolhe o responsável na hora.)
- [ ] Fase 2: de onde virá o `vendedor_id` (dono do cliente) — hoje está zerado.

## 11. Fora de escopo (registro consciente)

Visão do vendedor, cron automático, notificações, integração WhatsApp, gatilhos com condições
livres, atribuição automática a vendedor.

---

## 12. Layout / UI (visão do gestor)

Segue o padrão visual já usado nas outras páginas (shadcn/ui, tema escuro, cabeçalho com
ícone + título + ações à direita, filtro de unidade). Componentes shadcn já disponíveis no
projeto: `table`, `calendar`, `tabs`, `card`, `switch`, `dialog`, `select`, `badge`.

**Estrutura da página:**

```
┌─ Painel de Atividades ───────────── [Gerar agora] [+ Nova atividade] ┐
│   [ Agenda ]   [ Gatilhos ]        ← abas (tabs)                      │
│   filtros: unidade ▾  vendedor ▾  status ▾                            │
│   ...conteúdo da aba...                                               │
└───────────────────────────────────────────────────────────────────────┘
```

Rota da página: **`/atividades`**.

- **Aba "Agenda"** — onde o gestor vê as atividades. Oferece **duas visualizações alternáveis**
  (toggle), ambas disponíveis para o gestor. **Padrão = Tabela**; a escolha do gestor é
  **lembrada por conta** e vira o padrão nas próximas visitas.
  - **Tabela** (padrão) — colunas Data · Contato · Atividade · Origem · Status (mesmo padrão de
    Campanhas/Clientes). Mais consistente e rápido.
  - **Calendário** — grade de mês com marcador nos dias que têm atividade; clicar no dia abre
    a lista daquele dia. Mais "cara de agenda". (Obs.: fica visualmente vazio enquanto há
    poucos dados — esperado na fase atual.)
- **Aba "Gatilhos"** — os 6 gatilhos do catálogo como **cartões**, cada um com:
  interruptor liga/desliga (`switch`) + campo(s) de parâmetro (ex.: "12 meses"). A tela lista
  os tipos **dinamicamente** a partir do catálogo (ver §7, módulos isolados).

**Ações no topo:**
- **"Gerar atividades agora"** — roda os gatilhos ativos sob demanda (MVP sem cron, ver §6).
- **"+ Nova atividade"** — abre formulário (dialog) do lembrete manual.

---

## Notas técnicas avulsas

- ✅ ~~Segurança: `clientes_import` com RLS desligada~~ — **RESOLVIDO** (migration
  `20260602135055_habilitar_rls_clientes_import`; policy restringe a master/admin).
- ℹ️ **Gestor agora é global** (vê todas as unidades, igual admin/master). Como o MVP é visão
  do gestor, ele verá atividades de todas as unidades por padrão — coerente com a RLS
  `can_access_unidade` usada nas tabelas `dev`.
