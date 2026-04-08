import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_SIZE = 20;

export const useClientes = (search?: string) => {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['clientes', user?.id, search ?? ''],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) return [];

      let query = supabase
        .from('clientes')
        .select(`*, fichas (codigo_ficha)`)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (search && search.trim().length >= 2) {
        const termo = search.trim();
        query = query.or(`nome.ilike.%${termo}%,telefone.ilike.%${termo}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
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
