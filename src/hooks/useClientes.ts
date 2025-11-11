import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useClientes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['clientes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('vendedor_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    refetchOnMount: 'always', // Sempre busca novos dados ao montar o componente
    refetchOnWindowFocus: true, // Busca ao focar na janela
  });
};
