import { useEffect, useState } from "react";
import { ArrowRight, AlertCircle, FileText, TrendingUp, ShoppingBag, CalendarDays, Scissors, Package, Building2, Ruler } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import { useFichas } from "@/hooks/useFichas";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useItensAvulsosDoMes } from "@/hooks/useItensAvulsosDoMes";
import { useResumoUnidades, useUnidadesReais } from "@/hooks/useResumoUnidade";

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const pad = (n: number) => String(n).padStart(2, '0');

// Grid dos 6 cards do resumo — compartilhado entre a visão pessoal e a por unidade
function CardsResumo({ fichas, provas, avulsas, vendas, sobMedida, alugueis, total }: {
  fichas: number;
  provas: number;
  avulsas: number;
  vendas: number;
  sobMedida: number;
  alugueis: number;
  total: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Linha 1 — Ficha lançada / Prova feita */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Fichas lançadas</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{fichas}</p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Scissors className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Provas feitas</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{provas}</p>
      </Card>

      {/* Linha 2 — Vendas avulsas / Aluguéis */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">Vendas avulsas</span>
        </div>
        <p className="text-xl font-bold text-foreground">{formatCurrency(avulsas)}</p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">Aluguéis</span>
        </div>
        <p className="text-xl font-bold text-foreground">{formatCurrency(alugueis)}</p>
      </Card>

      {/* Linha 3 — Vendas / Sob medida */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingBag className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">Vendas</span>
        </div>
        <p className="text-xl font-bold text-foreground">{formatCurrency(vendas)}</p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Ruler className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">Sob medida</span>
        </div>
        <p className="text-xl font-bold text-foreground">{formatCurrency(sobMedida)}</p>
      </Card>

      {/* Linha 4 — Valor total (largura cheia) */}
      <Card className="p-4 col-span-2">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Valor total</span>
        </div>
        <p className="text-xl font-bold text-foreground">{formatCurrency(total)}</p>
      </Card>
    </div>
  );
}

// Visão por unidade — cargos globais (gestor/admin/master)
function ResumoUnidadeView() {
  const { profile } = useAuth();
  const agora = new Date();
  const nomeMes = MESES[agora.getMonth()];
  const inicioMes = `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-01`;
  const prox = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
  const fimMes = `${prox.getFullYear()}-${pad(prox.getMonth() + 1)}-01`;

  const { data: unidades = [] } = useUnidadesReais(true);
  const { data: resumos = [] } = useResumoUnidades(inicioMes, fimMes);

  const [unidadeId, setUnidadeId] = useState<number | null>(null);

  // Default: unidade em que o usuário está alocado (se real), senão a primeira
  useEffect(() => {
    if (unidadeId !== null || unidades.length === 0) return;
    const alocada = profile?.unidade_id && profile.unidade_id !== 3
      && unidades.some(u => u.id === profile.unidade_id)
      ? profile.unidade_id
      : unidades[0].id;
    setUnidadeId(alocada);
  }, [unidades, unidadeId, profile?.unidade_id]);

  const resumo = resumos.find(r => r.unidade_id === unidadeId);

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <Header title="Resumo do mês" />

      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <Logo className="w-96 h-96 object-contain" />
      </div>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6 relative z-10">
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Bem-vindo(a), {profile?.nome || 'Gestor(a)'}!
          </h2>
          <p className="text-muted-foreground">
            Acompanhe o desempenho da unidade.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Resumo de {nomeMes}
            </h3>
            <Select
              value={unidadeId !== null ? String(unidadeId) : undefined}
              onValueChange={(v) => setUnidadeId(Number(v))}
            >
              <SelectTrigger className="w-44 h-8 text-sm">
                <Building2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Unidade" />
              </SelectTrigger>
              <SelectContent>
                {unidades.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <CardsResumo
            fichas={Number(resumo?.total_fichas ?? 0)}
            provas={Number(resumo?.total_provas ?? 0)}
            avulsas={Number(resumo?.avulsa_valor ?? 0)}
            vendas={Number(resumo?.venda_valor ?? 0)}
            sobMedida={Number(resumo?.sob_medida_valor ?? 0)}
            alugueis={Number(resumo?.aluguel_valor ?? 0)}
            total={Number(resumo?.total_valor ?? 0)}
          />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

// Visão pessoal — vendedor/franqueado/administrativo (comportamento original)
function ResumoPessoalView() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { data: fichas = [] } = useFichas();

  const nomeVendedor = profile?.nome || 'Vendedor(a)';
  const fichasPendentes = fichas.filter(f => f.status === 'pendente').length;

  const agora = new Date();
  const mesAtual = `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}`;
  const nomeMes = MESES[agora.getMonth()];

  const fichasDoMes = fichas.filter(f => f.created_at?.startsWith(mesAtual));

  // Limites do mês atual (UTC) para queries em created_at
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1).toISOString();

  // Provas feitas pelo vendedor neste mês (nova tabela `provas`)
  const { data: provasDoMes = [] } = useQuery({
    queryKey: ['provas-vendedor-mes', user?.id, mesAtual],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('provas')
        .select('id')
        .eq('vendedor_id', user.id)
        .gte('created_at', inicioMes)
        .lt('created_at', fimMes);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  const totalProvas = provasDoMes.length;

  const { data: totalItensAvulsos = 0 } = useItensAvulsosDoMes();

  // Total de itens avulsos do mês (tabela itens_avulsos_ficha)
  const totalAvulsasCombinado = totalItensAvulsos;

  const totalFichas = fichasDoMes.length;
  const totalAluguel = fichasDoMes
    .filter(f => f.tipo?.toLowerCase() === 'aluguel')
    .reduce((acc, f) => acc + Number(f.valor ?? 0), 0);
  // "Vendas" = venda padrão; "Sob medida" = venda com sob_medida=true (separados,
  // como no dashboard do CRM). O total continua somando tudo.
  const totalVenda = fichasDoMes
    .filter(f => f.tipo?.toLowerCase() === 'venda' && !f.sob_medida)
    .reduce((acc, f) => acc + Number(f.valor ?? 0), 0);
  const totalSobMedida = fichasDoMes
    .filter(f => f.tipo?.toLowerCase() === 'venda' && f.sob_medida)
    .reduce((acc, f) => acc + Number(f.valor ?? 0), 0);
  const totalValor = fichasDoMes.reduce((acc, f) => acc + Number(f.valor ?? 0), 0) + totalAvulsasCombinado;

  return <div className="min-h-screen bg-background pb-20 relative">
      <Header title="Resumo do mês" />

      {/* Logo de fundo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <Logo className="w-96 h-96 object-contain" />
      </div>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6 relative z-10">
        {/* Welcome Section */}
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Bem-vindo(a), {nomeVendedor}!
          </h2>
          <p className="text-muted-foreground">
            Pronto para começar um novo atendimento?
          </p>
        </div>

        {/* Fichas Pendentes Alert */}
        {fichasPendentes > 0 && (
          <Card
            className="bg-destructive/10 border-destructive/20 p-4 cursor-pointer hover:bg-destructive/15 transition-colors"
            onClick={() => navigate('/fichas')}
          >
            <div className="flex items-center gap-3">
              <div className="bg-destructive/20 p-2 rounded-full">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {fichasPendentes} {fichasPendentes === 1 ? 'Ficha Pendente' : 'Fichas Pendentes'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Aguardando avaliação
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        )}

        {/* Resumo do mês */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Resumo de {nomeMes}
          </h3>
          <CardsResumo
            fichas={totalFichas}
            provas={totalProvas}
            avulsas={totalAvulsasCombinado}
            vendas={totalVenda}
            sobMedida={totalSobMedida}
            alugueis={totalAluguel}
            total={totalValor}
          />
        </div>
      </main>

      <BottomNav />
    </div>;
}

const ResumoMes = () => {
  const { activeUnidade } = useAuth();
  // Cargos globais veem o totalizador da unidade (com seletor); demais, o resumo pessoal
  const ehGlobal = ['gestor', 'admin', 'master'].includes(activeUnidade?.role ?? '');
  return ehGlobal ? <ResumoUnidadeView /> : <ResumoPessoalView />;
};

export default ResumoMes;
