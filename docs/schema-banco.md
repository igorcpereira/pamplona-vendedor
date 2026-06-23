# Schema do Banco — Pamplona CRM (referência)

> Documento de referência da estrutura do banco para entender o sistema ao mexer em
> qualquer frontend (inclusive a **visão do vendedor**, que é outro frontend sobre o
> **mesmo banco**). Gerado a partir do schema real em 2026-06-05.
>
> **Projeto Supabase:** `pamplona_mvp` (`pukcbqfjzswqmjkhwzfk`) · Postgres 17 · ~135 MB.

---

## 1. Visão geral

- **Backend = Supabase** (Postgres + PostgREST + Auth + Storage). Os frontends falam com o
  banco via supabase-js: ou `.from('tabela')` (sujeito a **RLS**) ou `.rpc('funcao')`
  (funções, a maioria **SECURITY DEFINER** que fazem a checagem de permissão por dentro).
- **Schemas:** `public` (tudo de produção) e `dev` (sandbox da feature **Atividades**,
  ainda não exposto na API; só alcançado via RPCs no `public` — ver §8).
- **Auth:** `auth.users` (gerido pelo Supabase). Cada usuário tem 1 linha em
  `public.profiles` (mesmo `id`) e 1+ vínculos em `public.usuario_unidade_role`.
- **Multi-unidade:** quase tudo tem `unidade_id`. O acesso é escopado por unidade conforme
  o cargo (ver §2). **Decisão chave:** `master/admin/gestor` são **globais** (todas as
  unidades); `franqueado/vendedor/administrativo` ficam **presos à própria unidade**.

> ⚠️ **`vendedor_id` aponta para `auth.users(id)`, não para `profiles`.** Para exibir o nome
> do vendedor, junte `profiles ON profiles.id = vendedor_id`. Vale para
> `clientes.vendedor_id`, `fichas.vendedor_id`, `pedidos.vendedor_id`, `provas.vendedor_id`
> e os `prova{1,2,3}_vendedor_id`.

---

## 2. Permissões (o que mais importa para a visão do vendedor)

### Cargos (`enum app_role`)
`master`, `admin`, `gestor`, `franqueado`, `vendedor`, `administrativo`.
Hierarquia (do front, `src/lib/roles.ts`): master(5) > admin(4) > gestor(3) > franqueado(2)
> vendedor(1) > administrativo(0). Um usuário pode ter **vários vínculos** (cargo+unidade)
em `usuario_unidade_role`.

### Funções helper (a base de toda RLS)
| Função | O que faz |
|---|---|
| `get_user_unidade(uid)` | retorna `profiles.unidade_id` do usuário (a unidade "ativa" dele). |
| `get_user_role(uid)` | retorna o cargo de maior prioridade do usuário (na unidade do perfil). |
| `has_role(uid, role)` | EXISTS de um vínculo com aquele cargo (global p/ master/admin; senão na unidade do perfil). |
| `can_access_unidade(uid, unidade)` | **true se o usuário pode ver aquela unidade.** Hoje: true para quem tem vínculo `master/admin/gestor` (global); senão só se `get_user_unidade = unidade`. |
| `is_master_or_admin()` | EXISTS vínculo master/admin. |

### Como o VENDEDOR enxerga os dados (resumo prático)
- **Via RLS de tabela** (`can_access_unidade`): o vendedor enxerga as linhas da **própria
  unidade** (clientes, fichas, pedidos, provas dessa unidade).
- **Via RPC `get_clientes`**: é mais restrito — o ramo do vendedor filtra
  `clientes.vendedor_id = auth.uid()`, ou seja, **só os clientes dele**. (master/admin/gestor
  veem tudo; franqueado vê a unidade.) ⚠️ Há essa diferença de granularidade entre "ler a
  tabela direto" (unidade) e "via get_clientes" (próprios) — atenção ao montar a tela do vendedor.
- **Escrita de itens avulsos**: o dono do pedido **ou** gestor/franqueado/admin/master/administrativo.
- **Dashboards/atividades (RPCs)**: forçam no servidor — cargo não-global recebe **só a
  própria unidade**, ignorando qualquer `_unidade_id` que o cliente mandar.

---

## 3. Tabelas por domínio

Convenção: 🔑 PK, → FK. Datas `created_at/updated_at` (timestamptz) onde existirem.

