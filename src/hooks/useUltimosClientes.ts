import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ClienteRecente {
  id: string;
  nome: string;
}

/**
 * Últimos clientes para quem o vendedor logado lançou algo. A fonte é `fichas`:
 * `vendedor_id` é a autoria e a venda avulsa vira ficha-fantasma `status='avulso'`,
 * então uma consulta só cobre ficha E venda avulsa (mesmo padrão de leitura direta
 * de useFichas). Fichas ainda sem `cliente_id` (pendentes de processamento, avulsas
 * sem telefone) ficam de fora — o atalho precisa da FK real.
 *
 * Busca 50 linhas e deduplica por cliente aqui: DISTINCT por coluna não existe no
 * PostgREST, e 50 fichas cobrem folgadamente 10 clientes distintos.
 */
export function useUltimosClientes(limite = 10) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ultimos-clientes-lancados", user?.id, limite],
    queryFn: async (): Promise<ClienteRecente[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("fichas")
        .select("cliente_id, nome_cliente, created_at")
        .eq("vendedor_id", user.id)
        .not("cliente_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      const vistos = new Set<string>();
      const recentes: ClienteRecente[] = [];
      for (const f of data ?? []) {
        if (!f.cliente_id || vistos.has(f.cliente_id)) continue;
        vistos.add(f.cliente_id);
        recentes.push({ id: f.cliente_id, nome: f.nome_cliente ?? "Sem nome" });
        if (recentes.length >= limite) break;
      }
      return recentes;
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });
}
