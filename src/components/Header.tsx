import { Sun, Moon, LogOut, ChevronDown } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { activeUnidade, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
    toast.success("Até logo!");
  }

  return (
    <header className="sticky top-0 z-50 bg-primary py-3 px-4 flex items-center justify-between">
      <div className="flex flex-col">
        <span className="text-lg font-semibold text-primary-foreground leading-tight">
          {title ?? "Pamplona"}
        </span>
        {activeUnidade && (
          <button
            onClick={() => navigate("/select-unidade")}
            className="flex items-center gap-0.5 text-xs text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            {activeUnidade.unidade.nome}
            <ChevronDown className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary-foreground/10 transition-colors"
          aria-label="Alternar tema"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 text-primary-foreground" />
          ) : (
            <Moon className="w-5 h-5 text-primary-foreground" />
          )}
        </button>

        <button
          onClick={handleSignOut}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary-foreground/10 transition-colors"
          aria-label="Sair"
        >
          <LogOut className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>
    </header>
  );
}
