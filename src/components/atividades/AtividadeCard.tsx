import { useState } from "react";
import { Check, Phone, User, Clock, Sparkles, X, Loader2, MessageCircle } from "lucide-react";
import { parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Atividade, AtividadeStatus } from "@/hooks/useAtividades";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  atividade: Atividade;
  onStatus: (status: AtividadeStatus) => void;
  onAdiar: (novaData: string) => void;
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

const AtividadeCard = ({ atividade, onStatus, onAdiar, isUpdating }: Props) => {
  const contatoNome = atividade.cliente_nome || atividade.nome_contato;
  const telefoneRaw = (atividade.telefone_contato || atividade.cliente_telefone || "").replace(/\D/g, "");
  const telefone = telefoneRaw ? formatTelefone(telefoneRaw) : null;
  const concluida = atividade.status === "feita" || atividade.status === "cancelada";
  const badge = statusBadge[atividade.status] ?? statusBadge.pendente;

  const [adiarOpen, setAdiarOpen] = useState(false);
  const [novaData, setNovaData] = useState<Date | undefined>();

  const abrirAdiar = () => {
    setNovaData(atividade.data ? parseISO(atividade.data) : new Date());
    setAdiarOpen(true);
  };

  const confirmarAdiar = () => {
    if (!novaData) return;
    onAdiar(format(novaData, "yyyy-MM-dd"));
    setAdiarOpen(false);
  };

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
            <div className="flex items-center gap-2 mt-2">
              <a
                href={`tel:${telefoneRaw}`}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {telefone}
              </a>
              <a
                href={`https://wa.me/${telefoneRaw}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
                title="Abrir no WhatsApp"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            </div>
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
              onClick={abrirAdiar}
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

      {/* Mini-modal para reagendar */}
      <Dialog open={adiarOpen} onOpenChange={setAdiarOpen}>
        <DialogContent className="max-w-xs">
          <DialogTitle>Adiar atividade</DialogTitle>
          <DialogDescription>Escolha a nova data para “{atividade.titulo}”.</DialogDescription>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={novaData}
              onSelect={setNovaData}
              initialFocus
              locale={ptBR}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setAdiarOpen(false)} disabled={isUpdating}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={confirmarAdiar} disabled={!novaData || isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adiar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AtividadeCard;
