import { useMemo, useState } from "react";
import { Plus, CalendarCheck2, Loader2, ChevronDown, ChevronRight, Target } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useAtividades, useConcluirAtividade, useAdiarAtividade, type Atividade } from "@/hooks/useAtividades";
import { GRUPOS, grupoDe, hojeISO, somaDiasISO, type Grupo } from "@/lib/atividades";
import AtividadeCard from "@/components/atividades/AtividadeCard";
import NovaAtividadeDialog from "@/components/atividades/NovaAtividadeDialog";
import NovaOportunidadeDialog from "@/components/atividades/NovaOportunidadeDialog";
import { useAuth } from "@/contexts/AuthContext";
import { podeVerFunil } from "@/lib/beta";

type Filtro = "ativas" | "todas";

// Grupos futuros nascem minimizados para não poluir a agenda (pedido da
// Pamplona, ata 13/08); Atrasadas e Hoje ficam sempre abertas.
const GRUPOS_RECOLHIVEIS: Grupo[] = ["Amanhã", "Esta semana", "Mais tarde"];

const Atividades = () => {
  const [filtro, setFiltro] = useState<Filtro>("ativas");
  const [dialogAberto, setDialogAberto] = useState(false);
  const [oportunidadeAberta, setOportunidadeAberta] = useState(false);
  const { profile } = useAuth();
  /** Beta: só conta de teste abre oportunidade pelo app. */
  const noBetaDoFunil = podeVerFunil(profile);
  const [expandidos, setExpandidos] = useState<Set<Grupo>>(new Set());
  const hoje = hojeISO();

  const alternarGrupo = (g: Grupo) =>
    setExpandidos((prev) => {
      const s = new Set(prev);
      if (s.has(g)) s.delete(g);
      else s.add(g);
      return s;
    });

  // "Ativas" = uma chamada só (o status_visivel separa as atrasadas).
  // "Todas" inclui concluídas/canceladas — janela de 30 dias para não
  // esbarrar no LIMIT 500 do servidor.
  const { data: atividades = [], isLoading } = useAtividades(
    filtro === "ativas" ? { status: "a_fazer" } : { de: somaDiasISO(hoje, -30) },
  );
  const concluir = useConcluirAtividade();
  const adiar = useAdiarAtividade();

  const onError = (err: unknown) =>
    toast({
      title: "Erro ao atualizar",
      description: err instanceof Error ? err.message : "Tente novamente.",
      variant: "destructive",
    });

  const handleConcluir = (
    id: string,
    obs?: string | null,
    desfecho?: string | null,
    payload?: Record<string, string>,
  ) => {
    concluir.mutate({ id, obs, desfecho, payload }, { onError });
  };

  const handleAdiar = (id: string, novaData: string, novaHora?: string | null) => {
    adiar.mutate(
      { id, novaData, novaHora },
      {
        onError,
        onSuccess: () => toast({ title: "Atividade adiada!" }),
      },
    );
  };

  const grupos = useMemo(() => {
    const map = new Map<Grupo, Atividade[]>();
    for (const a of atividades) {
      const g = grupoDe(a, hoje);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(a);
    }
    return GRUPOS.map((g) => ({ grupo: g, itens: map.get(g) ?? [] })).filter((x) => x.itens.length > 0);
  }, [atividades, hoje]);

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <Header title="Atividades" />

      {/* Logo de fundo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <Logo className="w-96 h-96 object-contain" />
      </div>

      <main className="px-4 py-6 max-w-md mx-auto space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Minha agenda</h2>
          <div className="flex gap-2">
            {noBetaDoFunil && (
              <Button size="sm" variant="outline" onClick={() => setOportunidadeAberta(true)}>
                <Target className="h-4 w-4 mr-1" />
                Oportunidade
              </Button>
            )}
            <Button size="sm" onClick={() => setDialogAberto(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nova
            </Button>
          </div>
        </div>

        {/* Filtro */}
        <div className="flex gap-2">
          {(["ativas", "todas"] as const).map((f) => (
            <Button
              key={f}
              type="button"
              variant={filtro === f ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setFiltro(f)}
            >
              {f === "ativas" ? "Ativas" : "Todas"}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Carregando…
          </div>
        ) : grupos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <CalendarCheck2 className="h-10 w-10 mb-3 opacity-50" />
            <p className="font-medium text-foreground">Nenhuma atividade por aqui</p>
            <p className="text-sm">
              {filtro === "ativas" ? "Você está em dia! 🎉" : "Crie um lembrete com o botão “Nova”."}
            </p>
          </div>
        ) : (
          grupos.map(({ grupo, itens }) => {
            const recolhivel = GRUPOS_RECOLHIVEIS.includes(grupo);
            const aberto = !recolhivel || expandidos.has(grupo);
            return (
              <section key={grupo} className="space-y-2">
                {recolhivel ? (
                  <button
                    type="button"
                    onClick={() => alternarGrupo(grupo)}
                    className="flex w-full items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                    aria-expanded={aberto}
                  >
                    {aberto ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    {grupo} <span className="opacity-60">({itens.length})</span>
                  </button>
                ) : (
                  <h3
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wide",
                      grupo === "Atrasadas" ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {grupo} <span className="opacity-60">({itens.length})</span>
                  </h3>
                )}
                {aberto && (
                  <div className="space-y-2">
                    {itens.map((a) => (
                      <AtividadeCard
                        key={a.id}
                        atividade={a}
                        onConcluir={(obs, desfecho, payload) => handleConcluir(a.id, obs, desfecho, payload)}
                        onAdiar={(novaData, novaHora) => handleAdiar(a.id, novaData, novaHora)}
                        isUpdating={concluir.isPending || adiar.isPending}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })
        )}
      </main>

      <NovaAtividadeDialog open={dialogAberto} onClose={() => setDialogAberto(false)} />
      {/* Monta só quando abre: fechado não faz sentido rodar a busca de clientes. */}
      {oportunidadeAberta && (
        <NovaOportunidadeDialog open onClose={() => setOportunidadeAberta(false)} />
      )}
      <BottomNav />
    </div>
  );
};

export default Atividades;
