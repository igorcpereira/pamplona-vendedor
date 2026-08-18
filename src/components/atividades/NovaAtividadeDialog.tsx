import { useEffect, useMemo, useState } from "react";
import { Loader2, CalendarIcon, Search, X, CheckCircle2, ChevronLeft, User, UserPlus, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, normalizarTelefone, formatarTelefoneInput } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useClientes } from "@/hooks/useClientes";
import { useUltimosClientes } from "@/hooks/useUltimosClientes";
import { useTagsAtivas } from "@/hooks/useTagsAtivas";
import {
  useCriarAtividade,
  useTiposAtividadeAtivos,
  useCarteiraPrevia,
  useCriarLoteCarteira,
  type CarteiraFiltros,
} from "@/hooks/useAtividades";
import {
  hojeISO, somaDiasISO, proximoDiaUtilISO, dataCurta,
  DATAS_RAPIDAS, RECENCIA_ATALHOS, TIPOS_CLIENTE, resumoCarteira,
} from "@/lib/atividades";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pula o passo 1 com este cliente já escolhido (ex.: botão da tela Clientes). */
  clienteInicial?: { id: string; nome: string } | null;
}

type ClienteSel = { id: string; nome: string } | null;
type Modo = "cliente" | "pre";
type Aba = "individual" | "carteira";

/**
 * Criação em 2 passos: (1) cliente — busca, atalhos com os últimos lançamentos
 * do vendedor, ou "Pré Cadastro" (possível cliente: nome + telefone, que vira
 * cliente de verdade no salvar via edge criar-cliente, com dedup por telefone);
 * (2) tipo + data da atividade (atalhos de dia útil + calendário) + data do
 * evento opcional + observação. Responsável e unidade são decididos no servidor
 * (atividades_criar).
 */
