# Spec — `transcrever-audio`

## Visão geral

| | |
|---|---|
| **Status** | ✅ Ativa — migração para edge function pendente |
| **Propósito** | Fazer upload do áudio no Storage, transcrever via OpenAI Whisper e retornar o texto transcrito e tags sugeridas |
| **Quem chama** | App mobile ao finalizar a gravação de áudio na tela de ficha |
| **Tipo** | Síncrono — retorna `{ text, tags }` ao front após todas as etapas. Atualiza `url_audio` e `transcricao_audio` diretamente na ficha |

---

## Contexto

Hoje essa função delega para o n8n via webhook. O n8n executa a transcrição via OpenAI Whisper e a sugestão de tags via AI Agent (`gpt-4.1-mini`) que consulta a tabela `tags` do Supabase como ferramenta.

Esta spec documenta o comportamento atual e serve de base para a migração direta para edge function, eliminando a dependência do n8n.

---

## Contrato

### Input

```typescript
FormData {
  audio: File    // Arquivo de áudio gravado pelo vendedor
  ficha_id: string // UUID da ficha vinculada ao áudio
}
```

**Formato aceito:** `webm`

### Output

**Sucesso — HTTP 200:**
```typescript
{
  text: string   // Texto transcrito — pode ser vazio se o áudio for ilegível
  tags: string[] // IDs das tags sugeridas — pode ser vazio
}
```

**Erro de validação — HTTP 400:**
```typescript
{
  error: "audio_required"
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
Etapa 1 — Validação do input
  → Etapa 2 — Upload do áudio no Storage + atualiza url_audio na ficha
    → Etapa 3 — Transcrição via OpenAI Whisper
      → Etapa 4 — Sugestão de tags via AI Agent
        → atualiza transcricao_audio na ficha
          → retorna { text, tags } ao front
```

---

## Etapas

### Etapa 1 — Validação do input

| Validação | Erro retornado |
|---|---|
| Áudio ausente | HTTP 400 `audio_required` |
| `ficha_id` ausente | HTTP 400 `ficha_id_required` |

**Comportamento em erro:** aborta o fluxo, nada é processado.

---

### Etapa 2 — Upload no Storage e atualização da ficha

Faz o upload do arquivo de áudio para o bucket privado e atualiza `url_audio` na ficha.

**Configuração:**

| Parâmetro | Valor |
|---|---|
| Bucket | Privado |
| Path | `audios/{ficha_id}.webm` |
| `url_audio` | Salva path relativo — URL assinada gerada pelo front sob demanda |

**Campos atualizados na ficha:**

| Campo | Valor |
|---|---|
| `url_audio` | Path relativo `audios/{ficha_id}.webm` |

**Comportamento em erro:** falha no upload → HTTP 500, aborta tudo.

---

### Etapa 3 — Transcrição via OpenAI Whisper

Envia o arquivo de áudio para a API de transcrição da OpenAI.

**Configuração:**

| Parâmetro | Valor |
|---|---|
| Modelo | `whisper-1` |
| Idioma | `pt` |
| Formato de entrada | `webm` |

**Comportamento em erro:**

| Cenário | Comportamento |
|---|---|
| Falha na chamada à OpenAI | HTTP 500 — aborta tudo |
| Áudio ilegível ou silêncio | Whisper retorna texto vazio → retorna `{ text: "", tags: [] }` — vendedor preenche manualmente |

---

### Etapa 4 — Sugestão de tags via AI Agent

Recebe o texto transcrito, busca todas as tags do banco, injeta a lista com IDs e nomes no system message e pede ao modelo que retorne os IDs das tags que se aplicam ao cliente descrito.

**Modelo:** `gpt-4.1-mini`

**Comportamento:**
- Busca todas as tags da tabela `tags` antes de chamar o modelo
- Injeta a lista `{ id, nome }` no system message com instrução para retornar apenas os IDs aplicáveis
- O modelo retorna diretamente os UUIDs — sem necessidade de resolução nome → UUID pela edge function
- Tags sugeridas que não existem no banco são ignoradas silenciosamente

**Campos atualizados na ficha:**

| Campo | Valor |
|---|---|
| `transcricao_audio` | Texto transcrito pelo Whisper |

**Comportamento em erro:**

| Cenário | Comportamento |
|---|---|
| Falha completa do AI Agent | Retorna `{ text: <transcrito>, tags: [] }` — vendedor seleciona tags manualmente |
| Tag sugerida não existe na tabela `tags` | Ignorada silenciosamente |
| Sucesso parcial | Retorna apenas as tags que existem no banco |

> Tags são secundárias — qualquer falha nessa etapa não impede o retorno do texto transcrito.

---

## Tabela de fallbacks

| Cenário | `text` | `tags` | `url_audio` | `transcricao_audio` | HTTP |
|---|---|---|---|---|---|
| Tudo ok | Texto transcrito | Tags sugeridas | Salvo | Salvo | 200 |
| Áudio ilegível ou silêncio | `""` | `[]` | Salvo | `""` | 200 |
| Falha no upload do Storage | — | — | — | — | 500 |
| Falha no Whisper | — | — | Salvo | — | 500 |
| Falha no AI Agent | Texto transcrito | `[]` | Salvo | Salvo | 200 |
| Tag sugerida inexistente no banco | Texto transcrito | Tags válidas apenas | Salvo | Salvo | 200 |

---

## Secrets

### Hoje (via n8n)
| Secret | Uso |
|---|---|
| `WEBHOOK_DESCRICAO_CLIENTE` | URL do webhook n8n |

### Após migração para edge function
| Secret | Uso |
|---|---|
| `SUPABASE_URL` | Conexão com o banco |
| `SUPABASE_SERVICE_ROLE_KEY` | Consulta à tabela `tags` |
| `OPENAI_API_KEY` | Whisper + AI Agent |

---

## Funções relacionadas

| Função | Relação |
|---|---|
| `salvar-ficha` | As tags retornadas são vinculadas ao cliente em `relacao_cliente_tag` ao confirmar a ficha |

---

## Impacto em outros documentos

| Documento | O que atualizar |
|---|---|
| `edge_functions.md` | Atualizar status e fluxo da `transcrever-audio` após migração |
| `modelo_de_dados.md` | Confirmar campos `url_audio` e `transcricao_audio` na tabela `fichas` |
| `spec_salvar-ficha.md` | Remover `transcricao_audio` do input — agora é salvo diretamente por esta função |

---

## Pendências

| Pendência | Impacto |
|---|---|
| Migrar para edge function eliminando dependência do n8n | Hoje delega via webhook — migração para Whisper + AI Agent direto na edge function |
| Habilitar `verify_jwt = true` | Segurança — ver `arquitetura.md` |