### 3.1 Identidade & unidades
| Tabela | Colunas principais | Notas |
|---|---|---|
| **profiles** | 🔑`id`→auth.users, `nome`, `avatar_url`, `unidade_id`→unidades (NOT NULL), `ativo`, `senha_temporaria`, `ultimo_login` | 1:1 com auth.users. `unidade_id` = unidade "ativa" do usuário. |
| **usuario_unidade_role** | 🔑`id`, `user_id`→auth.users, `unidade_id`→unidades, `role` (app_role) | Vínculos cargo×unidade (1+ por usuário). É a fonte de verdade dos cargos. |
| **unidades** | 🔑`id` (bigint), `nome`, `cnpj`, `endereco`…, `ativa`, `evolution_instance_name`, `evolutionapi_token`, `horario_funcionamento` (jsonb) | Existe uma unidade virtual **"Todas"** usada em algumas regras. |

### 3.2 Núcleo de operação (provável foco da visão do vendedor)
| Tabela | Colunas principais | Notas |
|---|---|---|
| **clientes** | 🔑`id`, `nome`, `telefone`, `vendedor_id`→auth.users, `unidade_id`→unidades, `tipo_atendimento`, `alterar_nome` | `telefone` normalizado por trigger (formato `55DD9XXXXXXXX`). |
| **fichas** | 🔑`id`, `tipo` (aluguel/venda/ajuste, **text**), `cliente_id`→clientes, `nome_cliente`/`telefone_cliente`, `status` (enum status_ficha), `data_retirada`/`data_devolucao`/`data_festa` (date), peças (`paleto`,`paleto_cor`,`paleto_lanificio`,`calca`,`camisa`,`camisa_fios`,`camisa_cor`,`sapato`,`sapato_tipo`), `valor` (**text!**), `pago` (bool), `codigo_ficha`, `vendedor_id`→auth.users, `unidade_id`, `prova{1,2,3}_data`/`_vendedor_id`, `is_noivo` (bool), `ficha_original_id`→fichas | A "ficha" é o pedido principal de roupa. Ver gotcha do `valor` em §9. `is_noivo`=esta ficha é o casamento do próprio cliente (feature Atividades). |
| **pedidos** | 🔑`id`, `ficha_id`→fichas, `vendedor_id`→auth.users, `unidade_id`, `pago`, `garantia`, `valor_total` (numeric) | Cabeçalho dos **itens avulsos** de uma ficha. `valor_total` é a fonte do "valor avulsos". |
| **itens_avulsos_ficha** | 🔑`id`, `pedido_id`→pedidos, `tipo_item` (CHECK: camiseta/gravata/sapato/meia/cinto), `quantidade`, `valor_unitario` | Itens do pedido avulso. `valor_unitario` quase sempre nulo (o valor real vive em `pedidos.valor_total`). |
| **provas** | 🔑`id`, `ficha_id`→fichas, `vendedor_id`→auth.users, `unidade_id`, `nome_cliente`, `telefone_cliente` | Cada registro = uma prova feita. |
| **fichas_temporarias** | espelha fichas (staging do pipeline de OCR) | Pré-criação de ficha. |

> 🗑️ A tabela **`vendas_avulsas`** foi **removida em 2026-06-23** (migration
> `20260623000001_drop_vendas_avulsas`). Foi substituída por
> **`pedidos` + `itens_avulsos_ficha`**, que é onde vivem os avulsos hoje.

### 3.3 Tags
| Tabela | Colunas | Notas |
|---|---|---|
| **tags** | 🔑`id`, `nome`, `cor`, `unidade_id` (null=global), `ativa`, `padrao` | Tag "Noivo" é global. |
| **relacao_cliente_tag** | 🔑`id` (bigint), `id_cliente`→clientes, `id_tag`→tags | N:N cliente×tag. |

### 3.4 Campanhas (WhatsApp automático)
| Tabela | Colunas | Notas |
|---|---|---|
| **campanhas** | 🔑`id`, `nome`, `texto`, `midia_tipo`/`midia_url`, `tags_modo`, `intervalo_envio_minutos`, `janela_atribuicao_dias`, `status` (enum campanha_status), `data_inicio`/`data_fim`, `publico_estimado`, `unidade_id`, `criado_por`→profiles | Disparo automático de mensagem para clientes. |
| **campanha_tags** | `campanha_id`→campanhas, `tag_id`→tags | Segmentação da campanha. |
| **disparos** | 🔑`id`, `campanha_id`, `cliente_id`, `agendado_para`, `status` (enum disparo_status), `enviado_em`, `erro`, `wpp_msg_id` | 1 por (campanha,cliente). Gerido por cron/edge. |
| **vendas_atribuidas** | 🔑`id`, `ficha_id`, `campanha_id`, `disparo_id`, `disparo_em`, `venda_em`, `dias_ate_conversao` | Conversão atribuída a campanha. (A coluna `venda_avulsa_id` foi removida em 2026-06-23 junto com `vendas_avulsas` — migration `20260623000002`.) |

