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
