import { Camera, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [nomeVendedor, setNomeVendedor] = useState<string>('Vendedor(a)');

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
  return <div className="min-h-screen bg-background pb-20">
      <Header title="Dashboard" />
      
      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="bg-card rounded-2xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Bem-vindo(a), {nomeVendedor}!
          </h2>
          <p className="text-muted-foreground">
            Pronto para começar um novo atendimento?
          </p>
        </div>

        {/* Main Action Card */}
        

        {/* Recent Pre-Registrations */}
        <div className="space-y-3">
          
          
          
        </div>
      </main>

      <BottomNav />
    </div>;
};
export default Dashboard;