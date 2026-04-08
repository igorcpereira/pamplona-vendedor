# Configuração — App Mobile Pamplona Alfaiataria

> Este documento centraliza tudo relacionado a variáveis de ambiente, secrets e configurações necessárias para o app funcionar. Consulte antes de fazer deploy ou configurar um novo ambiente.

---

## 1. Frontend (.env)

O frontend usa três variáveis com prefixo `VITE_`. Variáveis com esse prefixo são embutidas no bundle JavaScript e ficam visíveis no browser — isso é intencional e esperado.

| Variável | O que é | Onde obter |
|---|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Dashboard → Settings → API |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto Supabase | Dashboard → Settings → General |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key do Supabase | Dashboard → Settings → API |

> **Sobre a anon key:** ela é pública por design — é seguro expô-la no bundle. O que protege os dados são as políticas RLS configuradas no banco, não o segredo da chave. Qualquer requisição feita com a anon key ainda está sujeita às regras de acesso definidas por RLS.

**Comportamento se ausentes:** o app não inicializa — tela em branco sem mensagem de erro útil.

**Pendência:** não existe `.env.example` no repositório — apenas o `.env` real. Criar o `.env.example` com os nomes das variáveis e valores fictícios é necessário para onboarding de novos desenvolvedores.

---

## 2. Edge Functions — auto-injetados pelo Supabase

As duas variáveis abaixo são injetadas automaticamente pelo runtime do Supabase em todas as Edge Functions. **Não precisam ser configuradas manualmente.**

| Variável | O que é |
|---|---|
| `SUPABASE_URL` | URL do projeto — igual à `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de service role — bypassa RLS, nunca expor no frontend |

---

## 3. Edge Functions — configuração manual

Os secrets abaixo precisam ser configurados manualmente no Supabase Dashboard ou via CLI:

```bash
supabase secrets set NOME_DO_SECRET=valor
```

### OpenAI

| Secret | Funções que usam | O que quebra se ausente |
|---|---|---|
| `OPENAI_API_KEY` | `processar-ficha-v2`, `transcrever-audio` (após migração) | Ficha é criada no banco mas OCR falha — `status: erro` |

> ⚠️ Sensível — tem custo por uso. Proteger acesso ao dashboard.

### Evolution API (WhatsApp)

| Secret | Funções que usam | O que quebra se ausente |
|---|---|---|
| `EVOLUTION_BASE_URL` | `notificar-ficha-whatsapp` | Envio WhatsApp falha — `enviada_whatsapp_geral/venda: false` |
| `EVOLUTION_INSTANCE` | `notificar-ficha-whatsapp` | Envio WhatsApp falha — `enviada_whatsapp_geral/venda: false` |
| `EVOLUTION_API_KEY` | `notificar-ficha-whatsapp` | Envio WhatsApp falha — `enviada_whatsapp_geral/venda: false` |
| `EVOLUTION_GRUPO_GERAL` | `notificar-ficha-whatsapp` | Fichas de aluguel e ajuste não são notificadas |
| `EVOLUTION_GRUPO_VENDA` | `notificar-ficha-whatsapp` | Fichas de venda não são notificadas no grupo de vendas |

> ⚠️ `EVOLUTION_GRUPO_ALUGUEL` e `EVOLUTION_GRUPO_AJUSTE` estão configurados hoje mas serão removidos — substituídos por `EVOLUTION_GRUPO_GERAL`. Ver pendências em `edge_functions.md`.

### n8n (legado)

| Secret | Funções que usam | O que quebra se ausente |
|---|---|---|
| `WEBHOOK_DESCRICAO_CLIENTE` | `transcrever-audio` | Função falha com HTTP 500 imediato — transcrição não ocorre |

> Este secret será removido quando `transcrever-audio` for migrada para OpenAI diretamente. Ver `edge_functions.md`.

---

## 4. verify_jwt (supabase/config.toml)

O `verify_jwt` controla se a Edge Function exige um token JWT válido do Supabase Auth para aceitar requisições. Com `verify_jwt = false`, qualquer request — mesmo sem autenticação — chega à função.

**Estado atual:** todas as funções estão com `verify_jwt = false`.

```toml
# supabase/config.toml
[functions.processar-ficha-v2]
verify_jwt = false  # ⚠️ Pendência — deve ser true
```

Como todas as funções devem ser chamadas exclusivamente de dentro da área logada do app, **habilitar `verify_jwt = true` é uma pendência de segurança** registrada em `arquitetura.md`. Para corrigir, basta alterar o valor no `config.toml` de cada função e fazer o deploy novamente.

---

## 5. Como configurar um novo ambiente

Sequência completa para subir o projeto do zero:

**1. Criar projeto no Supabase**
Acesse [supabase.com](https://supabase.com) e crie um novo projeto. Anote a URL, o Project ID e a anon key.

**2. Configurar o frontend**
```bash
cp .env.example .env
# Preencher VITE_SUPABASE_URL, VITE_SUPABASE_PROJECT_ID e VITE_SUPABASE_PUBLISHABLE_KEY
```

**3. Executar as migrations**
```bash
supabase db push
```

**4. Configurar os secrets das Edge Functions**
```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set EVOLUTION_BASE_URL=https://...
supabase secrets set EVOLUTION_INSTANCE=nome-da-instancia
supabase secrets set EVOLUTION_API_KEY=...
supabase secrets set EVOLUTION_GRUPO_GERAL=...
supabase secrets set EVOLUTION_GRUPO_VENDA=...
supabase secrets set WEBHOOK_DESCRICAO_CLIENTE=https://...
```

**5. Fazer deploy das Edge Functions**
```bash
supabase functions deploy processar-ficha-v2
supabase functions deploy notificar-ficha-whatsapp
supabase functions deploy transcrever-audio
supabase functions deploy salvar-ficha       # quando implementada
supabase functions deploy criar-cliente      # quando implementada
```

**6. Verificar**
- Abrir o app e tentar criar uma ficha de teste
- Verificar logs das funções no Dashboard → Edge Functions → Logs

---

## Pendências

| Pendência | Impacto |
|---|---|
| Criar `.env.example` no repositório | Onboarding de novos devs sem expor valores reais |
| Habilitar `verify_jwt = true` em todas as funções | Segurança — ver `arquitetura.md` |
| Remover `EVOLUTION_GRUPO_ALUGUEL` e `EVOLUTION_GRUPO_AJUSTE` | Substituídos por `EVOLUTION_GRUPO_GERAL` |
| Remover `WEBHOOK_DESCRICAO_CLIENTE` após migração do `transcrever-audio` | Eliminar dependência do n8n |
