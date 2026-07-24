import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type TipoAtividade =
  Database["public"]["Functions"]["tipos_atividade_listar"]["Returns"][number];

/** Lista os tipos de atividade ativos (cadastrados na página Registros do CRM). */
export function useTiposAtividade() {
  return useQuery({
    queryKey: ["tipos-atividade"],
    queryFn: async (): Promise<TipoAtividade[]> => {
      const { data, error } = await supabase.rpc("tipos_atividade_listar");
      if (error) throw error;
      return (data ?? []) as TipoAtividade[];
    },
    staleTime: 10 * 60 * 1000,
  });
}
