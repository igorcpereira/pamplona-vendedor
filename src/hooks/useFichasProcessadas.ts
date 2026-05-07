import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_SIZE = 15;

export const useFichasProcessadas = (search?: string, enabled: boolean = true) => {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['fichas-processadas', user?.id, search ?? ''],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) return [];

      const { data, error } = await supabase.rpc('listar_fichas_processadas', {
        p_offset: pageParam,
        p_limit: PAGE_SIZE,
        p_search: search && search.length > 0 ? search : undefined,
      });

      if (error) throw error;
      return data ?? [];
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
