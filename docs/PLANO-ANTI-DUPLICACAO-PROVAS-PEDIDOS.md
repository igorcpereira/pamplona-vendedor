# Plano — Anti-duplicação de provas e pedidos avulsos (app vendedor)

## Contexto e diagnóstico (2026-07-17)

Usuário relatou provas e possíveis vendas avulsas duplicadas (duas provas para o
mesmo cliente no mesmo minuto — impossível pela regra de negócio).

**Dados reais (banco `pukcbqfjzswqmjkhwzfk`):**
- `provas`: **43 duplicatas** (mesma chave de cliente + mesmo vendedor em janela de 10 min) em 611 registros (~7%).
- `pedidos`: **0 duplicatas** (mesmo vendedor/ficha/valor em 2 min) em 114 — a suspeita não se confirma; lá basta prevenção.

**Causa raiz (exploração do front):** todos os inserts de `provas`/`pedidos` são
diretos do front; a única proteção é `disabled={isPending}`, que depende do
re-render assíncrono do React — dois cliques antes do re-render passam ambos.
Não há lock síncrono, debounce, RPC nem UNIQUE no banco.

Pontos vulneráveis (ranking):

| Ponto | Insert | Botão | Risco |
|---|---|---|---|
| Pedido avulso | `PedidoAvulsoModal.tsx:148` (handler 88-197, multi-insert não transacional: ficha+cliente+pedido+itens) | `:312 disabled={isPending}` | Alto |
| Prova avulsa | `ProvaAvulsaModal.tsx:154` (handler 137-177) | `:289 disabled={isPending}` | Alto — cenário relatado |
| Pedido na ficha | `usePedidosFicha.ts:107` via `PedidoModal.tsx` (handler 79-111) | `:208 disabled={isPending}` | Médio |
| Prova na ficha | `useProvasFicha.ts:34` via `EditarFichaV3.handleAdicionarProva` (322-333) | `EditarFichaV3.tsx:1064` | Médio |

Chave de identidade do "cliente" numa prova (`provas` não tem `cliente_id`):
`ficha_id` quando vinculada; senão `telefone_cliente`; senão `lower(nome_cliente)`.

## Camada 1 — Front: trava síncrona de clique duplo (4 pontos)

Novo hook `src/hooks/useTravaSubmit.ts`:

```ts
import { useCallback, useRef } from 'react';

/** Trava síncrona contra duplo clique: ignora chamadas enquanto uma execução está em andamento. */
export function useTravaSubmit() {
  const executando = useRef(false);
  return useCallback(async (fn: () => Promise<void>) => {
    if (executando.current) return;
    executando.current = true;
    try { await fn(); } finally { executando.current = false; }
  }, []);
}
```

Aplicar envolvendo o corpo dos 4 handlers (mantendo o `disabled={isPending}`
existente como segunda linha de defesa):
- `ProvaAvulsaModal.handleSalvar`
- `PedidoAvulsoModal.handleSalvar`
- `PedidoModal.handleSalvar`
- `EditarFichaV3.handleAdicionarProva`

O `useRef` é síncrono — o segundo clique é ignorado mesmo antes de qualquer
re-render. Cobre os 4 fluxos, incluindo o pedido avulso multi-passo.

## Camada 2 — Banco: trigger de regra de negócio nas provas (janela de 10 min)

Migration no `pamplona-db` (aplicar via MCP):

```sql
CREATE FUNCTION public.trg_provas_bloqueia_duplicada() RETURNS trigger ... AS $$
DECLARE
  v_chave text;
BEGIN
  v_chave := COALESCE(NEW.ficha_id::text, NULLIF(NEW.telefone_cliente, ''), lower(coalesce(NEW.nome_cliente, '')));
  IF v_chave <> '' AND EXISTS (
    SELECT 1 FROM public.provas p
    WHERE p.vendedor_id = NEW.vendedor_id
      AND COALESCE(p.ficha_id::text, NULLIF(p.telefone_cliente, ''), lower(coalesce(p.nome_cliente, ''))) = v_chave
      AND p.created_at > now() - interval '10 minutes'
  ) THEN
    RAISE EXCEPTION 'Prova duplicada: ja existe uma prova deste vendedor para este cliente nos ultimos 10 minutos.'
      USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_provas_bloqueia_duplicada
  BEFORE INSERT ON public.provas FOR EACH ROW
  EXECUTE FUNCTION public.trg_provas_bloqueia_duplicada();
```

- Vale para QUALQUER caminho de escrita (front, SQL, futuras integrações) — é a
  deduplicação de verdade que o clique duplo do front não cobre (dois aparelhos,
  duas abas, retry de rede).
- Front: nos catch de `ProvaAvulsaModal` e `useAdicionarProva`, detectar a
  mensagem ('Prova duplicada') e mostrar toast amigável em vez de erro genérico.
- `pedidos` NÃO ganha trigger (dados mostram 0 casos; pedido repetido em 10 min
  pode ser legítimo — duas compras). Só a trava de clique do front.

## Camada 3 — Limpeza das 43 duplicatas existentes

Na mesma migration (com contagem comentada antes/depois):

```sql
DELETE FROM public.provas a
USING public.provas b
WHERE a.vendedor_id = b.vendedor_id
  AND COALESCE(a.ficha_id::text, NULLIF(a.telefone_cliente,''), lower(coalesce(a.nome_cliente,'')))
    = COALESCE(b.ficha_id::text, NULLIF(b.telefone_cliente,''), lower(coalesce(b.nome_cliente,'')))
  AND COALESCE(b.ficha_id::text, NULLIF(b.telefone_cliente,''), lower(coalesce(b.nome_cliente,''))) <> ''
  AND b.created_at < a.created_at
  AND b.created_at > a.created_at - interval '10 minutes';
```

Mantém a prova mais antiga de cada grupo e apaga as posteriores dentro da
janela (cadeias A→B→C caem juntas). Antes de rodar: `SELECT` com a mesma
condição para conferir os 43. Efeito colateral esperado: contadores de provas
no dashboard/resumo diminuem (~43).

## Verificação

1. `npx tsc --noEmit` + eslint nos arquivos tocados (vendedor).
2. SQL (BEGIN/ROLLBACK): inserir a mesma prova duas vezes → segunda deve falhar
   com 'Prova duplicada'; inserir com vendedor diferente → passa; inserir após
   10 min (created_at manipulado) → passa.
3. Dev server: registrar prova avulsa normal (passa); tentar registrar de novo
   em seguida → toast amigável de duplicada; duplo clique rápido nos 4 botões →
   1 registro só.
4. Conferir contagem de duplicatas pós-limpeza = 0.

## Entrega

- Migration no `pamplona-db` (trigger + limpeza), aplicada via MCP + commit.
- Front no `pamplona-vendedor` (`main`): hook + 4 handlers + toasts. Commit;
  push/deploy do usuário.
