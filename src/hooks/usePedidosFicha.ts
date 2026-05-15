import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TIPOS_ITEM_AVULSO, type TipoItemAvulso } from './useItensAvulsosFicha';

export interface ItemPedido {
  tipo_item: TipoItemAvulso;
  quantidade: number;
  valor_unitario: number | null;
}

export interface Pedido {
  id: string;
  ficha_id: string;
  vendedor_id: string;
  vendedor_nome: string;
  pago: boolean;
  garantia: number | null;
  valor_total: number;
  created_at: string;
  itens: ItemPedido[];
}

export interface NovoPedido {
  vendedor_id?: string;
  pago: boolean;
  garantia: number | null;
  valor_total: number;
  itens: ItemPedido[];
}

export const usePedidosFicha = (fichaId?: string) => {
  return useQuery({
    queryKey: ['pedidos-ficha', fichaId],
    queryFn: async (): Promise<Pedido[]> => {
      if (!fichaId) return [];

      const { data: pedidosData, error: pedidosError } = await supabase
        .from('pedidos')
        .select('id, ficha_id, vendedor_id, pago, garantia, valor_total, created_at')
        .eq('ficha_id', fichaId)
        .order('created_at', { ascending: false });

      if (pedidosError) throw pedidosError;
      if (!pedidosData || pedidosData.length === 0) return [];

      const pedidoIds = pedidosData.map((p) => p.id);
      const vendedorIds = [...new Set(pedidosData.map((p) => p.vendedor_id))];

      const [itensRes, profilesRes] = await Promise.all([
        supabase
          .from('itens_avulsos_ficha')
          .select('pedido_id, tipo_item, quantidade, valor_unitario')
          .in('pedido_id', pedidoIds),
        supabase
          .from('profiles')
          .select('id, nome')
          .in('id', vendedorIds),
      ]);

      if (itensRes.error) throw itensRes.error;

      const nomeMap = new Map<string, string>();
      for (const p of (profilesRes.data ?? [])) {
        nomeMap.set(p.id, p.nome ?? '');
      }

      const itensMap = new Map<string, ItemPedido[]>();
      for (const item of (itensRes.data ?? [])) {
        const arr = itensMap.get(item.pedido_id) ?? [];
        arr.push({
          tipo_item: item.tipo_item as TipoItemAvulso,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
        });
        itensMap.set(item.pedido_id, arr);
      }

      return pedidosData.map((p) => ({
        id: p.id,
        ficha_id: p.ficha_id,
        vendedor_id: p.vendedor_id,
        vendedor_nome: nomeMap.get(p.vendedor_id) ?? '',
        pago: p.pago,
        garantia: p.garantia,
        valor_total: p.valor_total,
        created_at: p.created_at,
        itens: itensMap.get(p.id) ?? [],
      }));
    },
    enabled: !!fichaId,
    staleTime: 30 * 1000,
  });
};

export const useCriarPedido = (fichaId?: string) => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (novoPedido: NovoPedido) => {
      if (!fichaId) throw new Error('ficha_id ausente');
      if (!profile?.unidade_id) throw new Error('unidade_id ausente');
      const vendedorId = novoPedido.vendedor_id ?? user?.id;
      if (!vendedorId) throw new Error('vendedor_id ausente');

      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          ficha_id: fichaId,
          vendedor_id: vendedorId,
          unidade_id: profile.unidade_id,
          pago: novoPedido.pago,
          garantia: novoPedido.garantia,
          valor_total: 0,
        })
        .select('id')
        .single();

      if (pedidoError) throw pedidoError;

      const itensComQtd = novoPedido.itens.filter((i) => i.quantidade > 0);
      if (itensComQtd.length > 0) {
        const rows = itensComQtd.map((item) => ({
          pedido_id: pedido.id,
          tipo_item: item.tipo_item,
          quantidade: item.quantidade,
          valor_unitario: null,
        }));

        const { error: itensError } = await supabase
          .from('itens_avulsos_ficha')
          .insert(rows);

        if (itensError) throw itensError;
      }

      // Atualiza valor_total após os itens para sobrescrever o trigger de sync
      await supabase
        .from('pedidos')
        .update({ valor_total: novoPedido.valor_total })
        .eq('id', pedido.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-ficha', fichaId] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-mes'] });
    },
  });
};

export const useAtualizarPedido = (fichaId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pedidoId,
      pago,
      garantia,
      valor_total,
      itens,
    }: {
      pedidoId: string;
      pago: boolean;
      garantia: number | null;
      valor_total: number;
      itens: ItemPedido[];
    }) => {
      const { error: pedidoError } = await supabase
        .from('pedidos')
        .update({ pago, garantia })
        .eq('id', pedidoId);

      if (pedidoError) throw pedidoError;

      const itensComQtd = itens.filter((i) => i.quantidade > 0);
      const itensSemQtd = itens.filter((i) => i.quantidade === 0);

      if (itensComQtd.length > 0) {
        const rows = itensComQtd.map((item) => ({
          pedido_id: pedidoId,
          tipo_item: item.tipo_item,
          quantidade: item.quantidade,
          valor_unitario: null,
        }));

        const { error } = await supabase
          .from('itens_avulsos_ficha')
          .upsert(rows, { onConflict: 'pedido_id,tipo_item' });

        if (error) throw error;
      }

      if (itensSemQtd.length > 0) {
        const tipos = itensSemQtd.map((i) => i.tipo_item);
        await supabase
          .from('itens_avulsos_ficha')
          .delete()
          .eq('pedido_id', pedidoId)
          .in('tipo_item', tipos);
      }

      // Atualiza valor_total após os itens para sobrescrever o trigger de sync
      await supabase
        .from('pedidos')
        .update({ valor_total })
        .eq('id', pedidoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-ficha', fichaId] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-mes'] });
    },
  });
};

export const useDeletarItemPedido = (fichaId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pedidoId,
      tipoItem,
    }: {
      pedidoId: string;
      tipoItem: TipoItemAvulso;
    }) => {
      const { error } = await supabase
        .from('itens_avulsos_ficha')
        .delete()
        .eq('pedido_id', pedidoId)
        .eq('tipo_item', tipoItem);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-ficha', fichaId] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-mes'] });
    },
  });
};

export const usePedidosDoMes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pedidos-mes', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;

      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
      const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1).toISOString();

      const { data, error } = await supabase
        .from('pedidos')
        .select('valor_total')
        .eq('vendedor_id', user.id)
        .gte('created_at', inicioMes)
        .lt('created_at', fimMes);

      if (error) throw error;

      return (data ?? []).reduce((acc, p) => acc + Number(p.valor_total ?? 0), 0);
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });
};

export { TIPOS_ITEM_AVULSO };
