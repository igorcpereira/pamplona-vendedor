import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ResumoAvulsos {
  valor: number;
  qtd: number;
}

/**
 * Vendas avulsas do vendedor logado no período (timestamps ISO; fim exclusivo).
 * Fonte: `pedidos` (cabeçalho dos itens avulsos) — o valor real vive em
 * `valor_total`; cada pedido conta como 1 venda avulsa.
 */
export const useItensAvulsos = (inicioISO: string, fimISO: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pedidos-avulsos-resumo', user?.id, inicioISO, fimISO],
    queryFn: async (): Promise<ResumoAvulsos> => {
      if (!user?.id) return { valor: 0, qtd: 0 };

      const { data, error } = await supabase
        .from('pedidos')
        .select('valor_total')
        .eq('vendedor_id', user.id)
        .gte('created_at', inicioISO)
        .lt('created_at', fimISO);

      if (error) throw error;

      const rows = data ?? [];
      return {
        valor: rows.reduce((acc, p) => acc + Number(p.valor_total ?? 0), 0),
        qtd: rows.length,
      };
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });
};