const NovaAtividadeDialog = ({ open, onClose, clienteInicial }: Props) => {
  const criar = useCriarAtividade();
  const criarLote = useCriarLoteCarteira();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: tipos } = useTiposAtividadeAtivos();
  const { data: recentes, isLoading: recentesLoading } = useUltimosClientes();
  const { data: tagsAtivas } = useTagsAtivas();
  const hoje = hojeISO();

  const [passo, setPasso] = useState<1 | 2>(1);
  const [aba, setAba] = useState<Aba>("individual");
  const [modo, setModo] = useState<Modo>("cliente");
  const [clienteSel, setClienteSel] = useState<ClienteSel>(null);
  // Filtros do modo "Minha carteira"
  const [tagsSel, setTagsSel] = useState<string[]>([]);
  const [tiposSel, setTiposSel] = useState<string[]>([]);
  const [recenciaCampo, setRecenciaCampo] = useState<"venda" | "atendimento">("atendimento");
  const [recenciaDias, setRecenciaDias] = useState<number | null>(null);
  const [buscaTag, setBuscaTag] = useState("");
  const [filtrosPrevia, setFiltrosPrevia] = useState<CarteiraFiltros | null>(null);
  // Pré cadastro (possível cliente)
  const [preNome, setPreNome] = useState("");
  const [preTelefone, setPreTelefone] = useState(""); // só dígitos no estado
  const [salvando, setSalvando] = useState(false);

  const [tipoId, setTipoId] = useState("");
  // Datas trafegam como string ISO; o objeto Date vive só dentro do Calendar.
  const [data, setData] = useState<string>(hojeISO());
  const [calAberto, setCalAberto] = useState(false);
  const [dataEvento, setDataEvento] = useState(""); // "" = sem data de evento
  const [descricao, setDescricao] = useState("");

  const [busca, setBusca] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState("");

  const { data: clientesPages, isFetching } = useClientes(buscaAtiva);
  const clientes = useMemo(
    () => ((clientesPages?.pages?.[0] ?? []) as { id: string; nome: string; telefone: string | null }[]).slice(0, 8),
    [clientesPages],
  );

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

  // Filtros correntes da carteira (recência única: "sem contato há N+ dias").
  const filtrosCarteira = useMemo<CarteiraFiltros>(
    () => ({
      tagIds: tagsSel,
      tipos: tiposSel,
      recenciaCampo: recenciaDias !== null ? recenciaCampo : null,
      recenciaAte: recenciaDias !== null ? somaDiasISO(hoje, -recenciaDias) : null,
    }),
    [tagsSel, tiposSel, recenciaCampo, recenciaDias, hoje],
  );

  // Debounce da prévia da carteira (400ms, padrão do lote do CRM).
  useEffect(() => {
    if (!open || aba !== "carteira") {
      setFiltrosPrevia(null);
      return;
    }
    const t = setTimeout(() => setFiltrosPrevia(filtrosCarteira), 400);
    return () => clearTimeout(t);
  }, [open, aba, filtrosCarteira]);

  const { data: previa, isFetching: previaCarregando } = useCarteiraPrevia(filtrosPrevia);

  useEffect(() => {
    if (!open) return;
    setAba("individual");
    setModo("cliente");
    setPreNome("");
    setPreTelefone("");
    setTipoId("");
    setDescricao("");
    setData(hojeISO());
    setDataEvento("");
    setCalAberto(false);
    setBusca("");
    setBuscaAtiva("");
    setTagsSel([]);
    setTiposSel([]);
    setRecenciaCampo("atendimento");
    setRecenciaDias(null);
    setBuscaTag("");
    // Com cliente vindo de fora (tela Clientes), entra direto no passo 2.
    setClienteSel(clienteInicial ?? null);
    setPasso(clienteInicial ? 2 : 1);
  }, [open, clienteInicial]);

  const escolherCliente = (c: NonNullable<ClienteSel>) => {
    setModo("cliente");
    setClienteSel(c);
    setBusca("");
    setBuscaAtiva("");
    setPasso(2);
  };

  const abrirPreCadastro = () => {
    setModo("pre");
    setClienteSel(null);
    setPasso(2);
  };

  const alternarTag = (id: string) =>
    setTagsSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const alternarTipoCliente = (key: string) =>
    setTiposSel((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));

  // Tags visíveis de cara: as em destaque + as já escolhidas; a busca acha as demais.
  const tagsDestaque = useMemo(
    () => (tagsAtivas ?? []).filter((t) => t.padrao || tagsSel.includes(t.id)),
    [tagsAtivas, tagsSel],
  );
  const tagsBusca = useMemo(() => {
    const q = buscaTag.trim().toLowerCase();
    if (q.length < 2) return [];
    return (tagsAtivas ?? [])
      .filter((t) => !t.padrao && !tagsSel.includes(t.id) && t.nome.toLowerCase().includes(q))
      .slice(0, 12);
  }, [tagsAtivas, buscaTag, tagsSel]);

  const exigeCliente = !!tipos?.find((t) => t.id === tipoId)?.exige_cliente;

  /**
   * Cria (ou reaproveita) o cliente do pré-cadastro via edge criar-cliente —
   * o dedup é por telefone: número já cadastrado devolve o cliente existente.
   * Erros não-2xx vêm com o corpo escondido em err.context (padrão do
   * EditarFichaV3).
   */
  const criarClientePre = async (telefoneNormalizado: string): Promise<string> => {
    const { data: resposta, error } = await supabase.functions.invoke("criar-cliente", {
      body: {
        nome: preNome.trim(),
        telefone: telefoneNormalizado,
        vendedor_id: user?.id,
      },
    });
    if (error || !resposta?.cliente_id) {
      let mensagem = resposta?.error || error?.message || "Falha ao criar o cliente.";
      const ctx = (error as { context?: Response } | null)?.context;
      if (ctx && typeof ctx.json === "function") {
        try {
          const corpo = await ctx.json();
          if (corpo?.error) mensagem = corpo.error;
        } catch { /* mantém a mensagem que já temos */ }
      }
      throw new Error(mensagem);
    }
    return resposta.cliente_id as string;
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

    let telefoneNormalizado: string | null = null;
    if (modo === "pre") {
      if (!preNome.trim()) {
        toast({ title: "Informe o nome do possível cliente.", variant: "destructive" });
        return;
      }
      telefoneNormalizado = normalizarTelefone(preTelefone);
      if (!telefoneNormalizado) {
        toast({ title: "Telefone inválido.", description: "Informe DDD + número (ex.: 44 99999-8888).", variant: "destructive" });
        return;
      }
    } else if (exigeCliente && !clienteSel) {
      const nome = tipos?.find((t) => t.id === tipoId)?.nome ?? "escolhido";
      toast({ title: `O tipo "${nome}" exige um cliente.`, variant: "destructive" });
      return;
    }

    setSalvando(true);
    try {
      let clienteId = clienteSel?.id ?? null;
      if (modo === "pre" && telefoneNormalizado) {
        clienteId = await criarClientePre(telefoneNormalizado);
        queryClient.invalidateQueries({ queryKey: ["clientes"] });
      }

      await criar.mutateAsync({
        tipoId,
        data,
        clienteId,
        descricao: descricao.trim() || null,
        dataEvento: dataEvento || null,
      });
      toast({ title: modo === "pre" ? "Cliente pré-cadastrado e atividade criada!" : "Atividade criada!" });
      onClose();
    } catch (err) {
      toast({
        title: "Erro ao criar",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  const salvarCarteira = async () => {
    if (!tipoId) {
      toast({ title: "Escolha o tipo da atividade.", variant: "destructive" });
      return;
    }
    if (!data) {
      toast({ title: "Escolha a data.", variant: "destructive" });
      return;
    }
    setSalvando(true);
    try {
      const nomesTags = (tagsAtivas ?? []).filter((t) => tagsSel.includes(t.id)).map((t) => t.nome);
      const res = await criarLote.mutateAsync({
        tipoId,
        data,
        filtros: filtrosCarteira,
        // Sem observação, a descrição automática explica o recorte da carteira.
        descricao: descricao.trim() || resumoCarteira(filtrosCarteira, nomesTags),
      });
      toast({ title: res.criadas === 1 ? "1 atividade criada!" : `${res.criadas} atividades criadas!` });
      onClose();
    } catch (err) {
      toast({
        title: "Erro ao criar",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  const ocupado = salvando || criar.isPending || criarLote.isPending;

  // Blocos compartilhados entre o passo 2 individual e o da carteira.
  const blocoTipo = (
    <div className="space-y-2">
      <Label>Tipo *</Label>
      <div className="grid grid-cols-2 gap-2">
        {(tipos ?? []).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTipoId(t.id)}
            className={cn(
              "flex items-center justify-center rounded-md border px-3 h-11 text-sm text-center leading-snug",
              tipoId === t.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted/40 hover:border-primary hover:bg-primary/5",
            )}
          >
            {t.nome}
          </button>
        ))}
      </div>
    </div>
  );

  const blocoData = (
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
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
        {passo === 1 ? (
          <>
            <DialogTitle>Nova atividade</DialogTitle>

            {/* Seletor de modo (escondido quando o cliente já veio de fora) */}
            {!clienteInicial && (
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: "individual", label: "Individual", icone: User },
                  { key: "carteira", label: "Minha carteira", icone: Users },
                ] as const).map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setAba(m.key)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-md border px-3 h-10 text-sm",
                      aba === m.key
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted/40 hover:border-primary hover:bg-primary/5",
                    )}
                  >
                    <m.icone className="h-4 w-4" />
                    {m.label}
                  </button>
                ))}
              </div>
            )}

            {aba === "carteira" ? (
              <>
                <DialogDescription>Passo 1 de 2 — filtre a sua carteira</DialogDescription>

                <div className="space-y-4">
                  {/* Tags (OU entre elas) */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Tags</Label>
                    {tagsDestaque.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tagsDestaque.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => alternarTag(t.id)}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs",
                              tagsSel.includes(t.id)
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-muted/40 hover:border-primary hover:bg-primary/5",
                            )}
                          >
                            {t.nome}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={buscaTag}
                        onChange={(e) => setBuscaTag(e.target.value)}
                        placeholder="Buscar outras tags…"
                        className="pl-9"
                      />
                    </div>
                    {tagsBusca.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tagsBusca.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => { alternarTag(t.id); setBuscaTag(""); }}
                            className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs hover:border-primary hover:bg-primary/5"
                          >
                            {t.nome}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tipo de cliente (pelo menos um dos escolhidos) */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Tipo de cliente</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {TIPOS_CLIENTE.map((t) => (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => alternarTipoCliente(t.key)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs",
                            tiposSel.includes(t.key)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-muted/40 hover:border-primary hover:bg-primary/5",
                          )}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recência */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Sem contato há…</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {RECENCIA_ATALHOS.map((r) => (
                        <button
                          key={r.dias}
                          type="button"
                          onClick={() => setRecenciaDias((v) => (v === r.dias ? null : r.dias))}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs",
                            recenciaDias === r.dias
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-muted/40 hover:border-primary hover:bg-primary/5",
                          )}
                        >
                          {r.label}+
                        </button>
                      ))}
                    </div>
                    {recenciaDias !== null && (
                      <div className="flex gap-2">
                        {([
                          { key: "atendimento", label: "Último atendimento" },
                          { key: "venda", label: "Última venda" },
                        ] as const).map((c) => (
                          <button
                            key={c.key}
                            type="button"
                            onClick={() => setRecenciaCampo(c.key)}
                            className={cn(
                              "flex-1 rounded-md border px-2 py-1.5 text-xs",
                              recenciaCampo === c.key
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "border-border bg-muted/40 hover:border-primary",
                            )}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Prévia */}
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm">
                    <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {previaCarregando || !previa ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Calculando…
                      </span>
                    ) : (
                      <span>
                        <span className="font-semibold">{previa.total}</span>{" "}
                        {previa.total === 1 ? "cliente da sua carteira" : "clientes da sua carteira"}
                      </span>
                    )}
                  </div>

                  <Button
                    type="button"
                    className="w-full"
                    disabled={previaCarregando || !previa || previa.total === 0}
                    onClick={() => setPasso(2)}
                  >
                    Continuar
                  </Button>
                </div>
              </>
            ) : (
              <>
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
                onClick={abrirPreCadastro}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Pré Cadastro
              </Button>
            </div>
              </>
            )}
          </>
        ) : aba === "carteira" ? (
          <>
            <DialogTitle>Atividades para a carteira</DialogTitle>
            <DialogDescription>Passo 2 de 2 — tipo e data</DialogDescription>

            {/* Resumo do público + voltar aos filtros */}
            <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => setPasso(1)}
                aria-label="Voltar para os filtros"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="flex items-center gap-1.5 text-sm min-w-0">
                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {previa
                    ? previa.total === 1
                      ? "1 cliente selecionado"
                      : `${previa.total} clientes selecionados`
                    : "…"}
                </span>
              </span>
            </div>

            <div className="space-y-4">
              {blocoTipo}

              {blocoData}

              {/* Observação */}
              <div className="space-y-2">
                <Label htmlFor="carteiraObs">Observação (opcional)</Label>
                <Textarea
                  id="carteiraObs"
                  rows={3}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Sem observação, registramos o filtro usado"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={ocupado}
              >
                Cancelar
              </Button>
              <Button type="button" className="flex-1" onClick={salvarCarteira} disabled={ocupado}>
                {ocupado && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar atividades
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogTitle>Nova atividade</DialogTitle>
            <DialogDescription>
              {modo === "pre" ? "Passo 2 de 2 — pré cadastro, tipo e data" : "Passo 2 de 2 — tipo e data"}
            </DialogDescription>

            {/* Cliente escolhido (ou pré cadastro) + voltar */}
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
              {modo === "pre" ? (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UserPlus className="h-4 w-4 shrink-0" />
                  Pré Cadastro
                </span>
              ) : clienteSel ? (
                <span className="flex items-center gap-1.5 text-sm min-w-0">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                  <span className="truncate">{clienteSel.nome}</span>
                </span>
              ) : null}
            </div>

            <div className="space-y-4">
              {/* Pré cadastro: dados do possível cliente */}
              {modo === "pre" && (
                <div className="space-y-3 rounded-md border border-border p-3">
                  <div className="space-y-2">
                    <Label htmlFor="preNome">Nome *</Label>
                    <Input
                      id="preNome"
                      value={preNome}
                      onChange={(e) => setPreNome(e.target.value)}
                      placeholder="Nome do possível cliente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preTelefone">Telefone *</Label>
                    <Input
                      id="preTelefone"
                      type="tel"
                      inputMode="numeric"
                      value={formatarTelefoneInput(preTelefone)}
                      onChange={(e) => setPreTelefone(e.target.value.replace(/\D/g, ""))}
                      placeholder="(44) 9 9999-8888"
                    />
                    <p className="text-xs text-muted-foreground">
                      Se o telefone já for de um cliente, a atividade é vinculada a ele.
                    </p>
                  </div>
                </div>
              )}

              {blocoTipo}

              {blocoData}

              {/* Data do evento (opcional, distinta da data da atividade) */}
              <div className="space-y-2">
                <Label htmlFor="novaAtvDataEvento">Data do evento (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="novaAtvDataEvento"
                    type="date"
                    value={dataEvento}
                    onChange={(e) => setDataEvento(e.target.value)}
                    className="flex-1"
                  />
                  {dataEvento && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setDataEvento("")}
                      aria-label="Limpar data do evento"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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
                disabled={ocupado}
              >
                Cancelar
              </Button>
              <Button type="button" className="flex-1" onClick={salvar} disabled={ocupado}>
                {ocupado && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
