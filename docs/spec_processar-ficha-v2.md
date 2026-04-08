# Spec — `processar-ficha-v2`

## Visão geral

| | |
|---|---|
| **Status** | ✅ Ativa |
| **Propósito** | Processar a foto de uma ficha manuscrita via OpenAI Vision, extrair os dados estruturados e salvar no banco. Suporta criação de nova ficha e reprocessamento de ficha existente com erro |
| **Quem chama** | App mobile ao capturar uma foto — criação ou reprocessamento |
| **Tipo** | Fire-and-forget com `EdgeRuntime.waitUntil()` |

---

## Contrato

### Input

```typescript
FormData {
  image: File;       // Imagem da ficha manuscrita
  user_id: string    // UUID do vendedor autenticado
  ficha_id?: string  // UUID opcional — quando presente, reprocessa ficha existente ao invés de criar nova
}
```

**Restrições:**
- Formatos aceitos: `JPEG`, `PNG`, `HEIC`
- Tamanho máximo: `15MB`
- `ficha_id` só é aceito para fichas com `status: erro` — qualquer outro status retorna HTTP 400

### Output

**Sucesso — HTTP 200:**
```typescript
{
  ficha_id: string // UUID da ficha criada
}
```

**Erro de validação — HTTP 400:**
```typescript
{
  error: "image_required" | "invalid_format" | "file_too_large"
}
```

**Erro de autenticação — HTTP 401:**
```typescript
{
  error: "unauthorized"
}
```

**Erro interno — HTTP 500:**
```typescript
{
  error: string // Descrição do erro
}
```

---

## Fluxo

```
[SÍNCRONO]
Etapa 1 — Validação do input
  → Etapa 2 — Criação ou atualização da ficha no banco
    → retorna { ficha_id } ao front imediatamente

[BACKGROUND via EdgeRuntime.waitUntil()]
  Etapa 3 + Etapa 4 — Upload no Storage + Conversão base64 (paralelo via Promise.all)
    → Etapa 5 — Chamada OpenAI
      → Etapa 6 — Parse e atualização da ficha
```

---

## Etapas

### Etapa 1 — Validação do input

Executada de forma síncrona antes de qualquer operação no banco.

| Validação | Camadas | Erro retornado |
|---|---|---|
| Imagem ausente | Front + Edge Function | HTTP 400 `image_required` |
| Formato inválido | Front + Edge Function | HTTP 400 `invalid_format` |
| Tamanho acima de 15MB | Front + Edge Function | HTTP 400 `file_too_large` |
| `user_id` ausente ou inválido | `verify_jwt` + Edge Function | HTTP 401 `unauthorized` |
| `ficha_id` informado mas ficha não tem `status: erro` | Edge Function | HTTP 400 `invalid_status_for_reprocess` |

> O front bloqueia o envio antes de chegar à função — botão desabilitado sem imagem, validação de formato e tamanho na seleção do arquivo. A edge function valida novamente como segunda camada de segurança.

**Comportamento em erro:** aborta o fluxo, nada é criado no banco.

---

### Etapa 2 — Criação ou atualização da ficha no banco

O comportamento desta etapa depende da presença de `ficha_id` no input.

**Criação (sem `ficha_id`):**
Cria a ficha com o mínimo necessário para ter um `ficha_id` válido.

| Campo | Valor |
|---|---|
| `vendedor_id` | vem do input |
| `status` | `pendente` |
| `created_at` | automático |
| `updated_at` | automático |

**Reprocessamento (com `ficha_id`):**
Atualiza a ficha existente para reiniciar o ciclo de processamento. Limpa os dados do OCR anterior.

| Campo | Valor |
|---|---|
| `status` | `pendente` |
| `ocr_tentativa` | `null` — reinicia contagem |
| `cliente_encontrado` | `null` |
| `cliente_sugerido_id` | `null` |
| `cliente_sugerido_nome` | `null` |
| `updated_at` | automático |

> Dados anteriores do OCR (paleto, calça, etc.) são sobrescritos na Etapa 6 pelo novo processamento.

**Comportamento em erro:** HTTP 500, nada criado/alterado, front não redireciona. Aborta o fluxo completo — sem `ficha_id` o background não roda.

---

### Etapas 3 e 4 — Upload no Storage e Conversão base64 (paralelo)

Executadas simultaneamente via `Promise.all` no background.

**Etapa 3 — Upload no Storage**
- Bucket: privado
- Path: `fichas/{ficha_id}.jpg`
- `url_bucket` salva o path relativo — a URL assinada é gerada pelo front sob demanda

**Etapa 4 — Conversão base64**
- Conversão do File para base64 em memória
- Não gera efeito colateral no banco ou Storage

**Comportamento em erro:**

| Cenário | Comportamento |
|---|---|
| Storage falha, base64 funciona | Prossegue para Etapa 5. Tenta novo upload na Etapa 6 |
| Base64 falha, Storage funciona | Aborta Etapa 5. Atualiza `status: erro`, registra `erro_etapa: conversao_base64` |
| Ambas falham | Aborta Etapa 5. Registra os dois erros. Atualiza `status: erro` |

---

### Etapa 5 — Chamada OpenAI

**Configuração:**

