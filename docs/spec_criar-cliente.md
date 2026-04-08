# Spec — `criar-cliente`

## Visão geral

| | |
|---|---|
| **Status** | 🔲 A implementar |
| **Propósito** | Criar um novo cliente no banco ou retornar o existente em caso de duplicata |
| **Quem chama** | `salvar-ficha` — quando o cliente não existe no banco |
| **Tipo** | Síncrono — retorna `cliente_id` imediatamente |

---

## Pré-requisitos

> ⚠️ Esta função depende de um `UNIQUE constraint` no campo `telefone` da tabela `clientes`. Sem essa constraint, inserções duplicadas não geram erro identificável e o fallback para busca do cliente existente nunca é acionado — dois clientes com o mesmo telefone seriam criados silenciosamente.
>
> **A migration de unicidade precisa existir antes do deploy desta função.**

---

## Contrato

### Input

```typescript
JSON {
  nome: string        // Nome do cliente
  telefone: string    // Formato 55xx9xxxxxxxx
  vendedor_id: string // UUID do vendedor que está cadastrando
}
```

**Campos obrigatórios:** `nome`, `telefone`, `vendedor_id`

### Output

**Sucesso — HTTP 200:**
```typescript
{
  cliente_id: string // UUID do cliente criado ou encontrado
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
  → Etapa 2 — Upsert do cliente no banco
    → Cliente criado → retorna { cliente_id }
    → Conflito de telefone → busca cliente pelo telefone → retorna { cliente_id } existente
    → Outro erro → HTTP 500
```

---

## Etapas

### Etapa 1 — Validação do input

| Validação | Erro retornado |
|---|---|
| `nome` ausente | HTTP 400 |
| `telefone` ausente | HTTP 400 |
| `telefone` fora do formato `55xx9xxxxxxxx` | HTTP 400 |
| `vendedor_id` ausente | HTTP 400 |

**Comportamento em erro:** aborta o fluxo, nada é criado.

---

### Etapa 2 — Criação do cliente

Utiliza upsert via `ON CONFLICT (telefone) DO NOTHING RETURNING id` para tratar duplicatas de forma limpa e sem ambiguidade no tipo de erro.

**Campos preenchidos na criação:**

| Campo | Valor |
|---|---|
| `nome` | vem do input |
| `telefone` | vem do input |
| `vendedor_id` | vem do input |
| `created_at` | automático |
| `updated_at` | automático |

> `ltv` não é preenchido na criação — ignorado por esta função. O cálculo é feito sob demanda como somatório das fichas vinculadas ao cliente.

**Comportamento em caso de conflito:**

O telefone é a chave de unicidade do cliente. Se já existir um cliente com o mesmo telefone, o upsert retorna vazio. Nesse caso a função faz um SELECT por telefone e retorna o `cliente_id` encontrado.

```sql
-- Upsert
INSERT INTO clientes (nome, telefone, vendedor_id)
VALUES (...)
ON CONFLICT (telefone) DO NOTHING
RETURNING id;

-- Se retornar vazio (conflito):
SELECT id FROM clientes WHERE telefone = '...'
```

```
Upsert
  → Retorna id → cliente criado → retorna { cliente_id }
  → Retorna vazio (conflito) → SELECT por telefone → retorna { cliente_id } existente
  → Erro inesperado → HTTP 500
```

> Esse comportamento garante que a `salvar-ficha` nunca seja abortada por uma race condition de cadastro simultâneo.

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
| `salvar-ficha` | Principal chamadora desta função |

---

## Impacto em outros documentos

| Documento | O que atualizar |
|---|---|
| `edge_functions.md` | Adicionar `criar-cliente` ao índice de funções |
| `modelo_de_dados.md` | Registrar `UNIQUE constraint` no campo `telefone` da tabela `clientes` como pré-requisito desta função |

---

## Pendências

| Pendência | Impacto |
|---|---|
| Habilitar `verify_jwt = true` | Segurança — ver `arquitetura.md` |
