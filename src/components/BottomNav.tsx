import { CalendarCheck2, Users, Plus, ClipboardList, BarChart3, FlaskConical } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useFichas } from "@/hooks/useFichas";
import { useAtividades } from "@/hooks/useAtividades";
import { hojeISO } from "@/lib/atividades";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { vinculos, activeUnidade, profile } = useAuth();
  const { data: fichas = [] } = useFichas();

  // Badge de Atividades: o que está para hoje (inclui atrasadas — continuam
  // sendo trabalho de hoje). Para cargo global, soma a UNIDADE em que o usuário
  // está alocado (profiles.unidade_id); sem unidade real alocada, cai no escopo
  // pessoal para não contar a rede inteira. A agenda em si segue pessoal.
  const ehGlobal = ['gestor', 'admin', 'master'].includes(activeUnidade?.role ?? '');
  const unidadeAlocada = profile?.unidade_id && profile.unidade_id !== 3 ? profile.unidade_id : null;
  const { data: atividadesAbertas = [] } = useAtividades({
    status: "a_fazer",
    ate: hojeISO(),
    unidadeId: ehGlobal ? unidadeAlocada : null,
  });

  const isMaster = vinculos.some(v => v.role === 'master');
  const fichasPendentes = fichas.filter(f => f.status === 'pendente').length;
  const atividadesHoje = atividadesAbertas.length;

  const navItems = [
    { icon: BarChart3, label: "Resumo", path: "/resumo" },
    { icon: CalendarCheck2, label: "Atividades", path: "/" },
    { icon: Users, label: "Clientes", path: "/clientes" },
    { icon: ClipboardList, label: "Fichas", path: "/fichas" },
    { icon: Plus, label: "Novo", path: "/novo" },
    ...(isMaster ? [{ icon: FlaskConical, label: "Teste", path: "/teste-de-versao" }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-primary border-t border-primary-foreground/10 z-[60]">
      <div className="flex items-center justify-around px-1 py-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          const badgeCount =
            item.path === "/fichas" ? fichasPendentes :
            item.path === "/" ? atividadesHoje : 0;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-2 rounded-lg transition-all relative",
                isActive
                  ? "text-primary-foreground bg-primary-foreground/20 border border-primary-foreground/30"
                  : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              )}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {badgeCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {badgeCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