### 3.5 WhatsApp (conversas)
| Tabela | Colunas | Notas |
|---|---|---|
| **historico_whatsapp** | 🔑`id` (bigint), `telefone`, `mensagem`, `tipo_mensagem`, `from_me`, `wpp_msg_id`, `unit_id`, `client_id`→clientes, `lida`/`lida_em`, `media_url`, `created_by`→profiles, `quoted_message_id`, `push_name`, `status`, `group_id`/`group_name` | Mensagens (1:1 e grupos). `client_id` setado por trigger ao casar telefone. |
| **whatsapp_groups** | 🔑`id`, `group_id`, `unit_id`, `group_name` | Grupos. |
| **whatsapp_jid_mapping** | 🔑`id`, `instance_name`, `phone_jid`, `lid_jid`, `unit_id` | Mapeia JID @lid→telefone. |
| **whatsapp_auto_messages** | 🔑`id`, `profile_id`→profiles, `nome`, `mensagem`, `ativo` | Respostas automáticas por usuário. |
| **whatsapp_mensagens_automaticas** | 🔑`id`, `unit_id`, `tipo` (boas_vindas/valorizacao), `mensagem`, `ativo` | Mensagens automáticas por unidade. |

### 3.6 Atividades (feature em `dev` — ver §8)
| Tabela | Colunas | Notas |
|---|---|---|
| **dev.gatilhos** | 🔑`id`, `tipo`, `ativo`, `parametros` (jsonb), `unidade_id` (null=global), UNIQUE(tipo,unidade_id) | Regras configuráveis (catálogo de 6 tipos). |
| **dev.atividades** | 🔑`id`, `titulo`, `descricao`, `data`, `status` (pendente/feita/adiada/cancelada), `origem` (manual/gatilho), `gatilho_id`→dev.gatilhos, `grupo_id`, `responsavel_id`→profiles (NOT NULL), `created_by`, `cliente_id`→clientes, `nome_contato`/`telefone_contato`, `unidade_id` | Lembrete interno (não envia nada). Reunião = 1 cópia por responsável (mesmo `grupo_id`). |

### 3.7 Auxiliares / infraestrutura
| Tabela | Para quê |
|---|---|
| **log_alteracoes_ficha** | Auditoria de alterações de ficha/itens/pedidos (via triggers). Leitura: franqueado+. |
| **log_processo_ficha** | Telemetria do pipeline de processamento de ficha (timestamps por etapa). |
| **descricao_cliente** | Liga pedido/cliente/responsável (origem de descrição via webhook). |
| **dados_importantes** | key/value de configs gerais. |
| **webhooks** | URLs de integração (gestor/admin). |
| **clientes_import** | Staging de importação (RLS = só master/admin). |

---

## 4. Enums
| Enum | Valores |
|---|---|
| `app_role` | gestor, franqueado, vendedor, master, admin, administrativo |
| `status_ficha` | erro, pendente, ativa, baixa, aguardando_prova, avulso |
| `campanha_status` | rascunho, em_andamento, finalizada, cancelada |
| `campanha_midia_tipo` | nenhum, imagem, video |
| `campanha_tags_modo` | any, all |
| `disparo_status` | pendente, enviado, falhou, cancelado |
| `status_campanha` *(legado, não usado nas tabelas atuais)* | rascunho, agendada, em_andamento, pausada, concluida, cancelada |
| `tipo_de_atendimento` *(legado)* | Aluguel, Venda, Ajuste |
| `user_role` *(legado)* | Gestor, Franqueado, Vendedor |

> `fichas.tipo` é **text** ('aluguel'/'venda'/'ajuste'), não enum. `tipo_de_atendimento`/
> `user_role` são enums legados — não confiar neles.

---

## 5. Relacionamentos (mapa)

