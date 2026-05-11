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
        .from('profiles')
        .select('id, nome, usuario_unidade_role!inner(role, unidade_id)')
        .eq('ativo', true)
        .eq('usuario_unidade_role.unidade_id', unidadeId)
        .neq('usuario_unidade_role.role', 'master')
        .order('nome');

      if (error) throw error;

      return (data ?? []).map((p) => ({
        id: p.id,
        nome: p.nome ?? '',
      }));
    },
    enabled: !!unidadeId,
    staleTime: 5 * 60 * 1000,
  });
};
