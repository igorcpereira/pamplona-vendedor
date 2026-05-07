import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useProvasFicha = (fichaId?: string) => {
  return useQuery({
    queryKey: ['provas-ficha', fichaId],
    queryFn: async () => {
      if (!fichaId) return [];
      const { data, error } = await supabase
        .from('provas')
        .select('id, ficha_id, vendedor_id, unidade_id, created_at')
        .eq('ficha_id', fichaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!fichaId,
    staleTime: 30 * 1000,
  });
};

export const useAdicionarProva = (fichaId?: string) => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!fichaId) throw new Error('ficha_id ausente');
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('provas')
        .insert({
          ficha_id: fichaId,
          vendedor_id: user.id,
          unidade_id: profile?.unidade_id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provas-ficha', fichaId] });
      queryClient.invalidateQueries({ queryKey: ['provas-vendedor-mes'] });
    },
  });
};

export const useDeletarProva = (fichaId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provaId: string) => {
      const { error } = await supabase.from('provas').delete().eq('id', provaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provas-ficha', fichaId] });
      queryClient.invalidateQueries({ queryKey: ['provas-vendedor-mes'] });
    },
  });
};
