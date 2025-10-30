import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const [cards, setCards] = useState<ProcessingCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<ProcessingCard | null>(null);

  useEffect(() => {
    // Recebe os dados da navegação
    const state = location.state as { timestamp: string; webhookData?: any } | null;
    
    if (state?.timestamp) {
      const newCard: ProcessingCard = {
        id: state.timestamp,
        timestamp: state.timestamp,
        status: state.webhookData ? "completed" : "processing",
        phone: state.webhookData?.fields?.Cabecalho?.telefone,
        data: state.webhookData,
      };
      
      setCards((prev) => [newCard, ...prev]);
      
      // Se ainda está processando, verifica periodicamente no sessionStorage
      if (!state.webhookData) {
        const checkInterval = setInterval(() => {
          const stored = sessionStorage.getItem(`webhook_result_${state.timestamp}`);
          if (stored) {
            const { data } = JSON.parse(stored);
            setCards((prev) =>
              prev.map((card) =>
                card.id === state.timestamp
                  ? {
                      ...card,
                      status: "completed",
                      phone: data?.fields?.Cabecalho?.telefone || "N/A",
                      data: data,
                    }
                  : card
              )
            );
            sessionStorage.removeItem(`webhook_result_${state.timestamp}`);
            clearInterval(checkInterval);
          }
        }, 500);
        
        // Limpa o intervalo após 2 minutos
        setTimeout(() => clearInterval(checkInterval), 120000);
        
        return () => clearInterval(checkInterval);
      }
    }
  }, [location.state]);

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
                    <span>Cadastro</span>
                    {card.status === "processing" && (
                      <Clock className="h-5 w-5 text-muted-foreground animate-pulse" />
                    )}
                    {card.status === "completed" && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
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
