import { Check, Phone, User, Clock, Sparkles, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Atividade, AtividadeStatus } from "@/hooks/useAtividades";

interface Props {
  atividade: Atividade;
  onStatus: (status: AtividadeStatus) => void;
  isUpdating?: boolean;
}

// Telefone salvo como 55DD9XXXXXXXX (13 dígitos) → (DD) 9XXXX-XXXX
const formatTelefone = (telefone: string | null): string | null => {
  const d = (telefone ?? "").replace(/\D/g, "");
  const local = d.length === 13 && d.startsWith("55") ? d.slice(2) : d.slice(-11);
  if (local.length < 10) return telefone;
  return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
};

const statusBadge: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  feita: { label: "Feita", className: "bg-green-500/15 text-green-600 dark:text-green-400" },
  adiada: { label: "Adiada", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  cancelada: { label: "Cancelada", className: "bg-muted text-muted-foreground" },
};

const AtividadeCard = ({ atividade, onStatus, isUpdating }: Props) => {
  const contatoNome = atividade.cliente_nome || atividade.nome_contato;
  const telefone = formatTelefone(atividade.telefone_contato);
  const concluida = atividade.status === "feita" || atividade.status === "cancelada";
  const badge = statusBadge[atividade.status] ?? statusBadge.pendente;

  return (
    <Card className={cn("p-4", concluida && "opacity-60")}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={cn("font-semibold text-foreground", atividade.status === "feita" && "line-through")}>
              {atividade.titulo}
            </h4>
            <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", badge.className)}>
              {badge.label}
            </Badge>
            {atividade.origem === "gatilho" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                Automática
              </Badge>
            )}
          </div>

          {atividade.descricao && (
            <p className="text-sm text-muted-foreground mt-1">{atividade.descricao}</p>
          )}

          {contatoNome && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{contatoNome}</span>
            </div>
          )}
          {telefone && (
            <a
              href={`tel:${(atividade.telefone_contato ?? "").replace(/\D/g, "")}`}
              className="flex items-center gap-1.5 text-sm text-primary mt-1 hover:underline w-fit"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {telefone}
            </a>
          )}
        </div>

        {/* Ações fixas (ícones) */}
        {!concluida && (
          <div className="flex shrink-0 gap-1.5">
            <Button
              type="button"
              size="icon"
              className="h-9 w-9 rounded-full bg-green-600 text-white hover:bg-green-700"
              disabled={isUpdating}
              onClick={() => onStatus("feita")}
              title="Concluir"
              aria-label="Concluir"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-9 w-9 rounded-full text-blue-600 dark:text-blue-400 border-blue-500/40 hover:bg-blue-500/10"
              disabled={isUpdating}
              onClick={() => onStatus("adiada")}
              title="Adiar"
              aria-label="Adiar"
            >
              <Clock className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-9 w-9 rounded-full text-destructive border-destructive/40 hover:bg-destructive/10"
              disabled={isUpdating}
              onClick={() => onStatus("cancelada")}
              title="Cancelar"
              aria-label="Cancelar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AtividadeCard;
