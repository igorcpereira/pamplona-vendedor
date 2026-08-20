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
  de?: string | null;  // YYYY-MM-DD
  ate?: string | null; // YYYY-MM-DD (inclusivo)
  /**
   * Escopo de UNIDADE em vez de pessoal: envia `p_unidade_id` e omite o
   * `p_responsavel_id` — para cargo global a RPC devolve a unidade inteira.
   * Usado pelo badge do gestor no BottomNav; a agenda continua pessoal.
   */
  unidadeId?: number | null;
}

/**
 * Sem `unidadeId`, sempre com `p_responsavel_id = user.id`: a página é "Minha
 * agenda", e para um cargo global a RPC devolveria a equipe inteira sem esse
 * filtro. Para role vendedor o servidor já força o próprio uid de qualquer
 * jeito. O `status_visivel` vem calculado do servidor (fuso de São Paulo).
 */
export function useAtividades(filtros: ListarFiltros = {}) {
  const { user } = useAuth();
  const unidadeId = filtros.unidadeId ?? null;
  return useQuery({
    queryKey: [ATIVIDADES_KEY, user?.id, filtros.status ?? null, filtros.de ?? null, filtros.ate ?? null, unidadeId],
    queryFn: async () => {
      if (!user?.id) return [] as Atividade[];
      const { data, error } = await supabase.rpc("atividades_listar", {
        p_responsavel_id: unidadeId !== null ? undefined : user.id,
        p_unidade_id: unidadeId ?? undefined,
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

/** Invalida a agenda inteira depois de qualquer mutação. */
function useInvalidarAtividades() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: [ATIVIDADES_KEY] });
    // A timeline do cliente exibe a observação da conclusão na hora.
    void queryClient.invalidateQueries({ queryKey: ["historico-cliente"] });
  };
}

export function useConcluirAtividade() {
  const invalidar = useInvalidarAtividades();
  return useMutation({
    mutationFn: async (
      { id, obs, desfecho, payload }: {
        id: string;
        obs?: string | null;
        desfecho?: string | null;
        /** Campos do formulário do desfecho (vendedor, tipo, datas). */
        payload?: Record<string, string>;
      },
    ) => {
      const { error } = await supabase.rpc("atividades_concluir", {
        p_id: id,
        p_obs: obs ?? undefined,
        // Em atividade de oportunidade o desfecho é obrigatório e é ele que
        // move o funil — quem decide a etapa é a RPC, lendo funil_etapas.
        p_desfecho: desfecho ?? undefined,
        p_payload: (payload ?? {}) as never,
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

// ── Minha carteira (criação em grupo para si) ────────────────────────────────

/** Filtros da carteira — subconjunto de clientes_segmento (unidade e dono são do servidor). */
export interface CarteiraFiltros {
  /** Cliente com QUALQUER uma das tags. */
  tagIds?: string[];
  /** 'venda' | 'aluguel' | 'sob_medida' | 'ajuste' | 'avulso' — pelo menos um. */
  tipos?: string[];
  recenciaCampo?: "venda" | "atendimento" | null;
  recenciaDe?: string | null;  // YYYY-MM-DD
  recenciaAte?: string | null; // YYYY-MM-DD
}

function carteiraParaRpc(f: CarteiraFiltros) {
  return {
    p_tag_ids: f.tagIds && f.tagIds.length > 0 ? f.tagIds : undefined,
    p_tipos: f.tipos && f.tipos.length > 0 ? f.tipos : undefined,
    p_recencia_campo: f.recenciaCampo ?? undefined,
    p_recencia_de: f.recenciaDe ?? undefined,
    p_recencia_ate: f.recenciaAte ?? undefined,
  };
}

/** Prévia: quantos clientes da MINHA carteira caem nos filtros (debounce no chamador). */
export function useCarteiraPrevia(filtros: CarteiraFiltros | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["carteira-previa", user?.id, filtros],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("atividades_carteira_previa", carteiraParaRpc(filtros!));
      if (error) throw error;
      return data as unknown as { total: number };
    },
    enabled: !!user?.id && filtros !== null,
    staleTime: 30 * 1000,
  });
}

interface CriarLoteCarteiraInput {
  tipoId: string;
  data: string; // YYYY-MM-DD
  filtros: CarteiraFiltros;
  descricao?: string | null;
}

/** Cria 1 atividade por cliente da carteira filtrada — todas para o próprio usuário. */
export function useCriarLoteCarteira() {
  const invalidar = useInvalidarAtividades();
  return useMutation({
    mutationFn: async (input: CriarLoteCarteiraInput) => {
      const { data, error } = await supabase.rpc("atividades_criar_lote_carteira", {
        p_tipo_id: input.tipoId,
        p_data: input.data,
        ...carteiraParaRpc(input.filtros),
        p_descricao: input.descricao ?? undefined,
      });
      if (error) throw error;
      return data as unknown as { grupo_id: string; criadas: number };
    },
    onSuccess: invalidar,
  });
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
