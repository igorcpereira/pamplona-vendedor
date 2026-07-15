import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { FiltrosFichas } from '@/hooks/useFiltrosFichas';

const PAGE_SIZE = 15;

export interface PedidoAvulso {
  id: string;
  ficha_id: string;
  codigo_ficha: string;
  nome_cliente: string;
  vendedor_id: string;
  vendedor_nome: string;
  valor_total: number;
  pago: boolean;
  created_at: string;
}

export const usePedidosAvulsos = (
  search: string | undefined,
  filtros: FiltrosFichas,
  enabled: boolean = true
) => {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['pedidos-avulsos', user?.id, search ?? '', filtros],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) return [] as PedidoAvulso[];

      const { data, error } = await supabase.rpc('listar_pedidos_avulsos', {
        p_offset: pageParam,
        p_limit: PAGE_SIZE,
        p_search: search && search.length > 0 ? search : undefined,
        p_minhas: filtros.minhas,
        p_data_inicio: filtros.dataInicio ?? undefined,
        p_data_fim: filtros.dataFim ?? undefined,
        p_unidade_id: filtros.unidadeId ?? undefined,
      });

      if (error) throw error;
      return (data ?? []) as PedidoAvulso[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    enabled: enabled && !!user?.id,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
};
