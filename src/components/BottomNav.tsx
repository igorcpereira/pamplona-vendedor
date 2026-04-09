import { Home, Users, Plus, ClipboardList, FlaskConical } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useFichas } from "@/hooks/useFichas";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { vinculos } = useAuth();
  const { data: fichas = [] } = useFichas();

  const isMaster = vinculos.some(v => v.role === 'master');
  const fichasPendentes = fichas.filter(f => f.status === 'pendente').length;

  const navItems = [
    { icon: Home, label: "Início", path: "/" },
    { icon: Users, label: "Clientes", path: "/clientes" },
    { icon: ClipboardList, label: "Fichas", path: "/pre-cadastro" },
    { icon: Plus, label: "Novo", path: "/novo" },
    ...(isMaster ? [{ icon: FlaskConical, label: "Teste", path: "/teste-de-versao" }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-primary border-t border-primary-foreground/10 z-[60]">
      <div className="flex items-center justify-around px-4 py-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          const showBadge = item.path === "/pre-cadastro" && fichasPendentes > 0;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all relative",
                isActive
                  ? "text-primary-foreground bg-primary-foreground/20 border border-primary-foreground/30"
                  : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              )}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {showBadge && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {fichasPendentes}
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
