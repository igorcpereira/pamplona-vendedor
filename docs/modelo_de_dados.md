# Modelo de Dados — App Mobile Pamplona Alfaiataria

> O DDL completo está nas migrations em `supabase/migrations/`. Este documento explica o propósito e as regras de negócio embutidas em cada tabela — o que não é visível só olhando o schema.

---

## Diagrama de relacionamentos

```
auth.users (Supabase)
  └── profiles (1:1)              — nome, avatar, unidade_id (ativa), ativo
  └── usuario_unidade_role (1:N)  — role por unidade
  └── fichas (1:N)                — vendedor_id

unidades (1:N) → profiles
unidades (1:N) → usuario_unidade_role
unidades (1:N) → fichas           — via unidade_id
unidades (1:N) → clientes         — via unidade_id

clientes (1:N) → fichas    — via cliente_id
clientes (1:N) → relacao_cliente_tag — via cliente_id

tags (1:N) → relacao_cliente_tag — via id_tag
```

---

## Tabelas

### `fichas`

O coração do sistema. Cada atendimento gera uma ficha — inclusive atendimentos repetidos do mesmo cliente geram fichas independentes.

| Coluna | Tipo | Descrição |
|---|---|---|
| `codigo_ficha` | text | Número da ficha conforme escrito na ficha física |
| `tipo` | text | Enum: `aluguel`, `venda`, `ajuste` — lowercase |
| `status` | text | Enum: `pendente`, `ativa`, `baixa`, `erro` — ver detalhes abaixo |
| `cliente_id` | uuid | FK para `clientes` — preenchido ao confirmar via `salvar-ficha` |
| `nome_cliente` | text | Nome do cliente |
| `telefone_cliente` | text | Formato `55xx9xxxxxxxx` — apenas números, sem espaços |
| `vendedor_id` | uuid | FK para `auth.users` — determina RLS |
| `data_retirada` | date | DD/MM/AAAA — aplicável aos 3 tipos |
| `data_devolucao` | date | DD/MM/AAAA — apenas Aluguel |
| `data_festa` | date | DD/MM/AAAA — prazo máximo para retirada das peças |
| `paleto` | text | Modelo, tecido e tamanho do paletó |
| `calca` | text | Número da calça ou "do número" — atenção ao termo "do" |
| `camisa` | text | Cor e tamanho |
| `sapato` | text | Modelo e tamanho |
| `valor` | numeric | Valor total pago na ficha |
| `valor_paleto` | numeric | Valor cobrado apenas pelo paletó |
| `valor_calca` | numeric | Valor cobrado apenas pela calça |
| `valor_camisa` | numeric | Valor cobrado apenas pela camisa |
| `garantia` | numeric | Valor deixado como garantia de devolução — Aluguel e Venda |
| `pago` | boolean | Se o valor foi pago |
| `url_bucket` | text | Path relativo da imagem no Storage — URL assinada gerada pelo front sob demanda |
| `url_audio` | text | Path relativo do áudio no Storage — URL assinada gerada pelo front sob demanda |
| `descricao_cliente` | text | Percepções e preferências anotadas manualmente pelo vendedor |
| `transcricao_audio` | text | Transcrição do áudio gravado pelo vendedor — preenchido pela `transcrever-audio` |
| `tempo_processamento` | integer | Tempo de processamento OCR em segundos — preenchido apenas pela v2 |
| `ocr_tentativa` | integer | Tentativa atual do OCR — ouvido pelo front via Supabase Realtime |
| `erro_etapa` | text | Etapa onde ocorreu a falha: `upload`, `conversao_base64`, `ocr`, `parse` — preenchido apenas quando `status = erro` |
| `cliente_encontrado` | boolean | Se o cliente foi encontrado por telefone na Etapa 6 do OCR |
| `cliente_sugerido_id` | uuid | UUID do cliente encontrado — nulo se não encontrado |
| `cliente_sugerido_nome` | text | Nome do cliente encontrado — exibido na confirmação ao vendedor |
| `unidade_id` | bigint | FK para `unidades` — unidade onde a ficha foi criada. Determina visibilidade via RLS |
| `enviada_whatsapp_geral` | boolean | Se a ficha foi enviada para o grupo geral do WhatsApp |
| `enviada_whatsapp_venda` | boolean | Se a ficha foi enviada para o grupo de vendas — relevante apenas para fichas de venda |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

