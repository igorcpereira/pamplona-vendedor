import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ResumoUnidade {
  unidade_id: number;
  unidade_nome: string;
  total_fichas: number;
  total_provas: number;
  total_valor: number;
  aluguel_qtd: number;
  aluguel_valor: number;
  venda_qtd: number;
  venda_valor: number;
  sob_medida_qtd: number;
  sob_medida_valor: number;
  ajuste_qtd: number;
  ajuste_valor: number;
  avulsa_qtd: number;
  avulsa_valor: number;
}

/**
 * Totais por unidade no período (RPC get_dashboard_por_unidade — uma linha
 * por unidade com dados; regras de acesso e is_teste aplicadas no banco).
 * Datas em 'YYYY-MM-DD'; fim exclusivo.
 */
export const useResumoUnidades = (dataInicio: string, dataFim: string) =>
  useQuery({
    queryKey: ['resumo-unidades', dataInicio, dataFim],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_por_unidade', {
        _data_inicio: dataInicio,
        _data_fim: dataFim,
      });
      if (error) throw error;
      return (data ?? []) as ResumoUnidade[];
    },
    staleTime: 60 * 1000,
  });

export interface UnidadeSimples {
  id: number;
  nome: string;
}

/** Unidades reais (exclui a virtual "Todas", id 3) para o seletor do Resumo. */
export const useUnidadesReais = (enabled: boolean) =>
  useQuery({
    queryKey: ['unidades-reais'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unidades')
        .select('id, nome')
        .neq('id', 3)
        .order('nome');
      if (error) throw error;
      return (data ?? []) as UnidadeSimples[];
    },
    staleTime: 5 * 60 * 1000,
  });
