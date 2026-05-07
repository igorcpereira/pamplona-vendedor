import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useVendasAvulsasFicha = (fichaId?: string) => {
  return useQuery({
    queryKey: ['vendas-avulsas-ficha', fichaId],
    queryFn: async () => {
      if (!fichaId) return [];
      const { data, error } = await supabase
        .from('vendas_avulsas')
        .select('id, ficha_id, vendedor_id, unidade_id, descricao, valor, pago, created_at')
        .eq('ficha_id', fichaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!fichaId,
    staleTime: 30 * 1000,
  });
};

interface NovaVendaAvulsa {
  descricao: string;
  valor: number | null;
  pago: boolean;
}

export const useAdicionarVendaAvulsa = (fichaId?: string) => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (venda: NovaVendaAvulsa) => {
      if (!fichaId) throw new Error('ficha_id ausente');
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('vendas_avulsas')
        .insert({
          ficha_id: fichaId,
          vendedor_id: user.id,
          unidade_id: profile?.unidade_id ?? null,
          descricao: venda.descricao || null,
          valor: venda.valor,
          pago: venda.pago,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas-avulsas-ficha', fichaId] });
      queryClient.invalidateQueries({ queryKey: ['vendas-avulsas-vendedor-mes'] });
    },
  });
};

export const useDeletarVendaAvulsa = (fichaId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendaId: string) => {
      const { error } = await supabase.from('vendas_avulsas').delete().eq('id', vendaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas-avulsas-ficha', fichaId] });
      queryClient.invalidateQueries({ queryKey: ['vendas-avulsas-vendedor-mes'] });
    },
  });
};
