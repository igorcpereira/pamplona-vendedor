# Spec — `salvar-ficha`

## Visão geral

| | |
|---|---|
| **Status** | 🔲 A implementar |
| **Propósito** | Persistir os dados da ficha conferidos e corrigidos pelo vendedor, vincular o cliente e salvar tags |
| **Quem chama** | App mobile ao confirmar os dados da ficha |
| **Tipo** | Síncrono — retorna confirmação ao front após todas as etapas |

---

## Contrato

### Input

```typescript
JSON {
  ficha_id: string         // UUID da ficha a ser salva
  user_id: string          // UUID do vendedor autenticado

  // Dados do cliente
  cliente_id?: string      // UUID — se já existe no banco
  cliente_nome: string     // Nome confirmado pelo vendedor
  cliente_telefone: string // Telefone confirmado pelo vendedor

  // Dados da ficha
  tipo: string             // "aluguel" | "venda" | "ajuste"
  data_retirada: string    // YYYY-MM-DD
  data_devolucao?: string  // YYYY-MM-DD — apenas aluguel
  data_festa?: string      // YYYY-MM-DD
  paleto?: string
  calca?: string
  camisa?: string
  sapato?: string
  valor?: number
  valor_paleto?: number
  valor_calca?: number
  valor_camisa?: number
  garantia?: number
  pago: boolean
  descricao_cliente?: string

  // Tags
  tags?: string[]          // IDs das tags a vincular ao cliente
}
```

**Campos obrigatórios:** `ficha_id`, `user_id`, `cliente_nome`, `cliente_telefone`, `tipo`, `data_retirada`, `pago`

> O front bloqueia o envio sem cliente vinculado — toda ficha salva deve ter cliente identificado.

### Output

**Sucesso — HTTP 200:**
```typescript
{
  ficha_id: string    // UUID da ficha salva
  cliente_id: string  // UUID do cliente — criado ou existente
}
```

**Erro de validação — HTTP 400:**
```typescript
{
  error: string // Descrição do campo inválido ou ausente
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
  → Etapa 2 — Resolução do cliente (criar ou buscar)
    → Etapa 3 — Atualização da ficha
      → Etapa 4 — Salvar tags (se houver)
        → retorna { ficha_id, cliente_id } ao front
```

---

## Etapas

### Etapa 1 — Validação do input

| Validação | Erro retornado |
|---|---|
| `ficha_id` ausente ou inválido | HTTP 400 |
| `cliente_nome` ausente | HTTP 400 |
| `cliente_telefone` ausente | HTTP 400 |
| `tipo` ausente ou fora do enum | HTTP 400 |
| `data_retirada` ausente ou inválida | HTTP 400 |

**Comportamento em erro:** aborta o fluxo, nada é salvo.

---

### Etapa 2 — Resolução do cliente

| Cenário | Comportamento |
|---|---|
| `cliente_id` informado | Usa o cliente existente — não cria novo |
| `cliente_id` ausente | Chama `criar-cliente` com `nome` e `telefone` |

> A criação do cliente é delegada à função `criar-cliente` — reutilizável por outros fluxos.

**Comportamento em erro:** falha ao criar cliente → HTTP 500, aborta tudo. Sem cliente não é possível salvar a ficha.

---

### Etapa 3 — Atualização da ficha

Persiste todos os campos corrigidos pelo vendedor e vincula o cliente.

**Campos atualizados:**

| Campo | Valor |
|---|---|
| Todos os campos do input | Conforme enviado pelo vendedor |
| `cliente_id` | Resolvido na Etapa 2 |
| `status` | `ativa` — apenas se estava `pendente`. Salvamentos subsequentes não alteram o status |
| `updated_at` | automático |

**Comportamento em erro:** HTTP 500, ficha permanece no estado anterior.

---

### Etapa 4 — Salvar tags

Vincula as tags ao cliente em `relacao_cliente_tag`.

**Regras:**
- Apenas insere vínculos novos — nunca remove existentes
- Duplicatas são ignoradas silenciosamente
- Tags são vinculadas ao `cliente_id`, não à ficha

**Comportamento em erro:** não aborta o salvamento da ficha — a ficha já foi salva na Etapa 3. Tags ficam pendentes e podem ser adicionadas em um salvamento posterior.

---

## Comportamento em salvamentos múltiplos

A ficha pode ser salva mais de uma vez — o vendedor pode corrigir campos ou adicionar informações após o primeiro salvamento.

| | Primeiro salvamento | Salvamentos subsequentes |
|---|---|---|
| `status` | `pendente` → `ativa` | Permanece `ativa` |
| `cliente_id` | Vinculado | Já vinculado — não altera |
| Campos da ficha | Persistidos | Atualizados com novos valores |
| Tags | Inseridas | Acumuladas — nunca substituídas |

---

## Secrets

| Secret | Uso |
|---|---|
| `SUPABASE_URL` | Conexão com o banco |
| `SUPABASE_SERVICE_ROLE_KEY` | Operações no banco com permissão de service role |

---

## Funções relacionadas

| Função | Relação |
|---|---|
| `criar-cliente` | Chamada pela Etapa 2 quando o cliente não existe no banco |
| `processar-ficha-v2` | Cria a ficha que esta função confirma |
| `notificar-ficha-whatsapp` | Chamada após o salvamento para enviar a ficha ao WhatsApp |

---

## Impacto em outros documentos

| Documento | O que atualizar |
|---|---|
| `modelo_de_dados.md` | Remover `ltv` da tabela `clientes` — campo obsoleto, cálculo feito sob demanda |
| `edge_functions.md` | Adicionar `salvar-ficha` e `criar-cliente` ao índice de funções |

---

## Pendências

| Pendência | Impacto |
|---|---|
| Habilitar `verify_jwt = true` | Segurança — ver `arquitetura.md` |
| Implementar `criar-cliente` | Dependência direta desta função |
| Definir se `notificar-ficha-whatsapp` é chamada automaticamente aqui ou manualmente pelo vendedor | Hoje é manual — avaliar automação |
