import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Ficha } from "@/types/database";

export function useFichas() {
  const { activeUnidade } = useAuth();

  return useQuery<Ficha[]>({
    queryKey: ["fichas", activeUnidade?.unidade.id],
    queryFn: async () => {
      let q = supabase
        .from("fichas")
        .select("*")
        .order("created_at", { ascending: false });

      if (activeUnidade) {
        q = q.eq("unidade_id", activeUnidade.unidade.id);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeUnidade,
  });
}

export function useFicha(id: string | undefined) {
  return useQuery<Ficha | null>({
    queryKey: ["ficha", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("fichas")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