| Parâmetro | Valor |
|---|---|
| Modelo | `gpt-5.4` |
| Endpoint | `/v1/chat/completions` |
| Timeout | 120s por tentativa |
| Máximo de tentativas | 2 |
| Intervalo entre tentativas | 5s |

**Prompt:**

O `SYSTEM_MESSAGE` instrui o modelo a retornar exclusivamente um JSON válido sem markdown, usando exatamente as opções do catálogo para cada peça.

O `USER_PROMPT` define as regras de extração:
- Datas no formato `YYYY-MM-DD`
- Nome completo sem abreviações
- Telefone normalizado para `55xx9xxxxxxxx`
- Tipo exatamente `aluguel`, `venda` ou `ajuste` — lowercase
- Valores como string numérica
- `pago` como boolean

**Catálogo inline no `SYSTEM_MESSAGE`** — opções válidas para paletó (linha, modelo, cor, detalhe, tamanho), calça (tamanho), camisa (tecido, cor, estampa, punho, tamanho) e sapato (modelo, cor, tamanho).

**Retry e sinalização ao front:**

```
Inicia OCR
  → registra ocr_tentativa: 1 no banco
  → Tentativa 1 (timeout: 120s)
    → Sucesso → segue para Etapa 6
    → Falha → aguarda 5s
      → registra ocr_tentativa: 2 no banco
        (front ouve via realtime e exibe aviso ao vendedor)
      → Tentativa 2 (timeout: 120s)
        → Sucesso → segue para Etapa 6
        → Falha → atualiza status: erro, registra erro_etapa: ocr
```

> O front ouve `ocr_tentativa` via Supabase Realtime. Quando o valor mudar para `2`, exibe: "Processamento demorou mais que o esperado, estamos tentando novamente..."

---

### Etapa 6 — Parse e atualização da ficha

**Parse do JSON:**

| Cenário | Comportamento |
|---|---|
| JSON válido e completo | Segue normalmente |
| JSON válido com campos nulos | Aceita o parcial — vendedor corrige na conferência |
| JSON inválido ou malformado | Atualiza `status: erro`, registra `erro_etapa: parse` |

**Busca do cliente por telefone:**

A busca é executada pela função — não pelo front. O resultado é persistido no banco e ouvido pelo front via Supabase Realtime.

| Cenário | Campos salvos no banco |
|---|---|
| Cliente encontrado | `cliente_encontrado: true`, `cliente_sugerido_id: <uuid>`, `cliente_sugerido_nome: <nome>` |
| Cliente não encontrado | `cliente_encontrado: false`, `cliente_sugerido_id: null`, `cliente_sugerido_nome: null` |
| Telefone nulo no OCR | `cliente_encontrado: false`, `cliente_sugerido_id: null`, `cliente_sugerido_nome: null` |

> O front lê esses campos via Realtime e exibe a confirmação ao vendedor. `cliente_id` **não é salvo na ficha nessa etapa** — será salvo apenas quando o vendedor confirmar via `salvar-ficha`.

**Campos atualizados no banco:**

| Campo | Valor |
|---|---|
| Todos os campos do OCR | Conforme JSON retornado pela OpenAI |
| `url_bucket` | Path relativo — tenta novo upload se Etapa 3 falhou |
| `tempo_processamento` | Segundos desde o início até aqui — apenas em sucesso |
| `ocr_tentativa` | Mantém o valor registrado na Etapa 5 |
| `cliente_encontrado` | Resultado da busca por telefone |
| `cliente_sugerido_id` | UUID do cliente encontrado — nulo se não encontrado |
| `cliente_sugerido_nome` | Nome do cliente encontrado — para exibir na confirmação |
| `status` | Permanece `pendente` — muda para `ativa` apenas via `salvar-ficha` |

---

## Secrets

| Secret | Uso |
|---|---|
| `SUPABASE_URL` | Conexão com o banco e Storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Operações no banco com permissão de service role |
| `OPENAI_API_KEY` | Chamada à OpenAI Chat Completions |

---

## Campos novos no banco

| Tabela | Campo | Tipo | Descrição |
|---|---|---|---|
| `fichas` | `ocr_tentativa` | integer | Tentativa atual do OCR — ouvido pelo front via realtime |
| `fichas` | `cliente_encontrado` | boolean | Se o cliente foi encontrado por telefone na Etapa 6 |
| `fichas` | `cliente_sugerido_id` | uuid | UUID do cliente encontrado — nulo se não encontrado |
| `fichas` | `cliente_sugerido_nome` | text | Nome do cliente encontrado — para exibir confirmação ao vendedor |

---

## Impacto em outros documentos

| Documento | O que atualizar |
|---|---|
| `modelo_de_dados.md` | Adicionar `ocr_tentativa` na tabela `fichas` |
| `arquitetura.md` | Atualizar decisão do `url_bucket` — bucket privado, path relativo, URL assinada gerada pelo front |
| `edge_functions.md` | Atualizar input/output da `processar-ficha-v2` com os valores definidos nessa spec |

---

## Pendências

| Pendência | Impacto |
|---|---|
| Habilitar `verify_jwt = true` | Segurança — ver `arquitetura.md` |
| Substituir completamente a v1 no fluxo principal | Descontinuação da `processar-ficha` |
| Separar catálogo do `SYSTEM_MESSAGE` em arquivo externo `catalogo.json` | Evitar atualização manual dentro da função a cada mudança de catálogo |
