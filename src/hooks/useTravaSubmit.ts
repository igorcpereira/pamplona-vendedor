import { useCallback, useRef } from 'react';

/**
 * Trava síncrona contra duplo clique em submits.
 *
 * `disabled={isPending}` sozinho não basta: o estado só desabilita o botão
 * no próximo re-render, e dois cliques rápidos passam antes disso. O useRef
 * é síncrono — o segundo clique é ignorado imediatamente.
 *
 * Uso: const travar = useTravaSubmit();
 *      const handleSalvar = () => travar(async () => { ...submit... });
 */
export function useTravaSubmit() {
  const executando = useRef(false);
  return useCallback(async (fn: () => Promise<void>) => {
    if (executando.current) return;
    executando.current = true;
    try {
      await fn();
    } finally {
      executando.current = false;
    }
  }, []);
}
