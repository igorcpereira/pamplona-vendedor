# Arquitetura — App Mobile Pamplona Alfaiataria

## Stack

| Camada | Tecnologia | Papel |
|---|---|---|
| **Frontend** | React + Vite + TypeScript | SPA mobile-first |
| **Estilização** | Tailwind CSS + shadcn/ui | Design system |
| **Backend** | Supabase | Auth, banco, storage, edge functions |
| **OCR** | OpenAI gpt-4.5 (Chat Completions) | Leitura de fichas manuscritas |
| **Notificação** | Evolution API | Envio de imagens via WhatsApp |

---

## Estrutura de pastas

Apenas as pastas relevantes para navegação e contribuição:

```
src/
  pages/        — telas da aplicação
  components/   — componentes reutilizáveis
  hooks/        — lógica de dados e estado
  contexts/     — Auth, Theme
supabase/
  functions/    — edge functions (Deno)
  migrations/   — histórico do schema
docs/           — documentação
```

> Detalhes de cada edge function estão em `edge_functions.md`. Modelo de dados em `modelo_de_dados.md`.

---

## Fluxo principal

```
Vendedor → tira foto
  → processar-ficha-v2 (Edge Function)
    → cria ficha no banco (status: pendente)
    → retorna ficha_id imediatamente
    → [background] upload para Storage
    → [background] OpenAI → parse → atualiza ficha
  → vendedor confere e salva
    → notificar-ficha-whatsapp (Edge Function)
      → Evolution API → grupo WhatsApp
```

O retorno imediato do `ficha_id` é intencional — o processamento pesado acontece em background para não travar a interface do vendedor. Ver decisão arquitetural abaixo.

---

## Integrações externas

| Integração | Papel | Configuração |
|---|---|---|
| **OpenAI** | OCR das fichas manuscritas via Chat Completions | Secret salvo no Supabase |
| **Evolution API** | Envio das fichas para os grupos WhatsApp | Secret salvo no Supabase |
| **Supabase** | Auth, banco, storage, edge functions | Variáveis no `.env` via `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` |

> Todos os secrets críticos estão armazenados no Supabase Secrets, nunca expostos no repositório.

---

## Deploy

| Camada | Como |
|---|---|
| **Frontend** | Vercel — CI automático a cada push para `main` |
| **Edge Functions** | Deploy manual via `npx supabase functions deploy` |

---

## Decisões arquiteturais

### Fire-and-forget com `EdgeRuntime.waitUntil()`

O upload para o Storage e o processamento OCR via OpenAI rodam em background após a Edge Function retornar o `ficha_id`. Isso evita que o vendedor fique aguardando o processamento pesado na tela — a resposta é imediata e o restante acontece de forma assíncrona.

### `url_bucket` salva URL pública completa ⚠️ Revisão pendente

Atualmente o banco armazena a URL pública completa do arquivo no Storage. **Isso é frágil:** qualquer mudança no nome do bucket, região ou configuração quebra todas as URLs salvas.

**Recomendação:** salvar apenas o path relativo e montar a URL pública em runtime. Isso precisa ser avaliado e corrigido.

### `verify_jwt = false` nas Edge Functions ⚠️ Correção necessária

As Edge Functions estão configuradas com `verify_jwt = false`, o que significa que aceitam chamadas sem autenticação, de qualquer origem.

Como todas as funções devem ser chamadas exclusivamente de dentro da área logada do app, **isso representa um risco de segurança**. O correto é habilitar `verify_jwt = true` em todas as functions para garantir que apenas usuários autenticados via Supabase Auth consigam acioná-las.

**Ação necessária:** revisar e habilitar a validação de JWT em todas as Edge Functions.
