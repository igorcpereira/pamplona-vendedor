# Spec — `notificar-ficha-whatsapp`

## Visão geral

| | |
|---|---|
| **Status** | ✅ Ativa — requer atualização |
| **Propósito** | Enviar a ficha confirmada para os grupos de WhatsApp via Evolution API |
| **Quem chama** | `salvar-ficha` automaticamente ao confirmar a ficha. Vendedor pode acionar manualmente via botão na tela da ficha em caso de falha |
| **Tipo** | Síncrono — retorna confirmação ao front após todas as etapas |

---

## Contrato

### Input

```typescript
JSON {
  ficha_id: string // UUID da ficha a ser notificada
}
```

### Output

**Sempre HTTP 200** — o resultado do envio é indicado pelos campos de controle no body. O front lê `enviada_whatsapp_geral` e `enviada_whatsapp_venda` para determinar o que reenviar.

```typescript
{
  ficha_id: string
  enviada_whatsapp_geral: boolean
  enviada_whatsapp_venda: boolean  // relevante apenas para fichas do tipo venda
}
```

**Erro de validação — HTTP 400:**
```typescript
{
  error: string // Ficha não encontrada ou inválida
}
```

**Erro interno — HTTP 500:**
```typescript
{
  error: string // Falha crítica — URL assinada ou erro inesperado antes do envio
}
```

---

## Fluxo

```
Etapa 1 — Busca da ficha no banco
  → Etapa 2 — Geração da URL assinada (TTL: 1 hora)
    → Etapa 3 — Verificação dos campos de controle
      → Etapa 4 — Envios (paralelo via Promise.all para fichas de venda)
          Grupo geral — se enviada_whatsapp_geral: false
          Grupo venda — se enviada_whatsapp_venda: false (apenas tipo venda)
        → Etapa 5 — Atualização dos campos de controle no banco
          → retorna resultado ao front (sempre HTTP 200)
```

---

## Roteamento por tipo de ficha

| Tipo | Grupo Geral | Grupo Venda |
|---|---|---|
| `aluguel` | ✅ | — |
| `ajuste` | ✅ | — |
| `venda` | ✅ | ✅ |

Fichas do tipo `venda` são enviadas para os dois grupos simultaneamente.

---

## Etapas

### Etapa 1 — Busca da ficha no banco

Busca a ficha pelo `ficha_id` e valida que existe.

**Comportamento em erro:** ficha não encontrada → HTTP 400, aborta tudo.

---

### Etapa 2 — Geração da URL assinada

Gera a URL assinada temporária a partir do path relativo salvo em `url_bucket`.

**TTL:** 1 hora — tempo suficiente para a Evolution API processar o envio.

**Comportamento em erro:** falha ao gerar URL → HTTP 500, aborta tudo. Campos de controle permanecem inalterados.

---

### Etapa 3 — Verificação dos campos de controle

Antes de qualquer envio, a função verifica `enviada_whatsapp_geral` e `enviada_whatsapp_venda` para determinar quais grupos ainda precisam receber a mensagem. Isso garante que o reenvio manual seja sempre cirúrgico — nunca reenvia para um grupo que já recebeu.

| Campo | Valor | Comportamento |
|---|---|---|
| `enviada_whatsapp_geral: false` | Envia para o grupo geral |
| `enviada_whatsapp_geral: true` | Pula — já recebeu |
| `enviada_whatsapp_venda: false` | Envia para o grupo de venda (apenas tipo venda) |
| `enviada_whatsapp_venda: true` | Pula — já recebeu |

---

### Etapa 4 — Envios

Para fichas do tipo `venda`, os envios para grupo geral e grupo de venda rodam em paralelo via `Promise.all` — erros são capturados individualmente.

**Conteúdo da mensagem:**
- Imagem: URL assinada gerada na Etapa 2
- Legenda: nome e telefone do cliente

**Comportamento em erro:**

