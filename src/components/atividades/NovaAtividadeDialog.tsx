import { useEffect, useMemo, useState } from "react";
import { Loader2, CalendarIcon, Search, X, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useClientes } from "@/hooks/useClientes";
import { useCriarAtividade } from "@/hooks/useAtividades";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
}

type ContatoModo = "nenhum" | "cliente" | "avulso";

const formatPhone = (digits: string): string => {
  const d = digits.slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const toPhone13 = (digits: string): string => {
  const d = digits.replace(/\D/g, "");
  if (d.length === 13) return d;
  if (d.length === 11) return `55${d}`;
  return d;
};

const NovaAtividadeDialog = ({ open, onClose }: Props) => {
  const criar = useCriarAtividade();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState<Date>(new Date());

  const [contatoModo, setContatoModo] = useState<ContatoModo>("nenhum");
  // cliente cadastrado
  const [busca, setBusca] = useState("");
  const [clienteSel, setClienteSel] = useState<{ id: string; nome: string } | null>(null);
  // avulso
  const [nomeAvulso, setNomeAvulso] = useState("");
  const [telefoneAvulso, setTelefoneAvulso] = useState("");

  const { data: clientesPages, isFetching } = useClientes(busca);
  const clientes = useMemo(
    () => (clientesPages?.pages?.[0] ?? []) as { id: string; nome: string }[],
    [clientesPages],
  );

  useEffect(() => {
    if (!open) return;
    setTitulo("");
    setDescricao("");
    setData(new Date());
    setContatoModo("nenhum");
    setBusca("");
    setClienteSel(null);
    setNomeAvulso("");
    setTelefoneAvulso("");
  }, [open]);

  const handleSalvar = async () => {
    if (!titulo.trim()) {
      toast({ title: "Informe o título da atividade", variant: "destructive" });
      return;
    }

    let cliente_id: string | null = null;
    let nome_contato: string | null = null;
    let telefone_contato: string | null = null;

    if (contatoModo === "cliente") {
      if (!clienteSel) {
        toast({ title: "Selecione um cliente", variant: "destructive" });
        return;
      }
      cliente_id = clienteSel.id;
    } else if (contatoModo === "avulso") {
      if (!nomeAvulso.trim()) {
        toast({ title: "Informe o nome do contato", variant: "destructive" });
        return;
      }
      const digits = telefoneAvulso.replace(/\D/g, "");
      if (digits && digits.length !== 11) {
        toast({ title: "Telefone inválido", description: "Use o formato (DD) 9XXXX-XXXX.", variant: "destructive" });
        return;
      }
      nome_contato = nomeAvulso.trim();
      telefone_contato = digits ? toPhone13(digits) : null;
    }

    try {
      await criar.mutateAsync({
        titulo: titulo.trim(),
        data: format(data, "yyyy-MM-dd"),
        descricao: descricao.trim() || null,
        cliente_id,
        nome_contato,
        telefone_contato,
      });
      toast({ title: "Atividade criada!" });
      onClose();
    } catch (err) {
      toast({
        title: "Erro ao criar atividade",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const ModoBtn = ({ modo, label }: { modo: ContatoModo; label: string }) => (
    <Button
      type="button"
      variant={contatoModo === modo ? "default" : "outline"}
      size="sm"
      className="flex-1"
      onClick={() => setContatoModo(modo)}
    >
      {label}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogTitle>Nova atividade</DialogTitle>
        <DialogDescription>Cria um lembrete na sua agenda.</DialogDescription>

        <div className="space-y-4 mt-2">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="ativTitulo">Título *</Label>
            <Input
              id="ativTitulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Ligar para o cliente"
            />
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label>Data *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(data, "PPP", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data}
                  onSelect={(d) => d && setData(d)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Contato */}
          <div className="space-y-2">
            <Label>Contato (opcional)</Label>
            <div className="flex gap-2">
              <ModoBtn modo="nenhum" label="Nenhum" />
              <ModoBtn modo="cliente" label="Cliente" />
              <ModoBtn modo="avulso" label="Avulso" />
            </div>

            {contatoModo === "cliente" && (
              <div className="space-y-2 pt-1">
                {clienteSel ? (
                  <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {clienteSel.nome}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setClienteSel(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar cliente pelo nome…"
                        className="pl-8"
                      />
                    </div>
                    {busca.trim().length >= 2 && (
                      <div className="max-h-40 overflow-y-auto rounded-md border border-border divide-y divide-border">
                        {isFetching && (
                          <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Buscando…
                          </div>
                        )}
                        {!isFetching && clientes.length === 0 && (
                          <div className="p-3 text-sm text-muted-foreground">Nenhum cliente encontrado.</div>
                        )}
                        {clientes.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className="w-full text-left p-3 text-sm hover:bg-muted/60"
                            onClick={() => setClienteSel({ id: c.id, nome: c.nome })}
                          >
                            {c.nome}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {contatoModo === "avulso" && (
              <div className="space-y-2 pt-1">
                <Input
                  value={nomeAvulso}
                  onChange={(e) => setNomeAvulso(e.target.value)}
                  placeholder="Nome do contato"
                />
                <Input
                  type="tel"
                  value={formatPhone(telefoneAvulso)}
                  onChange={(e) => setTelefoneAvulso(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="(00) 00000-0000"
                />
              </div>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="ativDescricao">Observação (opcional)</Label>
            <Textarea
              id="ativDescricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhes do lembrete…"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={criar.isPending}>
              Cancelar
            </Button>
            <Button type="button" className="flex-1" onClick={handleSalvar} disabled={criar.isPending}>
              {criar.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NovaAtividadeDialog;
