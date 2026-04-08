import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UsuarioUnidadeRole } from "@/types/database";
import type { Unidade } from "@/types/database";
import Logo from "@/components/Logo";
import { Building2, ChevronRight } from "lucide-react";

type VinculoComUnidade = UsuarioUnidadeRole & { unidades: Unidade };

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  master: "Master",
  franqueado: "Franqueado",
  gestor: "Gestor",
  vendedor: "Vendedor",
};

export default function SelectUnidadePage() {
  const { vinculos, selectUnidade } = useAuth();
  const navigate = useNavigate();

  async function handleSelect(unidadeId: number) {
    await selectUnidade(unidadeId);
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <Logo className="w-96 h-96" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo className="w-16 h-16" />
        </div>

        <h2 className="font-display text-xl font-medium tracking-wide text-center text-foreground mb-1">
          Selecione a unidade
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Em qual unidade você está trabalhando agora?
        </p>

        <div className="space-y-3">
          {(vinculos as VinculoComUnidade[]).map((v) => (
            <button
              key={v.unidade_id}
              onClick={() => handleSelect(v.unidade_id)}
              className="w-full bg-card border border-border rounded-[var(--radius)] p-4 flex items-center gap-4 hover:border-primary transition-colors text-left"
            >
              <div className="w-10 h-10 bg-muted rounded-[var(--radius)] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">
                  {v.unidades.nome}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ROLE_LABELS[v.role] ?? v.role}
                  {v.unidades.cidade ? ` · ${v.unidades.cidade}` : ""}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