| Cenário | Comportamento |
|---|---|
| Falha no grupo geral | `enviada_whatsapp_geral` permanece `false` |
| Falha no grupo de venda | `enviada_whatsapp_venda` permanece `false` |
| Ambos falham | Ambos os campos permanecem `false` |

---

### Etapa 5 — Atualização dos campos de controle

Atualiza os campos de controle na tabela `fichas` conforme o resultado das etapas anteriores.

| Campo | Valor |
|---|---|
| `enviada_whatsapp_geral` | `true` se Etapa 3 foi bem sucedida |
| `enviada_whatsapp_venda` | `true` se Etapa 4 foi bem sucedida — apenas fichas de venda |
| `updated_at` | automático |

---

## Tabela de fallbacks

| Cenário | `enviada_whatsapp_geral` | `enviada_whatsapp_venda` | HTTP |
|---|---|---|---|
| Tudo ok — aluguel/ajuste | `true` | — | 200 |
| Tudo ok — venda | `true` | `true` | 200 |
| Falha na URL assinada | inalterado | inalterado | 500 |
| Falha no grupo geral | `false` | `false` | 200 |
| Grupo geral ok, falha no grupo de venda | `true` | `false` | 200 |
| Ambos falham — venda | `false` | `false` | 200 |

> HTTP 500 apenas em falha crítica antes do envio — ex: URL assinada não gerada. Em qualquer outro caso, retorna HTTP 200 com os campos de controle indicando o resultado.

---

## Reenvio manual

Quando `enviada_whatsapp_geral` ou `enviada_whatsapp_venda` for `false`, o vendedor pode acionar o reenvio via botão na tela da ficha.

A função **sempre verifica os campos de controle antes de enviar** — tanto no disparo automático pela `salvar-ficha` quanto no reenvio manual pelo vendedor. Isso garante que nenhum grupo receba a mensagem duas vezes.

---

## Secrets

| Secret | Uso |
|---|---|
| `SUPABASE_URL` | Conexão com o banco e Storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Operações no banco com permissão de service role |
| `EVOLUTION_BASE_URL` | URL base da Evolution API |
| `EVOLUTION_INSTANCE` | Instância da Evolution API |
| `EVOLUTION_API_KEY` | Chave de autenticação da Evolution API |
| `EVOLUTION_GRUPO_GERAL` | ID do grupo geral de WhatsApp |
| `EVOLUTION_GRUPO_VENDA` | ID do grupo de vendas de WhatsApp |

---

## Funções relacionadas

| Função | Relação |
|---|---|
| `salvar-ficha` | Chama esta função automaticamente ao confirmar a ficha |

---

## Impacto em outros documentos

| Documento | O que atualizar |
|---|---|
| `modelo_de_dados.md` | Substituir `enviada_whatsapp` por `enviada_whatsapp_geral` e `enviada_whatsapp_venda` na tabela `fichas` |
| `edge_functions.md` | Atualizar secrets e comportamento da `notificar-ficha-whatsapp` |
| `spec_salvar-ficha.md` | Registrar que `notificar-ficha-whatsapp` é chamada automaticamente ao salvar |

---

## Pré-requisitos de deploy

> ⚠️ Os itens abaixo bloqueiam o deploy desta função. Devem ser resolvidos antes da implantação.

| Pré-requisito | Motivo |
|---|---|
| Migration: adicionar `enviada_whatsapp_geral` e `enviada_whatsapp_venda`, remover `enviada_whatsapp` | A função grava nesses campos — sem a migration o deploy falha |
| `processar-ficha-v2` já deve estar salvando path relativo em `url_bucket` | A Etapa 2 assume path relativo para gerar URL assinada — fichas com URL pública completa vão falhar |

---

## Pendências

| Pendência | Impacto |
|---|---|
| Habilitar `verify_jwt = true` | Segurança — ver `arquitetura.md` |
| Remover secrets obsoletos `EVOLUTION_GRUPO_ALUGUEL` e `EVOLUTION_GRUPO_AJUSTE` | Substituídos por `EVOLUTION_GRUPO_GERAL` |
