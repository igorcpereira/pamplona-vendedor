import { Camera, ArrowRight, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoJRP from "@/assets/logo-jrp.png";
import { useFichas } from "@/hooks/useFichas";
import { Card } from "@/components/ui/card";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [nomeVendedor, setNomeVendedor] = useState<string>('Vendedor(a)');
  const { data: fichas = [] } = useFichas();
  
  const fichasPendentes = fichas.filter(f => f.status === 'pendente').length;

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('nome')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.nome) {
            setNomeVendedor(data.nome);
          }
        });
    }
  }, [user]);
  return <div className="min-h-screen bg-background pb-20 relative">
      <Header title="Início" />
      
      {/* Logo de fundo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <img 
          src={logoJRP} 
          alt="JRP Logo" 
          className="w-96 h-96 object-contain"
        />
      </div>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6 relative z-10">
        {/* Welcome Section */}
        <div className="bg-card rounded-2xl p-6 shadow-sm">
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
            onClick={() => navigate('/pre-cadastro')}
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
      </main>

      <BottomNav />
    </div>;
};
export default Dashboard;