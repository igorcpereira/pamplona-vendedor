import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Quem pode receber uma oportunidade desta unidade: vendedor ou gestor, ativo,
 * com vínculo na loja ou na unidade virtual "Todas".
 *
 * Difere do useVendedoresUnidade em dois pontos que importam no funil:
 *   1. a unidade vem do CARD (parâmetro), não do profile de quem está olhando —
 *      o gestor que atribui costuma ser de outra loja;
 *   2. usa a mesma função do banco que valida na gravação
 *      (_funil_vendedor_atribuivel), então a lista nunca oferece nome que a RPC
 *      recusa depois.
 */
export interface VendedorAtribuivel {
  id: string;
  nome: string;
  /** 'unidade' = lotado na loja do card; 'rede' = gestor com vínculo em "Todas". */
  escopo: 'unidade' | 'rede';
}

export const useVendedoresAtribuiveis = (unidadeId: number | null | undefined) => {
  return useQuery({
    queryKey: ['vendedores-atribuiveis', unidadeId],
    enabled: unidadeId != null,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<VendedorAtribuivel[]> => {
      const { data, error } = await supabase
        .rpc('funil_vendedores_atribuiveis', { p_unidade_id: unidadeId! });

      if (error) throw error;

      return (data ?? []) as VendedorAtribuivel[];
    },
  });
};