```
auth.users ──1:1── profiles ──→ unidades
     │                  
     └──< usuario_unidade_role >── unidades        (cargos: 1 user, N vínculos)

unidades ──< clientes ──< fichas ──< pedidos ──< itens_avulsos_ficha
                 │           │          
                 │           ├──< provas
                 │           └──< log_alteracoes_ficha (sem FK; append-only)
                 └──< relacao_cliente_tag >── tags

campanhas ──< disparos ;  campanhas ──< vendas_atribuidas >── fichas
campanhas ──< campanha_tags >── tags

clientes ──< historico_whatsapp        (client_id; setado por trigger)

dev.gatilhos ──< dev.atividades ──→ (clientes | profiles | unidades)
```

Quem aponta para quem (FKs principais): `fichas.cliente_id→clientes`,
`pedidos.ficha_id→fichas`, `itens_avulsos_ficha.pedido_id→pedidos`, `provas.ficha_id→fichas`,
`*.unidade_id→unidades`, `*.vendedor_id→auth.users`,
`profiles.id→auth.users`.

---

## 6. Funções / RPCs (o que o frontend chama)

`SD` = SECURITY DEFINER (faz a checagem de permissão por dentro).

### Operação / clientes / fichas
| RPC | Args | Retorno | Escopo |
|---|---|---|---|
| `get_clientes` `SD` | `_unidade_id, _vendedor_id, _page, _search` | lista paginada de clientes + LTV + tags + `total_count` | global vê tudo; franqueado→unidade; **vendedor→só os próprios** |
| `get_fichas_cliente` `SD` | `p_cliente_id` | fichas do cliente (peças, datas, avulsos, pedidos) | barrado por `can_access_unidade` |
| `atualizar_ficha` `SD` | `p_ficha_id, p_valor, p_vendedor_id, p_data_*, p_pago, p_itens, p_pedidos` | void | **franqueado+** |
| `get_ficha_log` `SD` | `p_ficha_id` | histórico de alterações | franqueado+ |
| `buscar_clientes` | `p_search, p_offset, p_limit, p_vendedor_id` | SETOF clientes | invoker (sujeito à RLS de clientes) |
| `listar_fichas_processadas` | `p_offset, p_limit, p_search` | SETOF fichas | invoker (RLS) |
| `listar_vendedores_unidade` `SD` | `p_unidade_id` | vendedores da unidade (exclui master) | — |
| `get_usuarios_completos` `SD` | — | usuários + cargo + unidade | — |
| `parse_valor_to_numeric` | `v text` | numeric | converte `fichas.valor` sujo → número (ver §9) |

### Dashboards
| RPC | Escopo |
|---|---|
| `get_dashboard_stats` `SD`, `get_dashboard_por_vendedor` `SD` | global respeita `_unidade_id`; **não-global travado na própria unidade** (imposto no servidor). |

### Tags / Campanhas
`get_tags` `SD`, `estimar_publico_campanha` `SD`, `iniciar_campanha` `SD`,
`cancelar_campanha` `SD`, `reagendar_disparos_campanha` `SD`,
`atribuir_venda_campanhas` `SD`.

> ℹ️ A RPC `atribuir_avulsa_campanhas` foi **removida em 2026-06-23** (migration
> `20260623000002`) junto com os demais órfãos do drop de `vendas_avulsas`.

### WhatsApp
`get_whatsapp_conversations_by_phone` `SD`, `get_whatsapp_messages_by_phone` `SD`,
`normalize_phone`.

### Atividades (feature em dev; API no public)
`atividades_listar` `SD`, `atividades_criar` `SD` (fan-out), `atividades_atualizar_status` `SD`,
`gatilhos_listar` `SD`, `gatilhos_salvar` `SD`, `atividades_gerar` `SD`
(roda `dev.gerar_atividades`). Escopo: global vê tudo; não-global preso à unidade.

### Admin de usuários
`add_user_role`, `remove_user_role`, `update_user_role`, `set_user_ativo` (todas `SD`,
master/admin).

---

## 7. RLS — resumo por tabela (foco no que afeta o vendedor)

