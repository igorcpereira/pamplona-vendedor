import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Users, Phone, ChevronRight, Search, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";
import { useClientes } from "@/hooks/useClientes";
import { formatarTelefone } from "@/lib/utils";

const Clients = () => {
  const navigate = useNavigate();
  const [termoBusca, setTermoBusca] = useState("");
  const [debouncedTermo, setDebouncedTermo] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTermo(termoBusca), 400);
    return () => clearTimeout(timer);
  }, [termoBusca]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useClientes(debouncedTermo);

  const clientes = data?.pages.flat() ?? [];

  // IntersectionObserver: carrega próxima página quando o sentinel entra na tela
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <Header title="Clientes" />

      {/* Logo de fundo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <Logo className="w-96 h-96 object-contain" />
      </div>

      <main className="px-4 py-6 max-w-md mx-auto relative z-10 space-y-4">

        {/* Campo de busca — sempre visível */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Estados */}
        {isLoading ? (
          <div className="bg-card rounded-lg p-12 text-center shadow-sm">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          </div>
        ) : clientes.length === 0 ? (
          <div className="bg-card rounded-lg p-12 text-center shadow-sm">
            {termoBusca ? (
              <p className="text-muted-foreground text-sm">Nenhum resultado encontrado.</p>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Nenhum cliente cadastrado
                </h2>
                <p className="text-muted-foreground text-sm">
                  Os clientes aparecerão aqui após o primeiro cadastro.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {clientes.map((cliente) => (
              <Card
                key={cliente.id}
                className="hover:shadow-md transition-all cursor-pointer active:scale-95"
                onClick={() => navigate(`/cliente/${cliente.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{cliente.nome}</p>
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

            {/* Sentinel + indicador de carregamento */}
            <div ref={sentinelRef} className="py-2 flex justify-center">
              {isFetchingNextPage && (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        )}

      </main>

      <BottomNav />
    </div>
  );
};

export default Clients;