**Colunas obsoletas — pendente de remoção:**
- `vendedor_responsavel` — substituída por `vendedor_id`
- `tags_url_audio` — substituída pela tabela `relacao_cliente_tag`

**Status — o que cada valor significa:**

| Status | Significado |
|---|---|
| `pendente` | Ficha criada, OCR em processamento — aguardando conferência do vendedor |
| `ativa` | Conferida e confirmada pelo vendedor — ficha em andamento |
| `baixa` | Ciclo encerrado — traje devolvido ou processo finalizado |
| `erro` | Falha no processamento OCR — vendedor pode reprocessar ou preencher manualmente |

**Regras de negócio relevantes:**
- `tipo` é lowercase — `aluguel`, `venda`, `ajuste`. A edge function v2 mantém esse padrão.
- `data_devolucao` só é relevante para fichas do tipo `aluguel`.
- `garantia` se aplica a `aluguel` e `venda`.
- `url_bucket` e `url_audio` armazenam o path relativo no Storage — a URL assinada é gerada pelo front sob demanda. ⚠️ Ver decisão em `arquitetura.md`.
- `tempo_processamento` é preenchido apenas pela edge function v2 e apenas em processamentos bem-sucedidos.
- `cliente_sugerido_id` e `cliente_sugerido_nome` são temporários — usados para exibir a confirmação ao vendedor. Após confirmação, `cliente_id` é preenchido via `salvar-ficha`.
- `enviada_whatsapp_venda` só é relevante para fichas do tipo `venda`.

---

### `clientes`

Cadastro de clientes. Separado de `fichas` porque um cliente pode ter múltiplas fichas ao longo do tempo.

| Coluna | Tipo | Descrição |
|---|---|---|
| `nome` | text | Nome do cliente |
| `telefone` | text | Chave de busca — formato `55xx9xxxxxxxx` |
| `vendedor_id` | uuid | FK para `auth.users` — vendedor que cadastrou |
| `unidade_id` | bigint | FK para `unidades` — unidade onde o cliente foi cadastrado. Determina visibilidade via RLS |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

**Colunas obsoletas — pendente de remoção:**
- `ltv` — calculado sob demanda como somatório de `valor` nas fichas vinculadas; não deve ser mantido no banco
- `nome_vendedor` — substituída por `vendedor_id`

**Regras de negócio relevantes:**
- O **telefone é a chave de busca** para verificar se um cliente já existe no banco antes de criar uma nova ficha. Toda query de criação de ficha deve checar esse campo primeiro.
- O LTV do cliente é calculado sob demanda como somatório de `valor` nas fichas vinculadas — não existe campo persistido para isso.

---

### `profiles`

Extensão da tabela `auth.users` do Supabase. Existe porque o Supabase não permite adicionar colunas diretamente na tabela de autenticação.

| Coluna | Tipo | Descrição |
|---|---|---|
| `nome` | text | Nome do usuário |
| `avatar_url` | text | URL da foto do usuário |
| `unidade_id` | uuid | FK para `unidades` — unidade principal do usuário |
| `ativo` | boolean | Se o usuário está ativo no sistema |
| `role` | text | ⚠️ Possivelmente obsoleta — ver pendência abaixo |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

**Pendências:**
- ⚠️ A coluna `role` em `profiles` pode ser redundante com a tabela `user_roles`. Avaliar qual é a fonte de verdade e remover a duplicidade.
- ⚠️ O modelo atual suporta apenas uma `unidade_id` por usuário. O sistema precisará evoluir para suportar múltiplas unidades por usuário — isso impacta `profiles`, `user_roles` e o controle de acesso como um todo.

---

### `usuario_unidade_role`

Define o vínculo entre usuário, unidade e role. Substitui `user_roles` ao adicionar a dimensão de unidade.

| Coluna | Tipo | Descrição |
|---|---|---|
| `user_id` | uuid | FK para `auth.users` |
| `unidade_id` | bigint | FK para `unidades` |
| `role` | app_role | Role do usuário nesta unidade |
| `created_at` | timestamptz | — |

