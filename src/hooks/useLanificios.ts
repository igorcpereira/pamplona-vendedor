import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type TipoLanificio = 'padrao' | 'sob_medida';

export interface Lanificio {
  id: string;
  nome: string;
  tipo: TipoLanificio;
  ativo: boolean;
  ordem: number;
}

/**
 * Lanifícios ativos, ordenados por `ordem, nome`.
 * Usado no dropdown de lanifício da venda (filtrado por tipo padrao/sob_medida no consumidor).
 */
export const useLanificios = () => {
  return useQuery({
    queryKey: ['lanificios'],
    queryFn: async (): Promise<Lanificio[]> => {
      const { data, error } = await supabase
        .from('lanificios')
        .select('id, nome, tipo, ativo, ordem')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .order('nome', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((l) => ({
        id: l.id,
        nome: l.nome,
        tipo: l.tipo as TipoLanificio,
        ativo: l.ativo,
        ordem: l.ordem,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
};
