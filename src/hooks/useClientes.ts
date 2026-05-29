import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_SIZE = 20;

export const useClientes = (search?: string, vendedorId?: string) => {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['clientes', user?.id, search ?? '', vendedorId ?? ''],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) return [];

      const termo = search?.trim();
      const { data, error } = await supabase.rpc('buscar_clientes', {
        p_search: termo && termo.length >= 2 ? termo : undefined,
        p_offset: pageParam,
        p_limit: PAGE_SIZE,
        p_vendedor_id: vendedorId || undefined,
      });

      if (error) throw error;
      return data ?? [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
