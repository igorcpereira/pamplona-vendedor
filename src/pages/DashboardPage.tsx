import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFichas } from "@/hooks/useFichas";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import type { Ficha, FichaStatus, FichaTipo } from "@/types/database";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Plus,
  Tag,
  ArrowDownCircle,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_TABS: { value: FichaStatus | "todas"; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "pendente", label: "Pendente" },
  { value: "ativa", label: "Ativa" },
  { value: "baixa", label: "Baixa" },
  { value: "erro", label: "Erro" },
];

const TIPO_LABELS: Record<FichaTipo, string> = {
  aluguel: "Aluguel",
  venda: "Venda",
  ajuste: "Ajuste",
};

const TIPO_COLORS: Record<FichaTipo, string> = {
  aluguel: "bg-primary/20 text-primary",
  venda: "bg-success/20 text-success",
  ajuste: "bg-secondary/30 text-secondary-foreground",
};

function StatusIcon({ status }: { status: FichaStatus }) {
  if (status === "pendente")
    return <Clock className="w-4 h-4 text-warning" strokeWidth={1.5} />;
  if (status === "ativa")
    return <CheckCircle className="w-4 h-4 text-success" strokeWidth={1.5} />;
  if (status === "erro")
    return <AlertCircle className="w-4 h-4 text-destructive" strokeWidth={1.5} />;
  return <ArrowDownCircle className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />;
}

function FichaCard({ ficha }: { ficha: Ficha }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/fichas/${ficha.id}`)}
      className="w-full bg-card border border-border rounded-[var(--radius)] p-4 text-left hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm truncate">
            {ficha.nome_cliente ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {ficha.codigo_ficha ? `#${ficha.codigo_ficha}` : "Sem número"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {ficha.tipo && (
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-[var(--radius)]",
                TIPO_COLORS[ficha.tipo]
              )}
            >
              {TIPO_LABELS[ficha.tipo]}
            </span>
          )}
          <StatusIcon status={ficha.status} />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {ficha.created_at
            ? format(new Date(ficha.created_at), "dd MMM yyyy", { locale: ptBR })
            : "—"}
        </span>
        <div className="flex items-center gap-3">
          {ficha.valor != null && (
            <span className="font-mono">
              R$ {ficha.valor.toFixed(2).replace(".", ",")}
            </span>
          )}
          {ficha.enviada_whatsapp_geral && (
            <MessageCircle className="w-3.5 h-3.5 text-success" strokeWidth={1.5} />
          )}
          {ficha.enviada_whatsapp_geral === false && ficha.status === "ativa" && (
            <MessageCircle className="w-3.5 h-3.5 text-warning" strokeWidth={1.5} />
          )}
        </div>
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const { data: fichas = [], isLoading } = useFichas();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FichaStatus | "todas">("todas");
  const [search, setSearch] = useState("");

  const filtered = fichas.filter((f) => {
    if (activeTab !== "todas" && f.status !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        f.nome_cliente?.toLowerCase().includes(q) ||
        f.codigo_ficha?.toLowerCase().includes(q) ||
        f.telefone_cliente?.includes(q)
      );
    }
    return true;
  });

  const pendentes = fichas.filter((f) => f.status === "pendente").length;
  const erros = fichas.filter((f) => f.status === "erro").length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Fichas" />

      <main className="flex-1 px-4 py-6 pb-24">
        {/* Resumo rápido */}
        {(pendentes > 0 || erros > 0) && (
          <div className="flex gap-3 mb-5">
            {pendentes > 0 && (
              <div className="flex-1 bg-warning/10 border border-warning/30 rounded-[var(--radius)] p-3">
                <p className="text-xs text-muted-foreground">Em processamento</p>
                <p className="text-2xl font-mono font-medium text-warning">{pendentes}</p>
              </div>
            )}
            {erros > 0 && (
              <div className="flex-1 bg-destructive/10 border border-destructive/30 rounded-[var(--radius)] p-3">
                <p className="text-xs text-muted-foreground">Com erro</p>
                <p className="text-2xl font-mono font-medium text-destructive">{erros}</p>
              </div>
            )}
          </div>
        )}

        {/* Busca */}
        <div className="relative mb-4">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            strokeWidth={1.5}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, número ou telefone..."
            className="w-full bg-card border border-border rounded-[var(--radius)] py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Filtros de status */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors",
                activeTab === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-[var(--radius)] h-20 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Tag className="w-10 h-10 text-muted-foreground mb-3" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">
              {search ? "Nenhuma ficha encontrada" : "Nenhuma ficha ainda"}
            </p>
            {!search && (
              <button
                onClick={() => navigate("/fichas/nova")}
                className="mt-4 flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} />
                Criar primeira ficha
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((f) => (
              <FichaCard key={f.id} ficha={f} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
