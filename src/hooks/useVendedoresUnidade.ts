import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VendedorOption {
  id: string;
  nome: string;
}

export const useVendedoresUnidade = () => {
  const { profile } = useAuth();
  const unidadeId = profile?.unidade_id;

  return useQuery({
    queryKey: ['vendedores-unidade', unidadeId],
    queryFn: async (): Promise<VendedorOption[]> => {
      if (!unidadeId) return [];

      const { data, error } = await supabase
        .rpc('listar_vendedores_unidade', { p_unidade_id: unidadeId });

      if (error) throw error;

      return (data ?? []).map((p: { id: string; nome: string }) => ({
        id: p.id,
        nome: p.nome ?? '',
      }));
    },
    enabled: !!unidadeId,
    staleTime: 5 * 60 * 1000,
  });
};
