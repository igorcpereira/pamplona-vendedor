import { User, LogOut, Settings, Sun, Moon, Building2, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import logoEscuro from "@/assets/logo-jrp.png";

interface HeaderProps {
  title: string;
}

const Header = ({
  title
}: HeaderProps) => {
  const { user, signOut, activeUnidade, vinculos, selectUnidade } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const [nomeUsuario, setNomeUsuario] = useState<string>('Vendedor');

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('nome').eq('id', user.id).single().then(({
        data
      }) => {
        if (data?.nome) {
          setNomeUsuario(data.nome);
        }
      });
    }
  }, [user]);

  return <header className="bg-primary border-b border-primary-foreground/10 sticky top-0 z-50">
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <img src={logoEscuro} alt="Logo" className="h-8 w-8 object-contain shrink-0" />
        <h1 className="text-lg font-semibold text-primary-foreground">Flavio Pamplona Alfaiataria</h1>
        {vinculos.length > 1 && activeUnidade && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-1.5 text-xs font-normal"
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                {activeUnidade.unidade.nome}
                <ChevronDown className="w-3 h-3 shrink-0 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {vinculos.map((v) => (
                <DropdownMenuItem
                  key={v.unidade_id}
                  onClick={() => selectUnidade(v.unidade_id)}
                  className={v.unidade_id === activeUnidade.unidade.id ? 'font-medium' : ''}
                >
                  <Building2 className="w-4 h-4 mr-2 opacity-60" />
                  <span>{v.unidades.nome}</span>
                  <span className="ml-2 text-xs text-muted-foreground capitalize">{v.role}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="w-10 h-10 rounded-full text-primary-foreground hover:bg-primary-foreground/10"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-primary-foreground hover:bg-primary-foreground/10">
            <User className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-2 py-1.5 text-sm font-medium">
            {nomeUsuario}
          </div>
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            {user?.email}
          </div>
          <DropdownMenuItem onClick={() => navigate('/perfil')} className="cursor-pointer">
            <Settings className="w-4 h-4 mr-2" />
            Editar Perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={signOut} className="cursor-pointer">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </div>
  </header>;
};

export default Header;