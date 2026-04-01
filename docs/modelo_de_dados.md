# Modelo de Dados — App Mobile Pamplona Alfaiataria

> O DDL completo está nas migrations em `supabase/migrations/`. Este documento explica o propósito e as regras de negócio embutidas em cada tabela — o que não é visível só olhando o schema.

---

## Diagrama de relacionamentos

```
auth.users (Supabase)
  └── profiles (1:1)       — nome, avatar, unidade_id, ativo
  └── user_roles (1:N)     — role por usuário
  └── fichas (1:N)         — vendedor_id

unidades (1:N) → profiles
unidades (1:N) → user_roles

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
| `tipo` | text | Enum: `Aluguel`, `Venda`, `Ajuste` — letra maiúscula por legado do n8n |
| `status` | status_ficha | Enum DB: `pendente`, `erro`, `ativa`, `baixa` — ver detalhes abaixo |
| `cliente_id` | uuid | FK para `clientes` |
| `nome_cliente` | text | Nome do cliente |
| `telefone_cliente` | text | Formato `55xx9xxxxxxxx` — apenas números, sem espaços |
| `vendedor_id` | uuid | FK para `auth.users` — determina RLS |
| `data_retirada` | date | Aplicável aos 3 tipos |
| `data_devolucao` | date | Apenas Aluguel |
| `data_festa` | date | Prazo máximo para retirada das peças |
| `paleto` | text | Modelo, tecido e tamanho do paletó |
| `calca` | text | Número da calça ou "do número" — atenção ao termo "do" |
| `camisa` | text | Cor e tamanho |
| `sapato` | text | Modelo e tamanho |
| `valor` | text | Valor total pago na ficha |
| `valor_paleto` | text | Valor cobrado apenas pelo paletó |
| `valor_calca` | text | Valor cobrado apenas pela calça |
| `valor_camisa` | text | Valor cobrado apenas pela camisa |
| `garantia` | text | Valor deixado como garantia de devolução — Aluguel e Venda |
| `pago` | boolean | Se o valor foi pago |
| `url_bucket` | text | URL pública completa da imagem da ficha no Storage |
| `tags` | jsonb | Tags inline da ficha — uso paralelo à tabela `relacao_cliente_tag` |
| `url_audio` | text | URL do áudio gravado pelo vendedor no Storage |
| `transcricao_audio` | text | Transcrição do áudio acima |
| `enviada_whatsapp` | boolean | Se a notificação WhatsApp foi enviada — default `false` |
| `descricao_cliente` | uuid | ⚠️ Coluna uuid sem FK — origem desconhecida, provável erro de migration. Não usar. |
| `tempo_processamento` | integer | Tempo de processamento OCR em segundos — preenchido apenas pela v2 |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

**Colunas obsoletas — pendente de remoção:**
- `vendedor_responsavel` — substituída por `vendedor_id`
- `tags_url_audio` — substituída pela tabela `relacao_cliente_tag`

**Status — o que cada valor significa (enum `status_ficha`, todos lowercase):**

| Status | Significado |
|---|---|
| `pendente` | Ficha criada aguardando OCR ou aguardando conferência do vendedor |
| `ativa` | Ficha conferida e em uso — ficha finalizada |
| `baixa` | Ficha encerrada — peças devolvidas ou venda concluída |
| `erro` | Falha no processamento OCR |

**Regras de negócio relevantes:**
- `tipo` usa letra maiúscula por legado do parser do n8n. A edge function v2 mantém esse padrão — validar antes de qualquer mudança de enum.
- `data_devolucao` só é relevante para fichas do tipo `Aluguel`.
- `garantia` se aplica a `Aluguel` e `Venda`.
- `url_bucket` armazena a URL pública completa, não o path relativo. ⚠️ Ver pendência em `arquitetura.md`.
- `tempo_processamento` é preenchido apenas pela edge function v2. A v1 será descontinuada em breve.

---

### `clientes`

Cadastro de clientes. Separado de `fichas` porque um cliente pode ter múltiplas fichas ao longo do tempo.

| Coluna | Tipo | Descrição |
|---|---|---|
| `nome` | text | Nome do cliente |
| `telefone` | text | Chave de busca — formato `55xx9xxxxxxxx` |
| `vendedor_id` | uuid | FK para `auth.users` — vendedor que cadastrou |
| `ltv` | numeric | Somatória da coluna `valor` de todas as fichas vinculadas ao cliente |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

**Colunas obsoletas — pendente de remoção:**
- `nome_vendedor` — substituída por `vendedor_id`

**Regras de negócio relevantes:**
- O **telefone é a chave de busca** para verificar se um cliente já existe no banco antes de criar uma nova ficha. Toda query de criação de ficha deve checar esse campo primeiro.
- `ltv` deve ser recalculado sempre que uma nova ficha for confirmada.

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

### `user_roles`

Define a role de cada usuário no sistema.

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

| Tabela | Situação |
|---|---|
| `log_processo_ficha` | Ainda em uso — a edge function v2 também escreve nela (timestamps de cada etapa do OCR). Avaliar se mantém para rastreabilidade ou remove junto com a v1 |
| `webhooks` | Legado do n8n. Não está em uso ativo — pode ser removida |

---

## Pendências consolidadas

| Pendência | Impacto |
|---|---|
| Remover `vendedor_responsavel` de `fichas` | Limpeza — substituída por `vendedor_id` |
| Remover `tags_url_audio` de `fichas` | Limpeza — substituída por `relacao_cliente_tag` |
| Remover `nome_vendedor` de `clientes` | Limpeza — substituída por `vendedor_id` |
| Avaliar `role` em `profiles` vs `user_roles` | Evitar duplicidade de fonte de verdade |
| Suporte a múltiplas unidades por usuário | Impacta `profiles`, `user_roles` e RLS |
| Suporte a múltiplas unidades por tag | Impacta `tags` e `relacao_cliente_tag` |
| Remover `webhooks` | Legado do n8n, não está em uso |
| Decidir destino de `log_processo_ficha` | A v2 ainda usa — definir se mantém ou remove |
| Investigar `descricao_cliente` uuid sem FK em `fichas` | Provável erro de migration — confirmar e remover |
| `url_bucket` — salvar path relativo ao invés de URL completa | Ver `arquitetura.md` |