| Tabela | SELECT | Escrita |
|---|---|---|
| **clientes** | `can_access_unidade` (unidade) | insert: `unidade=get_user_unidade`; update: `can_access_unidade`; delete: + cargo gestor/franqueado/master/admin/administrativo |
| **fichas** | `can_access_unidade` | insert: `unidade=get_user_unidade`; update: `can_access_unidade`; delete: dono(vendedor) ou cargos acima |
| **pedidos** | `can_access_unidade` | update: `can_access_unidade` + (dono **ou** cargos) |
| **itens_avulsos_ficha** | via pedido (`can_access_unidade`) | dono do pedido **ou** gestor/franqueado/master/admin/administrativo |
| **provas** | `can_access_unidade` | insert `unidade=get_user_unidade`; demais `can_access_unidade` |
| **profiles** | self, ou gestor/admin/master (global), ou franqueado/administrativo da mesma unidade | self atualiza; master/admin/gestor atualizam |
| **usuario_unidade_role** | só o próprio (`user_id=auth.uid()`) | só admin/master |
| **tags / relacao_cliente_tag** | aberto a authenticated | aberto a authenticated |
| **unidades** | aberto | só master/admin |
| **campanhas / disparos / vendas_atribuidas** | master/admin/gestor (global) ou própria unidade | conforme cargo (ver migrations de campanhas) |
| **historico_whatsapp** | aberto a authenticated | aberto a authenticated |
| **clientes_import** | só master/admin | só master/admin |
| **dev.atividades** | responsável ou `can_access_unidade` | franqueado+ / responsável |
| **dev.gatilhos** | (via RPC) | franqueado+ |

> A maioria das RPCs é `SD` e **ignora a RLS** — quem garante o escopo é a própria função.
> Por isso o vendedor, ao usar telas que chamam RPCs, vê o que a RPC permitir (ex.: get_clientes
> = só os próprios), não o que a RLS de tabela permitiria.

---

## 8. Schema `dev` (feature Atividades, ainda não promovida)

- Tabelas `dev.atividades` e `dev.gatilhos` + funções `dev.gerar_atividades`, `dev._intervalo`
  vivem em `dev` (isolado, **não exposto no PostgREST**).
- O frontend acessa via **RPCs no `public`** (`atividades_*`, `gatilhos_*`) que leem/escrevem
  `dev.*` por dentro.
- DDL completo e receita de promoção (`ALTER … SET SCHEMA public`) em
  `supabase/dev/atividades_dev.sql`. Único toque no `public` até agora: coluna `fichas.is_noivo`.

---

## 9. Gotchas (erros comuns)

1. **`fichas.valor` é TEXT "sujo"** (pode ser `''`, `'1.500,00'`, `'R$ ...'`). **Nunca**
   `::numeric` direto — use `parse_valor_to_numeric(valor)`. O "valor avulsos" NÃO está aqui:
   está em `pedidos.valor_total`.
2. **`vendedor_id` → `auth.users`, não `profiles`.** Para o nome, join `profiles ON id=vendedor_id`.
3. **`master/admin/gestor` são globais; `franqueado/vendedor/administrativo` = própria unidade.**
   É `can_access_unidade` que decide. RPCs `SD` repetem essa regra por dentro.
4. **`get_clientes` é mais restrito que a RLS:** vendedor vê só `vendedor_id = auth.uid()`.
5. **Dashboards/atividades** ignoram o `_unidade_id` do cliente para cargos não-globais
   (travam na unidade do usuário) — segurança no servidor.
6. **`unidade "Todas"`**: unidade virtual usada em algumas regras (ex.: `listar_vendedores_unidade`).
   Filtre-a ao listar unidades reais (`nome <> 'Todas'`).
7. **`fichas.tipo`** é text minúsculo (`aluguel`/`venda`/`ajuste`), não o enum legado `tipo_de_atendimento`.
8. **Telefone**: formato canônico `55DD9XXXXXXXX` (regex `^55[0-9]{2}9[0-9]{8}$`); normalizado por trigger em `clientes`/`historico_whatsapp`.

---

## 10. Triggers relevantes
- `trigger_set_timestamp` / `set_updated_at` — mantêm `updated_at`.
- `tg_log_fichas`, `tg_log_itens_avulsos`, `tg_log_pedidos` — auditoria → `log_alteracoes_ficha`.
- `trg_fichas_atribuir` — ao marcar `fichas.pago=true`, atribui venda a campanhas.
  (O par `trg_avulsas_atribuir` foi removido junto com `vendas_avulsas` em 2026-06-23.)
- `set_historico_whatsapp_client_id` — casa telefone→`client_id` em `historico_whatsapp`.
- `sync_pedido_valor_total` — mantém `pedidos.valor_total`.
- `handle_new_user` — cria `profiles` ao criar usuário no auth.
- `trg_normalize_telefone_*` — normaliza telefone na escrita.
- `trg_notificar_pedido_criado` — notifica (WhatsApp) ao criar pedido.
