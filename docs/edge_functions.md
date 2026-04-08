# Edge Functions — App Mobile Pamplona Alfaiataria

> As Edge Functions rodam no runtime Deno do Supabase. O código-fonte está em `supabase/functions/`. Este documento descreve o propósito, fluxo e comportamento de cada função — o que não é visível só lendo o código.

---

## Índice

| Função | Status |
|---|---|
| `processar-ficha` | ⚠️ Legado — a ser descontinuada |
| `processar-ficha-v2` | ✅ Ativa |
| `notificar-ficha-whatsapp` | ✅ Ativa — requer atualização |
| `transcrever-audio` | ✅ Ativa (parcialmente legado) |
| `salvar-ficha` | 🔲 A implementar |
| `criar-cliente` | 🔲 A implementar |
| `popular-tags-clientes` | 🔲 Planejada — não implementada |
| `sugerir-tags-texto` | 🔲 Planejada — não implementada |

---

## Por que existem duas versões de processar-ficha

A `processar-ficha` (v1) foi construída sobre o n8n como intermediário para o OCR. Com a migração para OpenAI diretamente via Chat Completions, a v2 foi criada do zero com uma arquitetura mais robusta — fire-and-forget com `EdgeRuntime.waitUntil()`, retry com sinalização ao front via Realtime, busca de cliente por telefone no servidor e suporte a reprocessamento sem criar nova ficha.

A v1 permanece no código por compatibilidade enquanto a transição não é finalizada. **Ela será removida assim que a v2 estiver estável no fluxo principal.**

---

## `processar-ficha` ⚠️ Legado

**Status:** Legado — em desuso, será descontinuada junto com a remoção da tabela `log_processo_ficha` e `webhooks`

**Propósito:** Processar a foto de uma ficha via n8n e salvar os dados extraídos no banco.

**Quem chama e quando:** App mobile ao capturar uma foto. Hoje em desuso — substituída pela v2.

**Fluxo:**
```
Recebe imagem
  → cria ficha no banco (status: Pendente)
  → upload para Storage
  → retorna ficha_id imediatamente
  → [background, sem waitUntil] busca URL do webhook na tabela webhooks (nome=nova-ficha)
    → envia imagem ao n8n
      → n8n retorna JSON com dados da ficha
        → atualiza ficha no banco
```

> ⚠️ O background roda sem `EdgeRuntime.waitUntil()` — o runtime pode encerrar antes do processamento concluir, causando perda silenciosa de dados.

**Secrets:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Integrações externas:** n8n — URL dinâmica buscada na tabela `webhooks`

**Pendências:**
- Remover após estabilização da v2
- Remover junto com as tabelas `log_processo_ficha` e `webhooks`

---

## `processar-ficha-v2` ✅ Ativa

**Status:** Ativa — função principal de processamento de fichas

**Propósito:** Processar a foto de uma ficha via OpenAI Vision, extrair os dados estruturados e salvar no banco. Suporta criação de nova ficha e reprocessamento de ficha existente com erro.

**Quem chama e quando:** App mobile ao capturar uma foto — criação ou reprocessamento.

**Tipo:** Fire-and-forget com `EdgeRuntime.waitUntil()`

**Input:**
```typescript
FormData {
  image: File        // JPEG, PNG ou HEIC — máximo 15MB
  user_id: string    // UUID do vendedor autenticado
  ficha_id?: string  // Opcional — quando presente, reprocessa ficha existente com status: erro
}
```

**Output:**
- Sucesso HTTP 200: `{ ficha_id: string }`
- Erro de validação HTTP 400: `{ error: "image_required" | "invalid_format" | "file_too_large" | "invalid_status_for_reprocess" }`
- Erro de autenticação HTTP 401: `{ error: "unauthorized" }`
- Erro interno HTTP 500: `{ error: string }`

**Fluxo:**
```
[SÍNCRONO]
Etapa 1 — Validação do input
  → Etapa 2 — Criação ou atualização da ficha no banco
    → retorna { ficha_id } ao front imediatamente

[BACKGROUND via EdgeRuntime.waitUntil()]
  Etapa 3 + Etapa 4 — Upload no Storage + Conversão base64 (paralelo)
    → Etapa 5 — Chamada OpenAI (gpt-5.4, timeout 120s, até 2 tentativas)
      → Etapa 6 — Parse + busca de cliente por telefone + atualização da ficha
```

**Comportamento de retry:**
- `ocr_tentativa: 1` registrado no banco antes da primeira tentativa
- Se falhar, aguarda 5s e registra `ocr_tentativa: 2` — front ouve via Supabase Realtime e exibe aviso ao vendedor
- Se ambas falharem: `status: erro`, `erro_etapa: ocr`