**Regras de negócio relevantes:**
- Um usuário tem uma única role por unidade — `UNIQUE (user_id, unidade_id)`
- `master` e `admin` são vinculados à unidade "Todas" — `has_role()` os trata globalmente
- `profiles.unidade_id` indica qual unidade está ativa na sessão atual

---

### `user_roles`

⚠️ **Deprecated** — substituída por `usuario_unidade_role`. Mantida temporariamente durante a transição.

Define a role global de cada usuário (sem dimensão de unidade).

| Coluna | Tipo | Descrição |
|---|---|---|
| `user_id` | uuid | FK para `auth.users` |
| `role` | text | Role do usuário |
| `created_at` | timestamptz | — |

**Pendência:**
- ⚠️ Avaliar se `role` em `profiles` é redundante e pode ser removida, mantendo `user_roles` como fonte de verdade.

---

### `unidades`

Representa cada loja da Pamplona Alfaiataria.

| Coluna | Tipo | Descrição |
|---|---|---|
| `nome` | text | Nome da unidade |
| `cnpj` | text | CNPJ da unidade |
| `endereco` | text | Endereço completo em campo único |
| `cidade` | text | — |
| `estado` | text | — |
| `cep` | text | — |
| `telefone` | text | Telefone da unidade |
| `numero_whatsapp_padrao` | text | Número de destino das notificações WhatsApp desta unidade |
| `ativa` | boolean | Se a unidade está em operação |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

> ⚠️ A intenção é dividir `endereco` em campos separados (`logradouro`, `numero`, `bairro`). A migration ainda não foi executada — este documento reflete o estado atual do banco.

---

### `tags`

Lista todas as tags disponíveis no sistema para categorização de clientes.

| Coluna | Tipo | Descrição |
|---|---|---|
| `nome` | text | Nome da tag |

**Pendência:**
- ⚠️ Assim como `profiles`, as tags podem precisar ser vinculadas a mais de uma unidade. O modelo atual não suporta isso — avaliar antes de expandir para novas unidades.

---

### `relacao_cliente_tag`

Tabela de vínculo entre clientes e tags.

| Coluna | Tipo | Descrição |
|---|---|---|
| `cliente_id` | uuid | FK para `clientes` |
| `id_tag` | uuid | FK para `tags` |

---

## Tabelas legadas — pendente de remoção

| Tabela | Motivo |
|---|---|
| `log_processo_ficha` | Usada pelas edge functions v1 e v2 para registrar timestamps de cada etapa do processamento OCR. Não será removida junto com a v1 — continua ativa enquanto a v2 depender dela |
| `webhooks` | Legado do n8n. Não está em uso ativo — pode ser removida |

---

## Pendências consolidadas

| Pendência | Impacto |
|---|---|
| Remover `vendedor_responsavel` de `fichas` | Limpeza — substituída por `vendedor_id` |
| Remover `tags_url_audio` de `fichas` | Limpeza — substituída por `relacao_cliente_tag` |
| Remover `nome_vendedor` de `clientes` | Limpeza — substituída por `vendedor_id` |
| Avaliar `role` em `profiles` vs `user_roles` | Evitar duplicidade de fonte de verdade |
| Remover `user_roles` após estabilização de `usuario_unidade_role` | Limpeza — deprecated |
| Suporte a múltiplas unidades por tag | Impacta `tags` e `relacao_cliente_tag` |
| Remover `ltv` de `clientes` | Campo obsoleto — cálculo feito sob demanda como somatório das fichas |
| Remover `webhooks` | Legado do n8n, não está em uso |
| Decidir destino de `log_processo_ficha` | A v2 ainda usa — avaliar se mantém para rastreabilidade ou remove quando v2 for refatorada |
| Migrar `endereco` de `unidades` para campos separados (`logradouro`, `numero`, `bairro`) | Migration planejada — spec necessária antes de executar |
| Converter `url_bucket` e `url_audio` de URL pública para path relativo nas fichas existentes | Bloqueante para atualização de `notificar-ficha-whatsapp` — ver ADR-03 em `decisoes-arquiteturais.md` |
