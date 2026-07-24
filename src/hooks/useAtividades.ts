import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

// Linha enriquecida retornada por atividades_listar (RPC SECURITY DEFINER).
export type Atividade =
  Database["public"]["Functions"]["atividades_listar"]["Returns"][number];

const KEY = "atividades";

export interface AtividadeFiltros {
  status?: string | null; // 'a_fazer' | 'concluida' | 'cancelada' | 'atrasada'
  de?: string | null; // YYYY-MM-DD
  ate?: string | null;
  responsavelId?: string | null;
  clienteId?: string | null;
}

export function useAtividades(f: AtividadeFiltros = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [KEY, user?.id, f.status ?? null, f.de ?? null, f.ate ?? null, f.responsavelId ?? null, f.clienteId ?? null],
    queryFn: async (): Promise<Atividade[]> => {
      const { data, error } = await supabase.rpc("atividades_listar", {
        p_status: f.status ?? undefined,
        p_de: f.de ?? undefined,
        p_ate: f.ate ?? undefined,
        p_responsavel_id: f.responsavelId ?? undefined,
        p_cliente_id: f.clienteId ?? undefined,
      });
      if (error) throw error;
      return (data ?? []) as Atividade[];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}

export interface CriarAtividadeInput {
  tipoId: string;
  data: string; // YYYY-MM-DD
  responsaveis?: string[] | null; // ignorado pelo servidor p/ cargos não-globais
  clienteId?: string | null;
  descricao?: string | null;
  fichaId?: string | null;
  pedidoId?: string | null;
  unidadeId?: number | null;
}

export function useCriarAtividade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (i: CriarAtividadeInput) => {
      const { data, error } = await supabase.rpc("atividades_criar", {
        p_tipo_id: i.tipoId,
        p_data: i.data,
        p_responsaveis: i.responsaveis ?? undefined,
        p_cliente_id: i.clienteId ?? undefined,
        p_descricao: i.descricao ?? undefined,
        p_ficha_id: i.fichaId ?? undefined,
        p_pedido_id: i.pedidoId ?? undefined,
        p_unidade_id: i.unidadeId ?? undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useConcluirAtividade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, obs }: { id: string; obs?: string | null }) => {
      const { error } = await supabase.rpc("atividades_concluir", { p_id: id, p_obs: obs ?? undefined });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useAdiarAtividade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, novaData, obs }: { id: string; novaData: string; obs?: string | null }) => {
      const { error } = await supabase.rpc("atividades_adiar", {
        p_id: id,
        p_nova_data: novaData,
        p_obs: obs ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useCancelarAtividade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo?: string | null }) => {
      const { error } = await supabase.rpc("atividades_cancelar", { p_id: id, p_motivo: motivo ?? undefined });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useReatribuirAtividade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, responsavelId }: { id: string; responsavelId: string }) => {
      const { error } = await supabase.rpc("atividades_reatribuir", { p_id: id, p_responsavel_id: responsavelId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