**Busca de cliente (Etapa 6):**
A função busca o cliente por telefone no banco após o parse do OCR e persiste o resultado em `cliente_encontrado`, `cliente_sugerido_id` e `cliente_sugerido_nome`. O front lê via Realtime. `cliente_id` só é vinculado na ficha via `salvar-ficha`.

**Storage:** bucket privado. `url_bucket` salva path relativo `fichas/{ficha_id}.jpg` — URL assinada gerada pelo front sob demanda.

**Secrets:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

**Integrações externas:** OpenAI — endpoint `/v1/chat/completions`, modelo `gpt-5.4`, imagem em base64

**Catálogo inline:** O `SYSTEM_MESSAGE` contém inline a lista de modelos, cores e tamanhos válidos para paletó, calça, camisa e sapato — serve como referência para o parser.

**Pendências:**
- Habilitar `verify_jwt = true`
- Substituir completamente a v1 no fluxo principal

> Spec completa: `spec_processar-ficha-v2.md`

---

## `notificar-ficha-whatsapp` ✅ Ativa — requer atualização

**Status:** Ativa — requer atualização para novo modelo de grupos e bucket privado

**Propósito:** Enviar a ficha confirmada para os grupos de WhatsApp via Evolution API.

**Quem chama e quando:** Chamada automaticamente por `salvar-ficha` ao confirmar a ficha. Vendedor pode acionar manualmente via botão na tela da ficha em caso de falha.

**Tipo:** Síncrono

**Input:** `{ ficha_id: string }`

**Output — sempre HTTP 200:**
```typescript
{
  ficha_id: string
  enviada_whatsapp_geral: boolean
  enviada_whatsapp_venda: boolean  // relevante apenas para fichas do tipo venda
}
```

**Fluxo:**
```
Etapa 1 — Busca da ficha no banco
  → Etapa 2 — Geração de URL assinada a partir do path relativo em url_bucket (TTL: 1h)
    → Etapa 3 — Verificação dos campos de controle (enviada_whatsapp_geral/venda)
      → Etapa 4 — Envios (paralelo para fichas de venda)
        → Etapa 5 — Atualização dos campos de controle no banco
          → retorna resultado ao front
```

**Roteamento:**

| Tipo | Grupo Geral | Grupo Venda |
|---|---|---|
| `aluguel` | ✅ | — |
| `ajuste` | ✅ | — |
| `venda` | ✅ | ✅ |

**Conteúdo da mensagem:** imagem (URL assinada) + legenda com nome e telefone do cliente.

**Reenvio cirúrgico:** a função sempre verifica os campos de controle antes de enviar — nunca reenvia para um grupo que já recebeu.

**Secrets:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EVOLUTION_BASE_URL`
- `EVOLUTION_INSTANCE`
- `EVOLUTION_API_KEY`
- `EVOLUTION_GRUPO_GERAL`
- `EVOLUTION_GRUPO_VENDA`

**Pré-requisitos de deploy:**
- Migration: adicionar `enviada_whatsapp_geral` e `enviada_whatsapp_venda`, remover `enviada_whatsapp`
- `processar-ficha-v2` já deve estar salvando path relativo em `url_bucket` — fichas com URL pública completa vão falhar na Etapa 2

**Pendências:**
- Habilitar `verify_jwt = true`
- Remover secrets obsoletos `EVOLUTION_GRUPO_ALUGUEL` e `EVOLUTION_GRUPO_AJUSTE`

> Spec completa: `spec_notificar-ficha-whatsapp.md`

---

## `transcrever-audio` ✅ Ativa (parcialmente legado)

**Status:** Ativa, mas ainda depende do n8n — migração para OpenAI direta pendente

**Propósito:** Fazer upload do áudio no Storage, transcrever via OpenAI Whisper e retornar o texto transcrito e tags sugeridas.

**Quem chama e quando:** App mobile ao finalizar a gravação de áudio na tela de ficha.

**Tipo:** Síncrono. Atualiza `url_audio` e `transcricao_audio` diretamente na ficha.

**Input:**
```typescript
FormData {
  audio: File      // webm
  ficha_id: string // UUID da ficha vinculada ao áudio
}
```

**Output — HTTP 200:**
```typescript
{
  text: string   // Texto transcrito — pode ser vazio se o áudio for ilegível
  tags: string[] // IDs das tags sugeridas — pode ser vazio
}
```

**Fluxo (após migração):**
```
Etapa 1 — Validação do input
  → Etapa 2 — Upload no Storage (audios/{ficha_id}.webm) + atualiza url_audio na ficha
    → Etapa 3 — Transcrição via OpenAI Whisper (modelo whisper-1, idioma pt)
      → Etapa 4 — Sugestão de tags via AI Agent (gpt-4.1-mini)
        → atualiza transcricao_audio na ficha
          → retorna { text, tags }
