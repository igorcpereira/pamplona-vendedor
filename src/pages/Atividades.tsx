import { useEffect, useMemo, useState } from "react";
import { Plus, CalendarCheck2, Loader2 } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useVendedores } from "@/hooks/useVendedores";
import {
  useAtividades,
  useConcluirAtividade,
  useAdiarAtividade,
  useCancelarAtividade,
  type Atividade,
} from "@/hooks/useAtividades";
import AtividadeCard from "@/components/atividades/AtividadeCard";
import NovaAtividadeDialog from "@/components/atividades/NovaAtividadeDialog";
import { grupoDaData, podeVerEquipe, type GrupoAgenda } from "@/lib/atividades";

type Aba = "minha" | "equipe";
type Filtro = "ativas" | "todas";

const GRUPOS: GrupoAgenda[] = ["Atrasadas", "Hoje", "Amanhã", "Esta semana", "Mais tarde"];

const Atividades = () => {
  const { user, activeUnidade } = useAuth();
  const role = activeUnidade?.role;
  const temEquipe = podeVerEquipe(role);

  const [aba, setAba] = useState<Aba>("minha");
  const [filtro, setFiltro] = useState<Filtro>("ativas");
  const [vendedorFiltro, setVendedorFiltro] = useState<string>("todos");
  const [dialogAberto, setDialogAberto] = useState(false);

  const { data: vendedores = [] } = useVendedores();

  // Minha agenda: as próprias. Equipe: por vendedor (ou todos).
  const responsavelId =
    aba === "minha" ? user?.id ?? null : vendedorFiltro === "todos" ? null : vendedorFiltro;

  // Janela de data (mantém a agenda leve): "Ativas" mostra atrasadas (sem piso) +
  // próximos N dias; "Todas" usa uma janela em torno de hoje. "Ver período maior" amplia N.
  const [diasJanela, setDiasJanela] = useState(60);
  useEffect(() => { setDiasJanela(60); }, [aba, filtro, vendedorFiltro]);
  const de = filtro === "todas" ? format(subDays(new Date(), diasJanela), "yyyy-MM-dd") : null;
  const ate = format(addDays(new Date(), diasJanela), "yyyy-MM-dd");

  const { data: atividades = [], isLoading } = useAtividades({ responsavelId, de, ate });
  const noTeto = atividades.length >= 500; // teto de segurança da RPC
  const concluir = useConcluirAtividade();
  const adiar = useAdiarAtividade();
  const cancelar = useCancelarAtividade();
  const isUpdating = concluir.isPending || adiar.isPending || cancelar.isPending;

  const onErro = (err: unknown) =>
    toast({ title: "Erro", description: err instanceof Error ? err.message : "Tente novamente.", variant: "destructive" });

  const hoje = format(new Date(), "yyyy-MM-dd");

  const visiveis = useMemo(() => {
    if (filtro === "ativas") {
      return atividades.filter((a) => a.status_visivel === "a_fazer" || a.status_visivel === "atrasada");
    }
    return atividades;
  }, [atividades, filtro]);

  const grupos = useMemo(() => {
    const map = new Map<GrupoAgenda, Atividade[]>();
    for (const a of visiveis) {
      const g = grupoDaData(a.data, hoje);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(a);
    }
    return GRUPOS.map((g) => ({ grupo: g, itens: map.get(g) ?? [] })).filter((x) => x.itens.length > 0);
  }, [visiveis, hoje]);

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <Header title="Início" />

      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <Logo className="w-96 h-96 object-contain" />
      </div>

      <main className="px-4 py-6 max-w-md mx-auto space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {aba === "minha" ? "Minha agenda" : "Agenda da equipe"}
          </h2>
          <Button size="sm" onClick={() => setDialogAberto(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova
          </Button>
        </div>

        {/* Filtros lado a lado: aba (gestor+) à esquerda, status à direita */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {temEquipe && (
            <div className="flex gap-2">
              {(["minha", "equipe"] as const).map((a) => (
                <Button key={a} type="button" variant={aba === a ? "default" : "outline"} size="sm"
                  className="rounded-full" onClick={() => setAba(a)}>
                  {a === "minha" ? "Minha agenda" : "Equipe"}
                </Button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            {(["ativas", "todas"] as const).map((f) => (
              <Button key={f} type="button" variant={filtro === f ? "default" : "outline"} size="sm"
                className="rounded-full" onClick={() => setFiltro(f)}>
                {f === "ativas" ? "Ativas" : "Todas"}
              </Button>
            ))}
          </div>
        </div>

        {/* Filtro por vendedor (aba Equipe) — linha própria (select largo) */}
        {temEquipe && aba === "equipe" && (
          <Select value={vendedorFiltro} onValueChange={setVendedorFiltro}>
            <SelectTrigger aria-label="Filtrar por vendedor"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os vendedores</SelectItem>
              {vendedores.map((v) => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Carregando…
          </div>
        ) : grupos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <CalendarCheck2 className="h-10 w-10 mb-3 opacity-50" />
            <p className="font-medium text-foreground">Nenhuma atividade por aqui</p>
            <p className="text-sm">{filtro === "ativas" ? "Tudo em dia! 🎉" : "Crie um contato com o botão “Nova”."}</p>
          </div>
        ) : (
          grupos.map(({ grupo, itens }) => (
            <section key={grupo} className="space-y-2">
              <h3 className={cn("text-xs font-semibold uppercase tracking-wide",
                grupo === "Atrasadas" ? "text-destructive" : "text-muted-foreground")}>
                {grupo} <span className="opacity-60">({itens.length})</span>
              </h3>
              <div className="space-y-2">
                {itens.map((a) => (
                  <AtividadeCard
                    key={a.id}
                    atividade={a}
                    isUpdating={isUpdating}
                    onConcluir={(obs) => concluir.mutate({ id: a.id, obs }, { onError: onErro })}
                    onAdiar={(novaData, obs) => adiar.mutate({ id: a.id, novaData, obs }, { onError: onErro, onSuccess: () => toast({ title: "Atividade adiada!" }) })}
                    onCancelar={(motivo) => cancelar.mutate({ id: a.id, motivo }, { onError: onErro })}
                  />
                ))}
              </div>
            </section>
          ))
        )}

        {!isLoading && grupos.length > 0 && (
          <div className="pt-2 text-center space-y-2">
            {noTeto && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Mostrando os primeiros 500 itens — refine o período ou o filtro.
              </p>
            )}
            <Button variant="ghost" size="sm" className="text-muted-foreground"
              onClick={() => setDiasJanela((d) => d + 60)}>
              Ver período maior (±{diasJanela} dias)
            </Button>
          </div>
        )}
      </main>

      <NovaAtividadeDialog open={dialogAberto} onClose={() => setDialogAberto(false)} />
      <BottomNav />
    </div>
  );
};

export default Atividades;
