import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useFichas = (limit?: number) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['fichas', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('fichas')
        .select('*')
        .eq('vendedor_id', user.id)
        // Denylist, e não allowlist, porque a lista do vendedor mostra tudo que
        // ele lançou: ativa, pendente e erro. O preço é que status novo entra
        // aqui sozinho, e foi por isso que 'inativa' precisou ser listada. A
        // ficha inativa é a de código duplicado, que existe só para preservar o
        // vínculo com a oportunidade e não deve aparecer para ninguém (IGO-182).
        .not('status', 'in', '(avulso,inativa)')
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.range(0, limit - 1);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
};

export const useInvalidateFichas = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['fichas', user?.id] });
  };
};
