import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Search, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { capitalizarNome } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";
import { useFichasProcessadas } from "@/hooks/useFichasProcessadas";
import { useVendedoresUnidade } from "@/hooks/useVendedoresUnidade";

interface ProcessingCard {
  id: string;
  timestamp: string;
  status: string;
  phone?: string;
  data?: any;
  nome_cliente?: string;
  codigo_ficha?: string;
  tipo?: string;
  vendedor_id?: string;
}

const Fichas = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<ProcessingCard[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("processada");
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data: vendedores = [] } = useVendedoresUnidade();
  const vendedorNomes = new Map(vendedores.map(v => [v.id, v.nome]));

  // Debounce do input de busca (usado pela aba "processada")
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText.trim()), 400);
    return () => clearTimeout(t);
  }, [searchText]);

  // Hook da aba "processada" — só faz fetch quando a aba estiver ativa
  const {
    data: processadasData,
    isLoading: processadasLoading,
    isFetchingNextPage: processadasFetchingNext,
    fetchNextPage: processadasFetchNext,
    hasNextPage: processadasHasNext,
  } = useFichasProcessadas(debouncedSearch, activeFilter === "processada");

  const fichasProcessadas = processadasData?.pages.flat() ?? [];

  // IntersectionObserver para scroll infinito na aba "processada"
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && processadasHasNext && !processadasFetchingNext) {
        processadasFetchNext();
      }
    },
    [processadasHasNext, processadasFetchingNext, processadasFetchNext]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || activeFilter !== "processada") return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver, activeFilter]);

  const getTipoColor = (tipo?: string) => {
    if (!tipo) return "bg-muted text-muted-foreground";
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes("aluguel") || tipoLower.includes("alugar")) {
      return "bg-blue-100 text-blue-700 border border-blue-200";
    } else if (tipoLower.includes("venda") || tipoLower.includes("vender")) {
      return "bg-green-100 text-green-700 border border-green-200";
    } else if (tipoLower.includes("ajuste") || tipoLower.includes("conserto")) {
      return "bg-purple-100 text-purple-700 border border-purple-200";
    } else {
      return "bg-primary/10 text-primary border border-primary/20";
    }
  };

  const getStatusText = (status: string) => {
    if (status === "pendente") return "Pendente";
    if (status === "erro") return "Erro";
    if (status === "ativa") return "Ativa";
    if (status === "baixa") return "Baixa";
    return status;
  };

  const getStatusColor = (status: string) => {
    if (status === "pendente") return "text-yellow-600 font-semibold";
    if (status === "erro") return "text-red-600 font-semibold";
    if (status === "ativa") return "text-green-600 font-semibold";
    if (status === "baixa") return "text-blue-600 font-semibold";
    return "text-muted-foreground";
  };

  useEffect(() => {
    let mounted = true;

    const fetchPreCadastros = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const user = (await supabase.auth.getUser()).data.user;
        const { data, error } = await supabase
          .from('fichas')
          .select('*')
          .in('status', ['pendente', 'erro'])
          .order('created_at', { ascending: false })
          .range(0, 99);
        if (error) {
          console.error('Erro ao buscar pré-cadastros:', error);
          return;
        }
        if (!mounted) return;
        const mappedCards: ProcessingCard[] = data.map(item => {
          let parsedData = null;
          if (item.url_bucket && (item.url_bucket.startsWith('{') || item.url_bucket.startsWith('['))) {
            try {
              parsedData = JSON.parse(item.url_bucket);
            } catch (e) {
              console.error('Erro ao parsear url_bucket:', e);
            }
          }
          return {
            id: item.id,
            timestamp: item.created_at,
            status: item.status,
            phone: item.telefone_cliente || undefined,
            data: parsedData,
            nome_cliente: item.nome_cliente || undefined,
            codigo_ficha: item.codigo_ficha || undefined,
            tipo: item.tipo || undefined,
            vendedor_id: item.vendedor_id || undefined,
          };
        });
        setCards(mappedCards);
      } catch (error) {
        console.error('Erro ao inicializar:', error);
      }
    };

    const setupRealtime = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const user = (await supabase.auth.getUser()).data.user;

        const channel = supabase.channel('fichas_changes').on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'fichas',
          filter: `vendedor_id=eq.${user?.id}`,
        }, payload => {
          if (!mounted) return;
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as any;
            if (!['pendente', 'erro'].includes(newItem.status)) return;
            let parsedData = null;
            if (newItem.url_bucket && (newItem.url_bucket.startsWith('{') || newItem.url_bucket.startsWith('['))) {
              try { parsedData = JSON.parse(newItem.url_bucket); } catch (e) { console.error(e); }
            }
            const newCard: ProcessingCard = {
              id: newItem.id,
              timestamp: newItem.created_at,
              status: newItem.status,
              phone: newItem.telefone_cliente || undefined,
              data: parsedData,
              nome_cliente: newItem.nome_cliente || undefined,
              codigo_ficha: newItem.codigo_ficha || undefined,
              tipo: newItem.tipo || undefined,
              vendedor_id: newItem.vendedor_id || undefined,
            };
            setCards(prev => [newCard, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new as any;
            let parsedData = null;
            if (updatedItem.url_bucket && (updatedItem.url_bucket.startsWith('{') || updatedItem.url_bucket.startsWith('['))) {
              try { parsedData = JSON.parse(updatedItem.url_bucket); } catch (e) { console.error(e); }
            }
            if (!['pendente', 'erro'].includes(updatedItem.status)) {
              setCards(prev => prev.filter(card => card.id !== updatedItem.id));
              return;
            }
            setCards(prev => {
              const cardIndex = prev.findIndex(card => card.id === updatedItem.id);
              if (cardIndex >= 0) {
                return prev.map(card => card.id === updatedItem.id ? {
                  ...card,
                  status: updatedItem.status,
                  phone: updatedItem.telefone_cliente || undefined,
                  data: parsedData,
                  nome_cliente: updatedItem.nome_cliente || undefined,
                  codigo_ficha: updatedItem.codigo_ficha || undefined,
                  tipo: updatedItem.tipo || undefined,
                } : card);
              } else {
                return [{
                  id: updatedItem.id,
                  timestamp: updatedItem.created_at,
                  status: updatedItem.status,
                  phone: updatedItem.telefone_cliente || undefined,
                  data: parsedData,
                  nome_cliente: updatedItem.nome_cliente || undefined,
                  codigo_ficha: updatedItem.codigo_ficha || undefined,
                  tipo: updatedItem.tipo || undefined,
                  vendedor_id: updatedItem.vendedor_id || undefined,
                }, ...prev];
              }
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedItem = payload.old as any;
            setCards(prev => prev.filter(card => card.id !== deletedItem.id));
          }
        }).subscribe();
        return channel;
      } catch (error) {
        console.error('Erro ao configurar realtime:', error);
        return null;
      }
    };

    fetchPreCadastros();
    const channelPromise = setupRealtime();
    return () => {
      mounted = false;
      channelPromise.then(async channel => {
        if (channel) {
          const { supabase } = await import("@/integrations/supabase/client");
          supabase.removeChannel(channel);
        }
      });
    };
  }, []);

  const handleCardClick = (id: string) => {
    navigate(`/editar-ficha-v3/${id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    setDeletingCardId(cardId);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCardId) return;
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.from('fichas').delete().eq('id', deletingCardId);
      if (error) throw error;
      setCards(prev => prev.filter(card => card.id !== deletingCardId));
    } catch (error) {
      console.error('Erro ao deletar ficha:', error);
    } finally {
      setDeletingCardId(null);
    }
  };

  // Filtragem para abas pendente/erro (cards em memória, busca client-side)
  const filteredCards = cards.filter(card => {
    const statusMatch = card.status === activeFilter;
    let textMatch = true;
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      const nomeMatch = card.nome_cliente?.toLowerCase().includes(searchLower);
      const codigoMatch = card.codigo_ficha?.toLowerCase().includes(searchLower);
      textMatch = !!(nomeMatch || codigoMatch);
    }
    return statusMatch && textMatch;
  });

  const getStatusCount = (status: string) => {
    return cards.filter(c => c.status === status).length;
  };

  const formatDate = (timestamp?: string) =>
    timestamp
      ? new Date(timestamp).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "-";

  const formatValor = (valor?: string | number | null) => {
    if (valor === null || valor === undefined || valor === "") return "-";
    const n = typeof valor === "number" ? valor : parseFloat(String(valor).replace(",", "."));
    if (Number.isNaN(n)) return "-";
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <Header title="Fichas" />

      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <Logo className="w-96 h-96 object-contain" />
      </div>

      <main className="flex-1 p-4 pb-20 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por código ou nome do cliente..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-6">
            <TabsList className="grid w-full grid-cols-3 gap-2 h-auto p-2 bg-muted/50">
              <TabsTrigger value="pendente" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-2 data-[state=active]:border-primary/50 py-2 text-xs">
                Pendente ({getStatusCount("pendente")})
              </TabsTrigger>
              <TabsTrigger value="processada" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-2 data-[state=active]:border-primary/50 py-2 text-xs">
                Processadas
              </TabsTrigger>
              <TabsTrigger value="erro" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-2 data-[state=active]:border-primary/50 py-2 text-xs">
                Erro ({getStatusCount("erro")})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeFilter === "processada" ? (
            <>
              {processadasLoading ? (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </CardContent>
                </Card>
              ) : fichasProcessadas.length === 0 ? (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <p className="text-muted-foreground">
                      {debouncedSearch ? "Nenhum resultado encontrado." : "Nenhuma ficha processada ainda."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {fichasProcessadas.map(ficha => (
                    <Card key={ficha.id} className="transition-all hover:shadow-md cursor-pointer" onClick={() => handleCardClick(ficha.id)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="font-semibold text-sm truncate">
                              {capitalizarNome(ficha.nome_cliente ?? undefined)}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              Código: {ficha.codigo_ficha || "-"}
                            </p>
                            {ficha.vendedor_id && vendedorNomes.get(ficha.vendedor_id) && (
                              <p className="text-xs text-muted-foreground truncate">
                                Vendedor: {vendedorNomes.get(ficha.vendedor_id)}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0 space-y-1 text-center">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(ficha.created_at)}
                            </p>
                            <p className="text-xs font-medium">
                              {formatValor(ficha.valor)}
                            </p>
                          </div>
                          <span className={`flex-shrink-0 inline-block px-2 py-1 text-xs font-medium rounded ${getTipoColor(ficha.tipo ?? undefined)}`}>
                            {ficha.tipo || "-"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <div ref={sentinelRef} className="py-2 flex justify-center">
                    {processadasFetchingNext && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-3">
                {filteredCards.map(card => (
                  <Card key={card.id} className="transition-all hover:shadow-md cursor-pointer" onClick={() => handleCardClick(card.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {capitalizarNome(card.nome_cliente)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Código: {card.codigo_ficha || "-"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Data: {formatDate(card.timestamp)}
                          </p>
                          {card.vendedor_id && vendedorNomes.get(card.vendedor_id) && (
                            <p className="text-xs text-muted-foreground truncate">
                              Vendedor: {vendedorNomes.get(card.vendedor_id)}
                            </p>
                          )}
                          <p className={`text-xs ${getStatusColor(card.status)}`}>
                            Status: {getStatusText(card.status)}
                          </p>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end gap-2">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getTipoColor(card.tipo)}`}>
                            {card.tipo || "-"}
                          </span>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={e => handleDeleteClick(e, card.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredCards.length === 0 && (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <p className="text-muted-foreground">
                      {cards.length === 0 ? "Nenhuma ficha encontrada" : `Nenhuma ficha com status ${activeFilter}`}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>

      <AlertDialog open={!!deletingCardId} onOpenChange={open => !open && setDeletingCardId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ficha? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default Fichas;
