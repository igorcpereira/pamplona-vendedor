import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Clock, CheckCircle, XCircle } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FichaAtendimento } from "@/components/FichaAtendimento";

interface ProcessingCard {
  id: string;
  timestamp: string;
  status: "processing" | "completed" | "error";
  phone?: string;
  data?: any;
}

const PreCadastro = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<ProcessingCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<ProcessingCard | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("todos");

  useEffect(() => {
    let mounted = true;
    
    // Busca todos os pré-cadastros do banco
    const fetchPreCadastros = async () => {
      try {
        // Importa supabase dinamicamente
        const { supabase } = await import("@/integrations/supabase/client");
        
        const { data, error } = await supabase
          .from('fichas')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar pré-cadastros:', error);
          return;
        }

        if (!mounted) return;

        const mappedCards: ProcessingCard[] = data.map((item) => {
          // Define o status baseado no campo status do banco
          let mappedStatus: "processing" | "completed" | "error" = "processing";
          
          // Se tiver dados processados (nome ou telefone), considera como processado
          if (item.status === 'processado' || (item.nome_cliente && item.telefone_cliente)) {
            mappedStatus = 'completed';
          } else if (item.status === 'erro') {
            mappedStatus = 'error';
          } else if (item.status === 'processando') {
            mappedStatus = 'processing';
          } else if (item.status === 'pendente') {
            mappedStatus = 'processing';
          }
          
          // Tenta fazer parse do url_bucket apenas se parecer um JSON
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
            status: mappedStatus,
            phone: item.telefone_cliente || undefined,
            data: parsedData,
          };
        });

        setCards(mappedCards);
      } catch (error) {
        console.error('Erro ao inicializar:', error);
      }
    };

    const setupRealtime = async () => {
      try {
        // Importa supabase dinamicamente
        const { supabase } = await import("@/integrations/supabase/client");
        
        // Configura realtime para receber updates
        const channel = supabase
          .channel('fichas_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'fichas'
            },
            (payload) => {
              if (!mounted) return;
              
              console.log('Realtime update:', payload);
              
              if (payload.eventType === 'INSERT') {
                const newItem = payload.new as any;
                
                // Define o status baseado no campo status do banco
                let mappedStatus: "processing" | "completed" | "error" = "processing";
                
                if (newItem.status === 'processado' || (newItem.nome_cliente && newItem.telefone_cliente)) {
                  mappedStatus = 'completed';
                } else if (newItem.status === 'erro') {
                  mappedStatus = 'error';
                } else if (newItem.status === 'processando') {
                  mappedStatus = 'processing';
                } else if (newItem.status === 'pendente') {
                  mappedStatus = 'processing';
                }
                
                // Tenta fazer parse do url_bucket apenas se parecer um JSON
                let parsedData = null;
                if (newItem.url_bucket && (newItem.url_bucket.startsWith('{') || newItem.url_bucket.startsWith('['))) {
                  try {
                    parsedData = JSON.parse(newItem.url_bucket);
                  } catch (e) {
                    console.error('Erro ao parsear url_bucket:', e);
                  }
                }
                
                const newCard: ProcessingCard = {
                  id: newItem.id,
                  timestamp: newItem.created_at,
                  status: mappedStatus,
                  phone: newItem.telefone_cliente || undefined,
                  data: parsedData,
                };
                setCards((prev) => [newCard, ...prev]);
              } else if (payload.eventType === 'UPDATE') {
                const updatedItem = payload.new as any;
                
                // Define o status baseado no campo status do banco
                let mappedStatus: "processing" | "completed" | "error" = "processing";
                
                if (updatedItem.status === 'processado' || (updatedItem.nome_cliente && updatedItem.telefone_cliente)) {
                  mappedStatus = 'completed';
                } else if (updatedItem.status === 'erro') {
                  mappedStatus = 'error';
                } else if (updatedItem.status === 'processando') {
                  mappedStatus = 'processing';
                } else if (updatedItem.status === 'pendente') {
                  mappedStatus = 'processing';
                }
                
                // Tenta fazer parse do url_bucket apenas se parecer um JSON
                let parsedData = null;
                if (updatedItem.url_bucket && (updatedItem.url_bucket.startsWith('{') || updatedItem.url_bucket.startsWith('['))) {
                  try {
                    parsedData = JSON.parse(updatedItem.url_bucket);
                  } catch (e) {
                    console.error('Erro ao parsear url_bucket:', e);
                  }
                }
                
                setCards((prev) =>
                  prev.map((card) =>
                    card.id === updatedItem.id
                      ? {
                          ...card,
                          status: mappedStatus,
                          phone: updatedItem.telefone_cliente || undefined,
                          data: parsedData,
                        }
                      : card
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                const deletedItem = payload.old as any;
                setCards((prev) => prev.filter((card) => card.id !== deletedItem.id));
              }
            }
          )
          .subscribe();

        return channel;
      } catch (error) {
        console.error('Erro ao configurar realtime:', error);
        return null;
      }
    };

    fetchPreCadastros();
    let channelPromise = setupRealtime();

    return () => {
      mounted = false;
      channelPromise.then(async (channel) => {
        if (channel) {
          const { supabase } = await import("@/integrations/supabase/client");
          supabase.removeChannel(channel);
        }
      });
    };
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCardClick = (card: ProcessingCard) => {
    if (card.status === "completed" && card.data) {
      setSelectedCard(card);
    }
  };

  const filteredCards = cards.filter((card) => {
    if (activeFilter === "todos") return true;
    if (activeFilter === "pendente") return card.status === "processing";
    if (activeFilter === "processado") return card.status === "completed";
    if (activeFilter === "erro") return card.status === "error";
    return true;
  });

  const getStatusCount = (status: string) => {
    if (status === "todos") return cards.length;
    if (status === "pendente") return cards.filter(c => c.status === "processing").length;
    if (status === "processado") return cards.filter(c => c.status === "completed").length;
    if (status === "erro") return cards.filter(c => c.status === "error").length;
    return 0;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Fichas" />
      
      <main className="flex-1 p-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Fichas</h1>
            <p className="text-sm text-muted-foreground">
              Aguardando processamento das imagens
            </p>
          </div>

          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-6">
            <TabsList className="grid w-full grid-cols-2 gap-2 h-auto p-2 bg-muted/50">
              <TabsTrigger 
                value="todos"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-2 data-[state=active]:border-primary/50 py-2 text-xs"
              >
                Todos ({getStatusCount("todos")})
              </TabsTrigger>
              <TabsTrigger 
                value="pendente"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-2 data-[state=active]:border-primary/50 py-2 text-xs"
              >
                Pendente ({getStatusCount("pendente")})
              </TabsTrigger>
              <TabsTrigger 
                value="processado"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-2 data-[state=active]:border-primary/50 py-2 text-xs"
              >
                Processado ({getStatusCount("processado")})
              </TabsTrigger>
              <TabsTrigger 
                value="erro"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-2 data-[state=active]:border-primary/50 py-2 text-xs"
              >
                Erro ({getStatusCount("erro")})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-2 gap-3">
            {filteredCards.map((card) => (
              <Card
                key={card.id}
                className={`transition-all hover:shadow-md ${
                  card.status === "completed" ? "cursor-pointer" : ""
                }`}
                onClick={() => handleCardClick(card)}
              >
                <CardContent className="p-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm truncate">
                      {card.status === "completed" && card.data ? (
                        card.data?.fields?.Cabecalho?.nome || 
                        card.data?.fields?.Cabecalho?.cliente_nome || 
                        card.data?.[0]?.fields?.Cabecalho?.nome ||
                        "Sem nome"
                      ) : (
                        "Processando..."
                      )}
                    </p>
                    
                    <p className="text-xs text-muted-foreground">
                      #{card.id.slice(0, 8)}
                    </p>
                    
                    <p className="text-xs text-muted-foreground">
                      {new Date(card.timestamp).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit"
                      })}
                    </p>

                    <div className="flex items-center gap-1 mt-2">
                      {card.status === "processing" && (
                        <>
                          <Clock className="h-3 w-3 text-muted-foreground animate-pulse" />
                          <span className="text-xs text-muted-foreground">Processando</span>
                        </>
                      )}
                      {card.status === "completed" && (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600">Processado</span>
                        </>
                      )}
                      {card.status === "error" && (
                        <>
                          <XCircle className="h-3 w-3 text-destructive" />
                          <span className="text-xs text-destructive">Erro</span>
                        </>
                      )}
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
                  {cards.length === 0 
                    ? "Nenhuma ficha encontrada" 
                    : `Nenhuma ficha ${activeFilter === "todos" ? "" : activeFilter}`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Ficha de Atendimento</DialogTitle>
            <DialogDescription>
              Dados extraídos da imagem
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[70vh]">
            {selectedCard?.data && (
              <FichaAtendimento data={selectedCard.data} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default PreCadastro;
