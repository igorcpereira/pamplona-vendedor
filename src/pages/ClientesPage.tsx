import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClientes } from "@/hooks/useClientes";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Search, Users, ChevronRight, Phone } from "lucide-react";
import type { Cliente } from "@/types/database";

function ClienteCard({ cliente }: { cliente: Cliente }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/clientes/${cliente.id}`)}
      className="w-full bg-card border border-border rounded-[var(--radius)] p-4 flex items-center gap-4 text-left hover:border-primary/50 transition-colors"
    >
      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium text-muted-foreground">
          {cliente.nome.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm truncate">{cliente.nome}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <Phone className="w-3 h-3" strokeWidth={1.5} />
          {formatPhone(cliente.telefone)}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
    </button>
  );
}

function formatPhone(raw: string): string {
  if (!raw) return "—";
  // 55xx9xxxxxxxx → (xx) 9xxxx-xxxx
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 13) {
    return `(${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return raw;
}

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const { data: clientes = [], isLoading } = useClientes(search);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Clientes" />

      <main className="flex-1 px-4 py-6 pb-24">
        <div className="relative mb-4">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            strokeWidth={1.5}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full bg-card border border-border rounded-[var(--radius)] py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-[var(--radius)] h-16 animate-pulse"
              />
            ))}
          </div>
        ) : clientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-10 h-10 text-muted-foreground mb-3" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">
              {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado ainda"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {clientes.map((c) => (
              <ClienteCard key={c.id} cliente={c} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
