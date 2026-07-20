import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CampoOpcao = 'paleto_cor' | 'camisa_fios' | 'camisa_cor' | 'sapato_tipo';

export interface OpcaoFicha {
  id: string;
  campo: CampoOpcao;
  valor: string;
  ativo: boolean;
  ordem: number;
}

export type OpcoesPorCampo = Record<CampoOpcao, string[]>;

/**
 * Opções de ficha ativas (cores de paletó, fios, cores de camisa, tipos de sapato),
 * agrupadas por campo e ordenadas por `ordem, valor`. Retorna os valores (texto)
 * de cada campo — as fichas continuam gravando o texto.
 */
export const useOpcoesFicha = () => {
  return useQuery({
    queryKey: ['opcoes-ficha'],
    queryFn: async (): Promise<OpcoesPorCampo> => {
      const { data, error } = await supabase
        .from('opcoes_ficha')
        .select('id, campo, valor, ativo, ordem')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .order('valor', { ascending: true });

      if (error) throw error;

      const grupos: OpcoesPorCampo = {
        paleto_cor: [],
        camisa_fios: [],
        camisa_cor: [],
        sapato_tipo: [],
      };

      for (const opcao of data ?? []) {
        const campo = opcao.campo as CampoOpcao;
        if (campo in grupos) {
          grupos[campo].push(opcao.valor);
        }
      }

      return grupos;
    },
    staleTime: 5 * 60 * 1000,
  });
};
