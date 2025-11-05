import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FichaAtendimento } from "@/components/FichaAtendimento";
import { EditFichaModal } from "@/components/EditFichaModal";
import { capitalizarNome } from "@/lib/utils";

interface ProcessingCard {
  id: string;
  timestamp: string;
  status: "processing" | "error";
  phone?: string;
  data?: any;
  nome_cliente?: string;
  codigo_ficha?: string;
  tipo?: string;
}

const PreCadastro = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<ProcessingCard[]>([]);
  const [editingCard, setEditingCard] = useState<ProcessingCard | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("todos");

  const getTipoColor = (tipo?: string) => {
    if (!tipo) return "bg-muted text-muted-foreground";
    
    const tipoLower = tipo.toLowerCase();
    
    if (tipoLower.includes("aluguel") || tipoLower.includes("alugar")) {
      return "bg-blue-100 text-blue-700 border border-blue-200";
    } else if (tipoLower.includes("venda") || tipoLower.includes("vender")) {
      return "bg-green-100 text-green-700 border border-green-200";
    } else if (tipoLower.includes("reparo") || tipoLower.includes("conserto") || tipoLower.includes("ajuste")) {
      return "bg-orange-100 text-orange-700 border border-orange-200";
    } else if (tipoLower.includes("prova")) {
      return "bg-purple-100 text-purple-700 border border-purple-200";
    } else {
      return "bg-primary/10 text-primary border border-primary/20";
    }
  };

  const getStatusText = (status: "processing" | "error") => {
    if (status === "processing") return "Pendente";
    if (status === "error") return "Erro";
    return "-";
  };

  const getStatusColor = (status: "processing" | "error") => {
    if (status === "processing") return "text-yellow-600 font-semibold";
    if (status === "error") return "text-red-600 font-semibold";
    return "text-muted-foreground";
  };

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
          let mappedStatus: "processing" | "error" = "processing";
          
          if (item.status === 'erro') {
            mappedStatus = 'error';
          } else {
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
            nome_cliente: item.nome_cliente || undefined,
            codigo_ficha: item.codigo_ficha || undefined,
            tipo: item.tipo || undefined,
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
                let mappedStatus: "processing" | "error" = "processing";
                
                if (newItem.status === 'erro') {
                  mappedStatus = 'error';
                } else {
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
                  nome_cliente: newItem.nome_cliente || undefined,
                  codigo_ficha: newItem.codigo_ficha || undefined,
                  tipo: newItem.tipo || undefined,
                };
                setCards((prev) => [newCard, ...prev]);
              } else if (payload.eventType === 'UPDATE') {
                const updatedItem = payload.new as any;
                
                // Define o status baseado no campo status do banco
                let mappedStatus: "processing" | "error" = "processing";
                
                if (updatedItem.status === 'erro') {
                  mappedStatus = 'error';
                } else {
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
                          nome_cliente: updatedItem.nome_cliente || undefined,
                          codigo_ficha: updatedItem.codigo_ficha || undefined,
                          tipo: updatedItem.tipo || undefined,
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
    setEditingCard(card);
  };

  const handleEditSuccess = async () => {
    // Recarrega os dados após edição
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      const { data, error } = await supabase
        .from('fichas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar pré-cadastros:', error);
        return;
      }

      const mappedCards: ProcessingCard[] = data.map((item) => {
        let mappedStatus: "processing" | "error" = "processing";
        
        if (item.status === 'erro') {
          mappedStatus = 'error';
        } else {
          mappedStatus = 'processing';
        }
        
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
          nome_cliente: item.nome_cliente || undefined,
          codigo_ficha: item.codigo_ficha || undefined,
          tipo: item.tipo || undefined,
        };
      });

      setCards(mappedCards);
    } catch (error) {
      console.error('Erro ao recarregar dados:', error);
    }
  };

  const filteredCards = cards.filter((card) => {
    if (activeFilter === "todos") return true;
    if (activeFilter === "pendente") return card.status === "processing";
    if (activeFilter === "erro") return card.status === "error";
    return true;
  });

  const getStatusCount = (status: string) => {
    if (status === "todos") return cards.length;
    if (status === "pendente") return cards.filter(c => c.status === "processing").length;
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
            <TabsList className="grid w-full grid-cols-3 gap-2 h-auto p-2 bg-muted/50">
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
                value="erro"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-2 data-[state=active]:border-primary/50 py-2 text-xs"
              >
                Erro ({getStatusCount("erro")})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-3">
            {filteredCards.map((card) => (
              <Card
                key={card.id}
                className="transition-all hover:shadow-md cursor-pointer"
                onClick={() => handleCardClick(card)}
              >
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
                        Data: {card.timestamp ? new Date(card.timestamp).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric"
                        }) : "-"}
                      </p>

                      <p className={`text-xs ${getStatusColor(card.status)}`}>
                        Status: {getStatusText(card.status)}
                      </p>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getTipoColor(card.tipo)}`}>
                        {card.tipo || "-"}
                      </span>
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

      <EditFichaModal
        open={!!editingCard}
        onOpenChange={(open) => !open && setEditingCard(null)}
        ficha={editingCard}
        onSuccess={handleEditSuccess}
      />

      <BottomNav />
    </div>
  );
};

export default PreCadastro;
