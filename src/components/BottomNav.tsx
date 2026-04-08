import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Fichas" },
  { to: "/fichas/nova", icon: Plus, label: "Nova Ficha" },
  { to: "/clientes", icon: Users, label: "Clientes" },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] bg-primary flex items-center">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 transition-colors",
              active
                ? "bg-primary-foreground/20 border-t-2 border-primary-foreground/30 text-primary-foreground"
                : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            )}
          >
            <Icon className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