```

**Fluxo atual (via n8n):**
```
Recebe áudio
  → delega ao n8n via WEBHOOK_DESCRICAO_CLIENTE
    → n8n processa e retorna { text, tags }
```

**Storage:** bucket privado. `url_audio` salva path relativo `audios/{ficha_id}.webm` — URL assinada gerada pelo front sob demanda.

**Sugestão de tags:** o AI Agent busca todas as tags da tabela `tags`, injeta a lista `{ id, nome }` no system message e retorna os IDs aplicáveis. Tags inexistentes no banco são ignoradas.

**Secrets (atual via n8n):**
- `WEBHOOK_DESCRICAO_CLIENTE`

**Secrets (após migração):**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

**Integrações externas:** n8n (atual) → OpenAI Whisper + AI Agent (após migração)

**Pendências:**
- Migrar para OpenAI Whisper direto, eliminando dependência do n8n
- Habilitar `verify_jwt = true`

> Spec completa: `spec_transcrever-audio.md`

---

## `salvar-ficha` 🔲 A implementar

**Status:** Não implementada — spec pronta

**Propósito:** Persistir os dados da ficha conferidos e corrigidos pelo vendedor, vincular o cliente, salvar tags e disparar a notificação WhatsApp.

**Quem chama e quando:** App mobile ao confirmar os dados da ficha.

**Tipo:** Síncrono

**Input:** JSON com `ficha_id`, `user_id`, dados do cliente (`cliente_id?`, `cliente_nome`, `cliente_telefone`), dados da ficha (tipo, datas, peças, valores, `pago`) e `tags?`.

**Output — HTTP 200:** `{ ficha_id, cliente_id }`

**Fluxo:**
```
Etapa 1 — Validação do input
  → Etapa 2 — Resolução do cliente (usa cliente_id existente ou chama criar-cliente)
    → Etapa 3 — Atualização da ficha (status: ativa, vincula cliente_id)
      → Etapa 4 — Salvar tags em relacao_cliente_tag (acumula — nunca remove)
        → chama notificar-ficha-whatsapp automaticamente
          → retorna { ficha_id, cliente_id }
```

**Secrets:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Pendências:**
- Implementar `criar-cliente` (dependência direta)
- Habilitar `verify_jwt = true`

> Spec completa: `spec_salvar-ficha.md`

---

## `criar-cliente` 🔲 A implementar

**Status:** Não implementada — spec pronta

**Propósito:** Criar um novo cliente no banco ou retornar o existente em caso de duplicata por telefone.

**Quem chama e quando:** `salvar-ficha` quando o cliente não existe no banco.

**Tipo:** Síncrono

**Input:** `{ nome, telefone, vendedor_id }`

**Output — HTTP 200:** `{ cliente_id }`

**Fluxo:**
```
Etapa 1 — Validação do input
  → Etapa 2 — Upsert: INSERT ... ON CONFLICT (telefone) DO NOTHING RETURNING id
    → Retornou id → cliente criado
    → Retornou vazio → SELECT por telefone → retorna cliente_id existente
```

**Pré-requisito:** `UNIQUE constraint` no campo `telefone` da tabela `clientes`.

**Secrets:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Pendências:**
- Habilitar `verify_jwt = true`

> Spec completa: `spec_criar-cliente.md`

---

## Funções planejadas

### `popular-tags-clientes` 🔲

**Status:** Não implementada

**Propósito:** A definir.

---

### `sugerir-tags-texto` 🔲

**Status:** Não implementada

**Propósito:** A definir.

---

## Pendências consolidadas

| Pendência | Função | Impacto |
|---|---|---|
| Descontinuar v1 e remover `webhooks` e `log_processo_ficha` | `processar-ficha` | Limpeza de legado |
| Implementar retry com `ocr_tentativa` e busca de cliente | `processar-ficha-v2` | Spec pronta — aguarda implementação |
| Migrar `url_bucket` para path relativo | `processar-ficha-v2` | Pré-requisito para deploy de `notificar-ficha-whatsapp` atualizada |
| Atualizar para GRUPO_GERAL + GRUPO_VENDA e URL assinada | `notificar-ficha-whatsapp` | Requer migration e url_bucket migrado |
| Migrar transcrição para OpenAI Whisper | `transcrever-audio` | Eliminar dependência do n8n |
| Implementar `criar-cliente` | `criar-cliente` | Pré-requisito de `salvar-ficha` |
| Implementar `salvar-ficha` | `salvar-ficha` | Fluxo de confirmação de fichas |
| Habilitar `verify_jwt = true` em todas as funções | Todas | Segurança — ver `decisoes-arquiteturais.md` ADR-06 |
