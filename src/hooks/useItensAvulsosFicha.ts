import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type TipoItemAvulso = 'camiseta' | 'gravata' | 'sapato' | 'meia' | 'cinto';

export const TIPOS_ITEM_AVULSO: TipoItemAvulso[] = [
  'camiseta',
  'gravata',
  'sapato',
  'meia',
  'cinto',
];

export interface ItemAvulso {
  tipo_item: TipoItemAvulso;
  quantidade: number;
  valor_unitario: number | null;
}

const itemZerado = (tipo: TipoItemAvulso): ItemAvulso => ({
  tipo_item: tipo,
  quantidade: 0,
  valor_unitario: null,
});

export const useItensAvulsosFicha = (fichaId?: string, vendedorId?: string) => {
  const { user, profile } = useAuth();
  const resolvedVendedorId = vendedorId ?? user?.id;

  return useQuery({
    queryKey: ['itens-avulsos-ficha', fichaId, resolvedVendedorId],
    queryFn: async (): Promise<ItemAvulso[]> => {
      if (!fichaId || !resolvedVendedorId) return TIPOS_ITEM_AVULSO.map(itemZerado);

      const { data, error } = await supabase
        .from('itens_avulsos_ficha')
        .select('tipo_item, quantidade, valor_unitario')
        .eq('ficha_id', fichaId)
        .eq('vendedor_id', resolvedVendedorId);

      if (error) throw error;

      const mapa = new Map((data ?? []).map((r) => [r.tipo_item, r]));

      return TIPOS_ITEM_AVULSO.map((tipo) => {
        const salvo = mapa.get(tipo);
        return salvo
          ? { tipo_item: tipo, quantidade: salvo.quantidade, valor_unitario: salvo.valor_unitario }
          : itemZerado(tipo);
      });
    },
    enabled: !!fichaId && !!resolvedVendedorId,
    staleTime: 30 * 1000,
  });
};

export const useSalvarItensAvulsos = (fichaId?: string, vendedorId?: string) => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const resolvedVendedorId = vendedorId ?? user?.id;

  return useMutation({
    mutationFn: async (itens: ItemAvulso[]) => {
      if (!fichaId) throw new Error('ficha_id ausente');
      if (!resolvedVendedorId) throw new Error('vendedor_id ausente');
      if (!profile?.unidade_id) throw new Error('unidade_id ausente');

      const rows = itens.map((item) => ({
        ficha_id: fichaId,
        vendedor_id: resolvedVendedorId,
        unidade_id: profile.unidade_id,
        tipo_item: item.tipo_item,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
      }));

      const { error } = await supabase
        .from('itens_avulsos_ficha')
        .upsert(rows, { onConflict: 'ficha_id,tipo_item,vendedor_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens-avulsos-ficha', fichaId] });
      queryClient.invalidateQueries({ queryKey: ['itens-avulsos-mes'] });
    },
  });
};
