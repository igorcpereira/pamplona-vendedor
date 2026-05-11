import { ArrowRight, AlertCircle, FileText, TrendingUp, ShoppingBag, CalendarDays, Scissors, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import { useFichas } from "@/hooks/useFichas";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useItensAvulsosDoMes } from "@/hooks/useItensAvulsosDoMes";

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { data: fichas = [] } = useFichas();

  const nomeVendedor = profile?.nome || 'Vendedor(a)';
  const fichasPendentes = fichas.filter(f => f.status === 'pendente').length;

  const agora = new Date();
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
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

  // Vendas avulsas feitas pelo vendedor neste mês
  const { data: vendasAvulsasDoMes = [] } = useQuery({
    queryKey: ['vendas-avulsas-vendedor-mes', user?.id, mesAtual],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('vendas_avulsas')
        .select('valor')
        .eq('vendedor_id', user.id)
        .gte('created_at', inicioMes)
        .lt('created_at', fimMes);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  const totalVendasAvulsas = vendasAvulsasDoMes.reduce((acc, v) => acc + Number(v.valor ?? 0), 0);

  const { data: totalItensAvulsos = 0 } = useItensAvulsosDoMes();

  // Combined: vendas_avulsas table + itens_avulsos_ficha table
  const totalAvulsasCombinado = totalVendasAvulsas + totalItensAvulsos;

  const totalFichas = fichasDoMes.length;
  const totalAluguel = fichasDoMes
    .filter(f => f.tipo?.toLowerCase() === 'aluguel')
    .reduce((acc, f) => acc + Number(f.valor ?? 0), 0);
  const totalVendaFichas = fichasDoMes
    .filter(f => f.tipo?.toLowerCase() === 'venda')
    .reduce((acc, f) => acc + Number(f.valor ?? 0), 0);
  const totalVenda = totalVendaFichas + totalAvulsasCombinado;
  const totalValor = fichasDoMes.reduce((acc, f) => acc + Number(f.valor ?? 0), 0) + totalAvulsasCombinado;

  return <div className="min-h-screen bg-background pb-20 relative">
      <Header title="Início" />

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
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Fichas lançadas</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalFichas}</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scissors className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Provas feitas</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalProvas}</p>
            </Card>

            <Card className="p-4 col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Vendas avulsas</span>
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalAvulsasCombinado)}</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Vendas</span>
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalVenda)}</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Aluguéis</span>
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalAluguel)}</p>
            </Card>

            <Card className="p-4 col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Valor total</span>
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalValor)}</p>
            </Card>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>;
};
export default Dashboard;