import { format, parseISO } from "date-fns";
import { Loader2, History } from "lucide-react";
import { useHistoricoCliente } from "@/hooks/useHistoricoCliente";

const ACAO_LABEL: Record<string, string> = {
  criada: "criou",
  concluida: "concluiu",
  adiada: "adiou",
  cancelada: "cancelou",
  reatribuida: "reatribuiu",
  whatsapp: "abriu o WhatsApp em",
};

function fmt(iso?: string | null) {
  if (!iso) return "";
  try { return format(parseISO(iso), "dd/MM/yy HH:mm"); } catch { return iso; }
}
function fmtData(iso?: string | null) {
  if (!iso) return "";
  try { return format(parseISO(iso), "dd/MM/yyyy"); } catch { return iso; }
}

interface Props {
  clienteId: string;
}

/** Linha do tempo (histórico) de atividades de um cliente. */
const HistoricoCliente = ({ clienteId }: Props) => {
  const { data: eventos = [], isLoading } = useHistoricoCliente(clienteId);

  if (isLoading) {
    return <div className="flex justify-center py-6 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (eventos.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Nenhum histórico para este cliente.</p>;
  }

  return (
    <ol className="space-y-3">
      {eventos.map((e) => (
        <li key={e.evento_id} className="border-l-2 border-border pl-3">
          <div className="text-sm">
            <span className="font-medium">{e.autor_nome ?? "Alguém"}</span>{" "}
            <span className="text-muted-foreground">{ACAO_LABEL[e.acao] ?? e.acao}</span>{" "}
            <span className="font-medium">{e.tipo_nome}</span>
            {e.acao === "adiada" && e.data_nova && (
              <span className="text-muted-foreground"> ({fmtData(e.data_anterior)} → {fmtData(e.data_nova)})</span>
            )}
          </div>
          {e.observacao && <p className="text-sm text-muted-foreground mt-0.5">“{e.observacao}”</p>}
          <p className="text-[11px] text-muted-foreground mt-0.5">{fmt(e.quando)}</p>
        </li>
      ))}
    </ol>
  );
};

export default HistoricoCliente;
