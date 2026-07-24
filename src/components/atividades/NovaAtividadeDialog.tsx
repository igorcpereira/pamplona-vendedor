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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useClientes } from "@/hooks/useClientes";
import { useVendedores } from "@/hooks/useVendedores";
import { useTiposAtividade } from "@/hooks/useTiposAtividade";
import { useCriarAtividade } from "@/hooks/useAtividades";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  clienteObrigatorio,
  podeCriarParaOutro,
  responsavelEfetivo,
  validarNovaAtividade,
  semErros,
} from "@/lib/atividades";

interface Props {
  open: boolean;
  onClose: () => void;
}

const NovaAtividadeDialog = ({ open, onClose }: Props) => {
  const { user, activeUnidade } = useAuth();
  const role = activeUnidade?.role;
  const podeOutro = podeCriarParaOutro(role);

  const criar = useCriarAtividade();
  const { data: tipos = [] } = useTiposAtividade();
  const { data: vendedores = [] } = useVendedores();

  const [tipoId, setTipoId] = useState("");
  const [data, setData] = useState<Date>(new Date());
  const [calAberto, setCalAberto] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [busca, setBusca] = useState("");
  const [clienteSel, setClienteSel] = useState<{ id: string; nome: string } | null>(null);
  const [responsavelSel, setResponsavelSel] = useState<string>("");

  const tipo = useMemo(() => tipos.find((t) => t.id === tipoId), [tipos, tipoId]);
  const exigeCliente = clienteObrigatorio(tipo ? { slug: tipo.slug, exige_cliente: tipo.exige_cliente } : null);

  const { data: clientesPages, isFetching } = useClientes(busca);
  const clientes = useMemo(
    () => (clientesPages?.pages?.[0] ?? []) as { id: string; nome: string }[],
    [clientesPages],
  );

  useEffect(() => {
    if (!open) return;
    setTipoId("");
    setData(new Date());
    setCalAberto(false);
    setDescricao("");
    setBusca("");
    setClienteSel(null);
    setResponsavelSel("");
  }, [open]);

  const handleSalvar = async () => {
    if (!user?.id) return;
    const responsavelId = responsavelEfetivo(role, user.id, podeOutro ? responsavelSel || null : null);

    const erros = validarNovaAtividade({
      tipo: tipo ? { slug: tipo.slug, exige_cliente: tipo.exige_cliente } : null,
      data: format(data, "yyyy-MM-dd"),
      clienteId: clienteSel?.id ?? null,
      responsavelId,
    });
    if (!semErros(erros)) {
      toast({ title: erros.tipo || erros.cliente || erros.data || erros.responsavel, variant: "destructive" });
      return;
    }

    try {
      await criar.mutateAsync({
        tipoId,
        data: format(data, "yyyy-MM-dd"),
        responsaveis: [responsavelId],
        clienteId: clienteSel?.id ?? null,
        descricao: descricao.trim() || null,
        unidadeId: activeUnidade?.unidade.id ?? null,
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogTitle>Nova atividade</DialogTitle>
        <DialogDescription>Agende um próximo contato.</DialogDescription>

        <div className="space-y-4 mt-2">
          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={tipoId} onValueChange={setTipoId}>
              <SelectTrigger aria-label="Tipo"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
              <SelectContent>
                {tipos.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Responsável (só cargos globais) */}
          {podeOutro && (
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select value={responsavelSel} onValueChange={setResponsavelSel}>
                <SelectTrigger aria-label="Responsável"><SelectValue placeholder="Eu mesmo" /></SelectTrigger>
                <SelectContent>
                  {vendedores.map((v) => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Data */}
          <div className="space-y-2">
            <Label>Data *</Label>
            <Button type="button" variant="outline" className={cn("w-full justify-start text-left font-normal")}
              onClick={() => setCalAberto((v) => !v)}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(data, "PPP", { locale: ptBR })}
            </Button>
            {calAberto && (
              <div className="flex justify-center rounded-md border border-border">
                <Calendar mode="single" selected={data} onSelect={(d) => { if (d) setData(d); setCalAberto(false); }}
                  initialFocus locale={ptBR} />
              </div>
            )}
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label>Cliente {exigeCliente ? "*" : "(opcional)"}</Label>
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
                  <Input value={busca} onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar cliente pelo nome…" className="pl-8" />
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
                      <button key={c.id} type="button" className="w-full text-left p-3 text-sm hover:bg-muted/60"
                        onClick={() => setClienteSel({ id: c.id, nome: c.nome })}>
                        {c.nome}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="ativDescricao">Observação (opcional)</Label>
            <Textarea id="ativDescricao" value={descricao} onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhes do contato…" rows={3} />
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
