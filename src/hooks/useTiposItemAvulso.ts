import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TipoItemAvulso {
  id: string;
  slug: string;
  nome: string;
  ativo: boolean;
  ordem: number;
}

/**
 * Tipos de item de pedido avulso ativos, ordenados por `ordem, nome`.
 * O `slug` é o valor gravado em itens_avulsos_ficha.tipo_item; `nome` é o label.
 */
export const useTiposItemAvulso = () => {
  return useQuery({
    queryKey: ['tipos-item-avulso'],
    queryFn: async (): Promise<TipoItemAvulso[]> => {
      const { data, error } = await supabase
        .from('tipos_item_avulso')
        .select('id, slug, nome, ativo, ordem')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .order('nome', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((t) => ({
        id: t.id,
        slug: t.slug,
        nome: t.nome,
        ativo: t.ativo,
        ordem: t.ordem,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
};
