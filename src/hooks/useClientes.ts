import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Cliente } from "@/types/database";

export function useClientes(search?: string) {
  const { activeUnidade } = useAuth();

  return useQuery<Cliente[]>({
    queryKey: ["clientes", activeUnidade?.unidade.id, search],
    queryFn: async () => {
      let q = supabase
        .from("clientes")
        .select("*")
        .order("nome", { ascending: true });

      if (activeUnidade) {
        q = q.eq("unidade_id", activeUnidade.unidade.id);
      }

      if (search && search.length >= 2) {
        q = q.ilike("nome", `%${search}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeUnidade,
  });
}

export function useCliente(id: string | undefined) {
  return useQuery<Cliente | null>({
    queryKey: ["cliente", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
