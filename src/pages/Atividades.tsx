import { useMemo, useState } from "react";
import { Plus, CalendarCheck2, Loader2 } from "lucide-react";
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

type Filtro = "ativas" | "todas";

const Atividades = () => {
  const [filtro, setFiltro] = useState<Filtro>("ativas");
  const [dialogAberto, setDialogAberto] = useState(false);
  const hoje = hojeISO();

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

  const handleConcluir = (id: string) => {
    concluir.mutate({ id }, { onError });
  };

  const handleAdiar = (id: string, novaData: string) => {
    adiar.mutate(
      { id, novaData },
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
      <Header title="Início" />

      {/* Logo de fundo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <Logo className="w-96 h-96 object-contain" />
      </div>

      <main className="px-4 py-6 max-w-md mx-auto space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Minha agenda</h2>
          <Button size="sm" onClick={() => setDialogAberto(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova
          </Button>
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
          grupos.map(({ grupo, itens }) => (
            <section key={grupo} className="space-y-2">
              <h3
                className={cn(
                  "text-xs font-semibold uppercase tracking-wide",
                  grupo === "Atrasadas" ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {grupo} <span className="opacity-60">({itens.length})</span>
              </h3>
              <div className="space-y-2">
                {itens.map((a) => (
                  <AtividadeCard
                    key={a.id}
                    atividade={a}
                    onConcluir={() => handleConcluir(a.id)}
                    onAdiar={(novaData) => handleAdiar(a.id, novaData)}
                    isUpdating={concluir.isPending || adiar.isPending}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <NovaAtividadeDialog open={dialogAberto} onClose={() => setDialogAberto(false)} />
      <BottomNav />
    </div>
  );
};

export default Atividades;
