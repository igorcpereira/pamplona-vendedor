import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Vendedor {
  id: string;
  nome: string;
  email: string;
  unidade_id: number;
  unidade_nome: string;
  role: string;
}

export const useVendedores = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['vendedores', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Buscar informações do usuário atual
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('unidade_id')
        .eq('id', user.id)
        .single();

      const { data: currentUserRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const userRole = currentUserRole?.role;
      const userUnidade = currentUserProfile?.unidade_id;

      // Buscar ID da unidade "Todas"
      const { data: todasUnidade } = await supabase
        .from('unidades')
        .select('id')
        .eq('nome', 'Todas')
        .single();

      let query = supabase
        .from('profiles')
        .select(`
          id,
          nome,
          unidade_id,
          unidades(nome),
          user_roles(role)
        `);

      // Se não for gestor, master ou admin, filtrar por unidade
      const isGestorOrAdmin = ['gestor', 'master', 'admin'].includes(userRole as string);
      const hasTodasUnidade = userUnidade === todasUnidade?.id;
      
      if (!isGestorOrAdmin && !hasTodasUnidade) {
        query = query.eq('unidade_id', userUnidade);
      }

      const { data: profiles, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar vendedores:', error);
        throw error;
      }

      // Mapear e filtrar apenas vendedores e franqueados
      const vendedores: Vendedor[] = (profiles || [])
        .filter((p: any) => {
          const role = p.user_roles?.[0]?.role;
          return role === 'vendedor' || role === 'franqueado';
        })
        .map((p: any) => ({
          id: p.id,
          nome: p.nome || 'Sem nome',
          email: '',
          unidade_id: p.unidade_id,
          unidade_nome: p.unidades?.nome || '',
          role: p.user_roles?.[0]?.role || 'vendedor',
        }));

      return vendedores;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
};
