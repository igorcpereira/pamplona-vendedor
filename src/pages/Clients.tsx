import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Users, Phone, ChevronRight, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import logoJRP from "@/assets/logo-jrp.png";
import { useClientes } from "@/hooks/useClientes";
import { formatarTelefone } from "@/lib/utils";

const Clients = () => {
  const navigate = useNavigate();
  const { data: clientes = [], isLoading: loading } = useClientes();
  const [termoBusca, setTermoBusca] = useState("");

  const handleClienteClick = (cliente: any) => {
    navigate(`/cliente/${cliente.id}`);
  };

  // Filtrar clientes por nome, telefone ou ficha
  const clientesFiltrados = clientes.filter(cliente => {
    const termo = termoBusca.toLowerCase().trim();
    if (!termo) return true;
    
    // Buscar no nome
    const nomeMatch = cliente.nome.toLowerCase().includes(termo);
    
    // Buscar no telefone (remover formatação)
    const telefoneRaw = cliente.telefone?.replace(/\D/g, '') || '';
    const telefoneMatch = telefoneRaw.includes(termo.replace(/\D/g, ''));
    
    // Buscar nos códigos das fichas
    const fichasMatch = (cliente as any).fichas?.some((ficha: any) => 
      ficha.codigo_ficha?.toString().toLowerCase().includes(termo)
    ) || false;
    
    return nomeMatch || telefoneMatch || fichasMatch;
  });

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <Header title="Clientes" />
      
      {/* Logo de fundo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <img 
          src={logoJRP} 
          alt="JRP Logo" 
          className="w-96 h-96 object-contain"
        />
      </div>
      
      <main className="px-4 py-6 max-w-md mx-auto relative z-10">
        {loading ? (
          <div className="bg-card rounded-lg p-12 text-center shadow-sm">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="bg-card rounded-lg p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Nenhum cliente cadastrado
            </h2>
            <p className="text-muted-foreground text-sm">
              Os clientes aparecerão aqui após o primeiro cadastro.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Campo de filtro */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nome, telefone ou ficha..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Lista de clientes filtrados */}
            {clientesFiltrados.length === 0 ? (
              <div className="bg-card rounded-lg p-12 text-center shadow-sm">
                <p className="text-muted-foreground text-sm">
                  Nenhum resultado encontrado.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {clientesFiltrados.map((cliente) => (
              <Card 
                key={cliente.id} 
                className="hover:shadow-md transition-all cursor-pointer active:scale-95"
                onClick={() => handleClienteClick(cliente)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {cliente.nome}
                      </p>
                      {cliente.telefone && (
                        <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <p className="text-xs">{formatarTelefone(cliente.telefone)}</p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Cadastrado em {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Clients;
