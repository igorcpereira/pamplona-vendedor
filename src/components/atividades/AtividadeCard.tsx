import { useState } from "react";
import { Check, Phone, User, Clock, X, Loader2, MessageCircle, History } from "lucide-react";
import { parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Atividade } from "@/hooks/useAtividades";
import HistoricoCliente from "@/components/atividades/HistoricoCliente";

interface Props {
  atividade: Atividade;
  onConcluir: (obs?: string | null) => void;
  onAdiar: (novaData: string, obs?: string | null) => void;
  onCancelar: (motivo?: string | null) => void;
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
  a_fazer: { label: "A fazer", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  atrasada: { label: "Atrasada", className: "bg-red-500/15 text-red-600 dark:text-red-400" },
  concluida: { label: "Concluída", className: "bg-green-500/15 text-green-600 dark:text-green-400" },
  cancelada: { label: "Cancelada", className: "bg-muted text-muted-foreground" },
};

type ModalTipo = null | "concluir" | "adiar" | "cancelar";

const AtividadeCard = ({ atividade, onConcluir, onAdiar, onCancelar, isUpdating }: Props) => {
  const contatoNome = atividade.cliente_nome;
  const telefoneRaw = (atividade.cliente_telefone || "").replace(/\D/g, "");
  const telefone = telefoneRaw ? formatTelefone(telefoneRaw) : null;
  const sv = atividade.status_visivel ?? atividade.status ?? "a_fazer";
  const encerrada = sv === "concluida" || sv === "cancelada";
  const badge = statusBadge[sv] ?? statusBadge.a_fazer;

  const [modal, setModal] = useState<ModalTipo>(null);
  const [novaData, setNovaData] = useState<Date | undefined>();
  const [texto, setTexto] = useState("");
  const [histOpen, setHistOpen] = useState(false);

  const abrir = (tipo: Exclude<ModalTipo, null>) => {
    setTexto("");
    setNovaData(atividade.data ? parseISO(atividade.data) : new Date());
    setModal(tipo);
  };

  const confirmar = () => {
    if (modal === "concluir") onConcluir(texto.trim() || null);
    else if (modal === "cancelar") onCancelar(texto.trim() || null);
    else if (modal === "adiar" && novaData) onAdiar(format(novaData, "yyyy-MM-dd"), texto.trim() || null);
    setModal(null);
  };

  return (
    <Card className={cn("p-4", encerrada && "opacity-60")}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={cn("font-semibold text-foreground", sv === "concluida" && "line-through")}>
              {atividade.tipo_nome}
            </h4>
            <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", badge.className)}>
              {badge.label}
            </Badge>
          </div>

          {atividade.descricao && <p className="text-sm text-muted-foreground mt-1">{atividade.descricao}</p>}

          {atividade.cliente_id && (
            <button type="button" onClick={() => setHistOpen(true)}
              className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline">
              <History className="h-3.5 w-3.5" /> Histórico do cliente
            </button>
          )}

          {contatoNome && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{contatoNome}</span>
            </div>
          )}
          {telefone && (
            <div className="flex items-center gap-2 mt-2">
              <a href={`tel:${telefoneRaw}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary hover:underline">
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

        {!encerrada && (
          <div className="flex shrink-0 gap-1.5">
            <Button type="button" size="icon" className="h-9 w-9 rounded-full bg-green-600 text-white hover:bg-green-700"
              disabled={isUpdating} onClick={() => abrir("concluir")} title="Concluir" aria-label="Concluir">
              <Check className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="outline"
              className="h-9 w-9 rounded-full text-blue-600 dark:text-blue-400 border-blue-500/40 hover:bg-blue-500/10"
              disabled={isUpdating} onClick={() => abrir("adiar")} title="Adiar" aria-label="Adiar">
              <Clock className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="outline"
              className="h-9 w-9 rounded-full text-destructive border-destructive/40 hover:bg-destructive/10"
              disabled={isUpdating} onClick={() => abrir("cancelar")} title="Cancelar" aria-label="Cancelar">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={modal !== null} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="max-w-xs">
          <DialogTitle>
            {modal === "concluir" ? "Concluir atividade" : modal === "adiar" ? "Adiar atividade" : "Cancelar atividade"}
          </DialogTitle>
          <DialogDescription>
            {modal === "adiar" ? "Escolha a nova data e registre o que foi falado (opcional)." : "Registre o que foi falado (opcional)."}
          </DialogDescription>

          {modal === "adiar" && (
            <div className="flex justify-center">
              <Calendar mode="single" selected={novaData} onSelect={setNovaData} initialFocus locale={ptBR} />
            </div>
          )}

          <Textarea
            aria-label="Observação"
            placeholder={modal === "cancelar" ? "Motivo (opcional)" : "Observação (opcional)"}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={2}
          />

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setModal(null)} disabled={isUpdating}>
              Voltar
            </Button>
            <Button className="flex-1" onClick={confirmar} disabled={isUpdating || (modal === "adiar" && !novaData)}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {atividade.cliente_id && (
        <Dialog open={histOpen} onOpenChange={setHistOpen}>
          <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
            <DialogTitle>Histórico do cliente</DialogTitle>
            <DialogDescription>{atividade.cliente_nome ?? "Cliente"}</DialogDescription>
            <HistoricoCliente clienteId={atividade.cliente_id} />
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default AtividadeCard;
