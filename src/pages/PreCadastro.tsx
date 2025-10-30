import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Clock, CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  useEffect(() => {
    let mounted = true;
    
    // Busca todos os pré-cadastros do banco
    const fetchPreCadastros = async () => {
      try {
        // Importa supabase dinamicamente
        const { supabase } = await import("@/integrations/supabase/client");
        
        const { data, error } = await supabase
          .from('pre_cadastros')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar pré-cadastros:', error);
          return;
        }

        if (!mounted) return;

        const mappedCards: ProcessingCard[] = data.map((item) => ({
          id: item.id,
          timestamp: item.timestamp,
          status: item.status as "processing" | "completed" | "error",
          phone: item.phone || undefined,
          data: item.webhook_data,
        }));

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
          .channel('pre_cadastros_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'pre_cadastros'
            },
            (payload) => {
              if (!mounted) return;
              
              console.log('Realtime update:', payload);
              
              if (payload.eventType === 'INSERT') {
                const newItem = payload.new as any;
                const newCard: ProcessingCard = {
                  id: newItem.id,
                  timestamp: newItem.timestamp,
                  status: newItem.status,
                  phone: newItem.phone || undefined,
                  data: newItem.webhook_data,
                };
                setCards((prev) => [newCard, ...prev]);
              } else if (payload.eventType === 'UPDATE') {
                const updatedItem = payload.new as any;
                setCards((prev) =>
                  prev.map((card) =>
                    card.id === updatedItem.id
                      ? {
                          ...card,
                          status: updatedItem.status,
                          phone: updatedItem.phone || undefined,
                          data: updatedItem.webhook_data,
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Pré-Cadastros" />
      
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/novo")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Pré-Cadastros</h1>
              <p className="text-muted-foreground">
                Aguardando processamento das imagens
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <Card
                key={card.id}
                className={`transition-all hover:shadow-lg ${
                  card.status === "completed" ? "cursor-pointer" : ""
                }`}
                onClick={() => handleCardClick(card)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="truncate">
                      {card.status === "completed" && card.data ? (
                        card.data?.fields?.Cabecalho?.nome || 
                        card.data?.fields?.Cabecalho?.cliente_nome || 
                        card.data?.[0]?.fields?.Cabecalho?.nome ||
                        "Cadastro"
                      ) : (
                        "Cadastro"
                      )}
                    </span>
                    {card.status === "processing" && (
                      <Clock className="h-5 w-5 text-muted-foreground animate-pulse flex-shrink-0" />
                    )}
                    {card.status === "completed" && (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {formatTimestamp(card.timestamp)}
                    </p>
                    
                    {card.status === "processing" && (
                      <div className="py-4">
                        <p className="text-center text-lg font-medium text-muted-foreground animate-pulse">
                          Aguarde...
                        </p>
                        <p className="text-center text-xs text-muted-foreground mt-2">
                          Processando imagem
                        </p>
                      </div>
                    )}
                    
                    {card.status === "completed" && card.phone && (
                      <div className="py-2">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                          <Phone className="h-5 w-5 text-primary" />
                          <span>{card.phone}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Clique para ver detalhes
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {cards.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Nenhum pré-cadastro em processamento
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/novo")}
                >
                  Enviar Nova Imagem
                </Button>
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
