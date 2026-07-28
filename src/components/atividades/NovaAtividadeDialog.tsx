import { useEffect, useMemo, useState } from "react";
import { Loader2, CalendarIcon, Search, X, CheckCircle2, ChevronLeft, User, UserX } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useClientes } from "@/hooks/useClientes";
import { useUltimosClientes } from "@/hooks/useUltimosClientes";
import { useCriarAtividade, useTiposAtividadeAtivos } from "@/hooks/useAtividades";
import { hojeISO, somaDiasISO, proximoDiaUtilISO, dataCurta, DATAS_RAPIDAS } from "@/lib/atividades";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
}

type ClienteSel = { id: string; nome: string } | null;

/**
 * Criação em 2 passos: (1) cliente — atalhos com os últimos lançamentos do
 * vendedor, busca, ou seguir sem cliente; (2) tipo + data (atalhos de dia útil
 * + calendário) + observação. Responsável e unidade são decididos no servidor
 * (atividades_criar). Sem cliente, só tipos com exige_cliente=false.
 */
const NovaAtividadeDialog = ({ open, onClose }: Props) => {
  const criar = useCriarAtividade();
  const { data: tipos } = useTiposAtividadeAtivos();
  const { data: recentes, isLoading: recentesLoading } = useUltimosClientes();
  const hoje = hojeISO();

  const [passo, setPasso] = useState<1 | 2>(1);
  const [clienteSel, setClienteSel] = useState<ClienteSel>(null);
  const [tipoId, setTipoId] = useState("");
  // Data trafega como string ISO; o objeto Date vive só dentro do Calendar.
  const [data, setData] = useState<string>(hojeISO());
  const [calAberto, setCalAberto] = useState(false);
  const [descricao, setDescricao] = useState("");

  const [busca, setBusca] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState("");

  const { data: clientesPages, isFetching } = useClientes(buscaAtiva);
  const clientes = useMemo(
    () => ((clientesPages?.pages?.[0] ?? []) as { id: string; nome: string; telefone: string | null }[]).slice(0, 8),
    [clientesPages],
  );

  // Sem cliente, só tipos que dispensam cliente (Lembrete).
  const tiposDisponiveis = useMemo(
    () => (tipos ?? []).filter((t) => (clienteSel ? true : !t.exige_cliente)),
    [tipos, clienteSel],
  );
  const exigeCliente = !!tipos?.find((t) => t.id === tipoId)?.exige_cliente;

  // Atalhos de data já resolvidos em dia útil (sábado conta; domingo → segunda).
  const atalhosData = useMemo(
    () => DATAS_RAPIDAS.map((a) => ({ ...a, iso: proximoDiaUtilISO(somaDiasISO(hoje, a.dias)) })),
    [hoje],
  );

  // Debounce da busca (mesmo padrão de Clients.tsx).
  useEffect(() => {
    const t = setTimeout(() => setBuscaAtiva(busca), 400);
    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    if (!open) return;
    setPasso(1);
    setClienteSel(null);
    setTipoId("");
    setDescricao("");
    setData(hojeISO());
    setCalAberto(false);
    setBusca("");
    setBuscaAtiva("");
  }, [open]);

  const escolherCliente = (c: ClienteSel) => {
    setClienteSel(c);
    // Voltou, trocou para "sem cliente" e o tipo escolhido exige? Limpa.
    if (!c && tipoId && tipos?.find((t) => t.id === tipoId)?.exige_cliente) setTipoId("");
    setBusca("");
    setBuscaAtiva("");
    setPasso(2);
  };

  const salvar = async () => {
    if (!tipoId) {
      toast({ title: "Escolha o tipo da atividade.", variant: "destructive" });
      return;
    }
    if (!data) {
      toast({ title: "Escolha a data.", variant: "destructive" });
      return;
    }
    if (exigeCliente && !clienteSel) {
      const nome = tipos?.find((t) => t.id === tipoId)?.nome ?? "escolhido";
      toast({ title: `O tipo "${nome}" exige um cliente.`, variant: "destructive" });
      return;
    }

    try {
      await criar.mutateAsync({
        tipoId,
        data,
        clienteId: clienteSel?.id ?? null,
        descricao: descricao.trim() || null,
      });
      toast({ title: "Atividade criada!" });
      onClose();
    } catch (err) {
      toast({
        title: "Erro ao criar",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
        {passo === 1 ? (
          <>
            <DialogTitle>Nova atividade</DialogTitle>
            <DialogDescription>Passo 1 de 2 — quem é o cliente?</DialogDescription>

            <div className="space-y-4">
              {/* Busca */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Buscar cliente</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Nome ou telefone…"
                    className="pl-9"
                  />
                </div>
                {buscaAtiva.trim().length >= 2 && (
                  <div className="rounded-md border border-border divide-y divide-border max-h-48 overflow-y-auto">
                    {isFetching ? (
                      <div className="flex items-center justify-center py-3 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : clientes.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
                    ) : (
                      clientes.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60"
                          onClick={() => escolherCliente({ id: c.id, nome: c.nome })}
                        >
                          {c.nome}
                          {c.telefone && <span className="text-muted-foreground"> · {c.telefone}</span>}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Últimos clientes lançados — grade fixa 2 colunas × 5 linhas */}
              {recentesLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-md" />
                  ))}
                </div>
              ) : (recentes ?? []).length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Seus últimos lançamentos</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(recentes ?? []).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => escolherCliente(c)}
                        className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 h-14 text-sm text-left hover:border-primary hover:bg-primary/5 min-w-0"
                      >
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="line-clamp-2 break-words leading-snug">{c.nome}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => escolherCliente(null)}
              >
                <UserX className="h-4 w-4 mr-2" />
                Continuar sem cliente
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogTitle>Nova atividade</DialogTitle>
            <DialogDescription>Passo 2 de 2 — tipo e data</DialogDescription>

            {/* Cliente escolhido + voltar */}
            <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => setPasso(1)}
                aria-label="Voltar para a escolha do cliente"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {clienteSel ? (
                <span className="flex items-center gap-1.5 text-sm min-w-0">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                  <span className="truncate">{clienteSel.nome}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UserX className="h-4 w-4 shrink-0" />
                  Sem cliente
                </span>
              )}
            </div>

            <div className="space-y-4">
              {/* Tipo */}
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={tipoId} onValueChange={setTipoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposDisponiveis.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!clienteSel && (
                  <p className="text-xs text-muted-foreground">
                    Sem cliente, só tipos de lembrete ficam disponíveis.
                  </p>
                )}
              </div>

              {/* Data */}
              <div className="space-y-2">
                <Label>Data *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {atalhosData.map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      onClick={() => { setData(a.iso); setCalAberto(false); }}
                      className={cn(
                        "flex flex-col items-start justify-center rounded-md border px-3 h-14 text-left",
                        data === a.iso
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted/40 hover:border-primary hover:bg-primary/5",
                      )}
                    >
                      <span className="text-sm leading-snug">{a.label}</span>
                      <span className={cn(
                        "text-xs",
                        data === a.iso ? "text-primary-foreground/80" : "text-muted-foreground",
                      )}>
                        {dataCurta(a.iso)}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCalAberto((v) => !v)}
                    className={cn(
                      "col-span-2 flex items-center justify-center gap-2 rounded-md border px-3 h-11 text-sm",
                      calAberto || !atalhosData.some((a) => a.iso === data)
                        ? "border-primary text-primary bg-primary/5"
                        : "border-border bg-muted/40 hover:border-primary hover:bg-primary/5",
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    Outra data…
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(data), "PPP", { locale: ptBR })}
                </p>
                {calAberto && (
                  <div className="flex justify-center border border-border rounded-md">
                    <Calendar
                      mode="single"
                      selected={parseISO(data)}
                      onSelect={(d) => {
                        if (!d) return;
                        setData(format(d, "yyyy-MM-dd"));
                        setCalAberto(false);
                      }}
                      initialFocus
                      locale={ptBR}
                    />
                  </div>
                )}
              </div>

              {/* Observação */}
              <div className="space-y-2">
                <Label htmlFor="novaAtvObs">Observação (opcional)</Label>
                <Textarea
                  id="novaAtvObs"
                  rows={3}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Fica registrada na atividade"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={criar.isPending}
              >
                Cancelar
              </Button>
              <Button type="button" className="flex-1" onClick={salvar} disabled={criar.isPending}>
                {criar.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NovaAtividadeDialog;
