import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type EventoHistorico =
  Database["public"]["Functions"]["atividade_historico_cliente"]["Returns"][number];

/** Linha do tempo (cronológica) de atividades + eventos de um cliente. */
export function useHistoricoCliente(clienteId?: string | null) {
  return useQuery({
    queryKey: ["historico-cliente", clienteId],
    queryFn: async (): Promise<EventoHistorico[]> => {
      if (!clienteId) return [];
      const { data, error } = await supabase.rpc("atividade_historico_cliente", { p_cliente_id: clienteId });
      if (error) throw error;
      return (data ?? []) as EventoHistorico[];
    },
    enabled: !!clienteId,
    staleTime: 30 * 1000,
  });
}
