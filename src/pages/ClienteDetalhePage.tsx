import { useParams, useNavigate } from "react-router-dom";
import { useCliente } from "@/hooks/useClientes";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import type { Ficha, FichaStatus, FichaTipo } from "@/types/database";
import { Loader2, Phone, ArrowLeft, Tag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<FichaStatus, string> = {
  pendente: "bg-warning/20 text-warning",
  ativa: "bg-success/20 text-success",
  baixa: "bg-muted text-muted-foreground",
  erro: "bg-destructive/20 text-destructive",
};

const TIPO_LABELS: Record<FichaTipo, string> = {
  aluguel: "Aluguel",
  venda: "Venda",
  ajuste: "Ajuste",
};

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 13) {
    return `(${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return raw;
}

export default function ClienteDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: cliente, isLoading: loadingCliente } = useCliente(id);

  const { data: fichas = [], isLoading: loadingFichas } = useQuery<Ficha[]>({
    queryKey: ["fichas-cliente", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("fichas")
        .select("*")
        .eq("cliente_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  const ltv = fichas.reduce((sum, f) => sum + (f.valor ?? 0), 0);

  if (loadingCliente || !cliente) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="Cliente" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Cliente" />

      <main className="flex-1 px-4 py-6 pb-24 max-w-md mx-auto w-full">
        {/* Header do cliente */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="bg-card border border-border rounded-[var(--radius)] p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-display font-medium text-muted-foreground">
                {cliente.nome.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-display text-lg font-medium tracking-wide text-foreground">
                {cliente.nome}
              </h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Phone className="w-3 h-3" strokeWidth={1.5} />
                {formatPhone(cliente.telefone)}
              </p>
            </div>
          </div>

          {ltv > 0 && (
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">Valor total gasto</p>
              <p className="text-2xl font-mono font-medium text-primary">
                R$ {ltv.toFixed(2).replace(".", ",")}
              </p>
            </div>
          )}
        </div>

        {/* Histórico de fichas */}
        <h3 className="font-display text-sm font-medium tracking-wide text-foreground/80 uppercase mb-3">
          Histórico
        </h3>

        {loadingFichas ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-[var(--radius)] h-16 animate-pulse"
              />
            ))}
          </div>
        ) : fichas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Tag className="w-8 h-8 text-muted-foreground mb-2" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">Nenhuma ficha vinculada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fichas.map((f) => (
              <button
                key={f.id}
                onClick={() => navigate(`/fichas/${f.id}`)}
                className="w-full bg-card border border-border rounded-[var(--radius)] p-4 text-left hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {f.codigo_ficha ? `#${f.codigo_ficha}` : "Sem número"}
                      {f.tipo && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          · {TIPO_LABELS[f.tipo]}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(f.created_at), "dd MMM yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {f.valor != null && (
                      <span className="font-mono text-xs text-muted-foreground">
                        R$ {f.valor.toFixed(2).replace(".", ",")}
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        STATUS_COLORS[f.status]
                      )}
                    >
                      {f.status}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
