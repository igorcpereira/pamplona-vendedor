import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

// Linha retornada por atividades_listar (modelo v1, o mesmo do kanban do CRM).
export type Atividade =
  Database["public"]["Functions"]["atividades_listar"]["Returns"][number];

export interface TipoAtividadeAtivo {
  id: string;
  slug: string;
  nome: string;
  exige_cliente: boolean;
}

const ATIVIDADES_KEY = "atividades";

/** Tipos ativos, para o seletor da criação. */
export function useTiposAtividadeAtivos() {
  return useQuery({
    queryKey: ["tipos-atividade-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("tipos_atividade_listar");
      if (error) throw error;
      return (data ?? []) as TipoAtividadeAtivo[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

interface ListarFiltros {
  status?: string | null;
  de?: string | null; // YYYY-MM-DD
}

/**
 * Sempre com `p_responsavel_id = user.id`: a página é "Minha agenda", e para um
 * cargo global (a rota hoje é só master) a RPC devolveria a equipe inteira sem
 * esse filtro. Para role vendedor o servidor já força o próprio uid de qualquer
 * jeito. O `status_visivel` vem calculado do servidor (fuso de São Paulo).
 */
export function useAtividades(filtros: ListarFiltros = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [ATIVIDADES_KEY, user?.id, filtros.status ?? null, filtros.de ?? null],
    queryFn: async () => {
      if (!user?.id) return [] as Atividade[];
      const { data, error } = await supabase.rpc("atividades_listar", {
        p_responsavel_id: user.id,
        p_status: filtros.status ?? undefined,
        p_de: filtros.de ?? undefined,
      });
      if (error) throw error;
      return (data ?? []) as Atividade[];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}

/** Invalida a agenda inteira depois de qualquer mutação. */
function useInvalidarAtividades() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [ATIVIDADES_KEY] });
}

export function useConcluirAtividade() {
  const invalidar = useInvalidarAtividades();
  return useMutation({
    mutationFn: async ({ id, obs }: { id: string; obs?: string | null }) => {
      const { error } = await supabase.rpc("atividades_concluir", {
        p_id: id,
        p_obs: obs ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: invalidar,
  });
}

/** Reagenda para uma nova data (re-abre a atividade se estava encerrada). */
export function useAdiarAtividade() {
  const invalidar = useInvalidarAtividades();
  return useMutation({
    mutationFn: async ({ id, novaData, obs }: { id: string; novaData: string; obs?: string | null }) => {
      const { error } = await supabase.rpc("atividades_adiar", {
        p_id: id,
        p_nova_data: novaData,
        p_obs: obs ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: invalidar,
  });
}

interface CriarAtividadeInput {
  tipoId: string;
  data: string; // YYYY-MM-DD
  clienteId?: string | null;
  descricao?: string | null;
  /** Data do evento do cliente (festa/casamento), distinta da data da atividade. */
  dataEvento?: string | null; // YYYY-MM-DD
}

/**
 * Cria uma atividade para o próprio usuário. `p_responsaveis` e `p_unidade_id`
 * ficam de fora de propósito: o servidor força o criador como responsável e a
 * unidade sai de `profiles.unidade_id` (que o selectUnidade do AuthContext
 * mantém em dia). O retorno é o grupo_id, não o id da atividade.
 */
export function useCriarAtividade() {
  const invalidar = useInvalidarAtividades();
  return useMutation({
    mutationFn: async (input: CriarAtividadeInput) => {
      const { data, error } = await supabase.rpc("atividades_criar", {
        p_tipo_id: input.tipoId,
        p_data: input.data,
        p_cliente_id: input.clienteId ?? undefined,
        p_descricao: input.descricao ?? undefined,
        p_data_evento: input.dataEvento ?? undefined,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: invalidar,
  });
}
