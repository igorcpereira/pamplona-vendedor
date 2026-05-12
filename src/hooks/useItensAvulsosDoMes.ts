import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useItensAvulsosDoMes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pedidos-mes', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;

      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
      const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1).toISOString();

      const { data, error } = await supabase
        .from('pedidos')
        .select('valor_total')
        .eq('vendedor_id', user.id)
        .gte('created_at', inicioMes)
        .lt('created_at', fimMes);

      if (error) throw error;

      return (data ?? []).reduce((acc, p) => acc + Number(p.valor_total ?? 0), 0);
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });
};
