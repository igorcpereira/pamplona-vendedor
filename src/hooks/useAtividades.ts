import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

export type AtividadeStatus = "pendente" | "feita" | "adiada" | "cancelada";

// Linha retornada por atividades_listar (RPC SECURITY DEFINER sobre dev.atividades)
export type Atividade =
  Database["public"]["Functions"]["atividades_listar"]["Returns"][number];

interface ListarFiltros {
  status?: AtividadeStatus | null;
  de?: string | null; // YYYY-MM-DD
  ate?: string | null; // YYYY-MM-DD
}

const ATIVIDADES_KEY = "atividades";

/**
 * Lista apenas as atividades do vendedor logado (responsavel_id = self).
 * O servidor já restringe cargos não-globais à própria unidade.
 */
export function useAtividades(filtros: ListarFiltros = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [ATIVIDADES_KEY, user?.id, filtros.status ?? null, filtros.de ?? null, filtros.ate ?? null],
    queryFn: async () => {
      if (!user?.id) return [] as Atividade[];
      const { data, error } = await supabase.rpc("atividades_listar", {
        p_responsavel_id: user.id,
        p_status: filtros.status ?? undefined,
        p_de: filtros.de ?? undefined,
        p_ate: filtros.ate ?? undefined,
      });
      if (error) throw error;
      return (data ?? []) as Atividade[];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}

export function useAtualizarStatusAtividade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AtividadeStatus }) => {
      const { error } = await supabase.rpc("atividades_atualizar_status", {
        p_id: id,
        p_status: status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ATIVIDADES_KEY] });
    },
  });
}

interface CriarAtividadeInput {
  titulo: string;
  data: string; // YYYY-MM-DD
  descricao?: string | null;
  cliente_id?: string | null;
  nome_contato?: string | null;
  telefone_contato?: string | null;
}

/**
 * Cria uma atividade manual atribuída ao próprio vendedor logado.
 */
export function useCriarAtividade() {
  const queryClient = useQueryClient();
  const { user, activeUnidade } = useAuth();
  return useMutation({
    mutationFn: async (input: CriarAtividadeInput) => {
      if (!user?.id) throw new Error("Usuário não autenticado.");
      const { data, error } = await supabase.rpc("atividades_criar", {
        p_titulo: input.titulo,
        p_data: input.data,
        p_responsaveis: [user.id],
        p_descricao: input.descricao ?? undefined,
        p_cliente_id: input.cliente_id ?? undefined,
        p_nome_contato: input.nome_contato ?? undefined,
        p_telefone_contato: input.telefone_contato ?? undefined,
        p_unidade_id: activeUnidade?.unidade.id ?? undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ATIVIDADES_KEY] });
    },
  });
}
