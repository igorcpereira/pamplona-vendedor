import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useItensAvulsosDoMes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['itens-avulsos-mes', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;

      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
      const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1).toISOString();

      const { data, error } = await supabase
        .from('itens_avulsos_ficha')
        .select('quantidade, valor_unitario')
        .eq('vendedor_id', user.id)
        .gte('created_at', inicioMes)
        .lt('created_at', fimMes);

      if (error) throw error;

      return (data ?? []).reduce(
        (acc, item) => acc + item.quantidade * (item.valor_unitario ?? 0),
        0,
      );
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });
};
