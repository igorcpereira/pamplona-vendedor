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
  const { user, activeUnidade } = useAuth();

  return useQuery({
    queryKey: ['vendedores', user?.id, activeUnidade?.unidade.id],
    queryFn: async () => {
      if (!user?.id || !activeUnidade) return [];

      const isGlobal = ['master', 'admin'].includes(activeUnidade.role);

      let vinculosQuery = supabase
        .from('usuario_unidade_role')
        .select('user_id, role, unidade_id, unidades(nome)')
        .in('role', ['vendedor', 'franqueado', 'gestor']);

      if (!isGlobal) {
        vinculosQuery = vinculosQuery.eq('unidade_id', activeUnidade.unidade.id);
      }

      const { data: vinculos, error: vinculosError } = await vinculosQuery;

      if (vinculosError) throw vinculosError;
      if (!vinculos || vinculos.length === 0) return [];

      const userIds = vinculos.map((v: any) => v.user_id);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      return vinculos.map((v: any): Vendedor => ({
        id: v.user_id,
        nome: profileMap.get(v.user_id)?.nome || 'Sem nome',
        email: '',
        unidade_id: v.unidade_id,
        unidade_nome: (v.unidades as any)?.nome || '',
        role: v.role,
      }));
    },
    enabled: !!user?.id && !!activeUnidade,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
