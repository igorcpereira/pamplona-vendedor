import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TagAtiva {
  id: string;
  nome: string;
  padrao: boolean;
}

/**
 * Todas as tags ativas, uma busca só (≈110 linhas — filtro fica no cliente).
 * As com `padrao = true` viram os botões principais da ficha; as demais são
 * alcançáveis pela busca. Espelho do useTagsAtivas do CRM.
 */
export function useTagsAtivas() {
  return useQuery({
    queryKey: ['tags-ativas'],
    queryFn: async (): Promise<TagAtiva[]> => {
      const { data, error } = await supabase
        .from('tags')
        .select('id, nome, padrao')
        .eq('ativa', true)
        .order('nome');
      if (error) throw error;
      return (data ?? []) as TagAtiva[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
