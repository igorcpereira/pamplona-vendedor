import { useState, useEffect } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Users, Phone, ChevronRight, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Clients = () => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [fichasCliente, setFichasCliente] = useState<any[]>([]);
  const [loadingFichas, setLoadingFichas] = useState(false);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('vendedor_id', user?.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setClientes(data || []);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClientes();
  }, []);

  const handleClienteClick = async (cliente: any) => {
    setSelectedCliente(cliente);
    setLoadingFichas(true);
    
    try {
      const { data, error } = await supabase
        .from('fichas')
        .select('*')
        .eq('cliente_id', cliente.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setFichasCliente(data || []);
    } catch (error) {
      console.error('Erro ao buscar fichas do cliente:', error);
      setFichasCliente([]);
    } finally {
      setLoadingFichas(false);
    }
  };

  const getTipoColor = (tipo?: string) => {
    if (!tipo) return "bg-muted text-muted-foreground";
    
    switch (tipo.toLowerCase()) {
      case "aluguel":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "venda":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "ajuste":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "pendente":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
      case "ativa":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "erro":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Clientes" />
      
      <main className="px-4 py-6 max-w-md mx-auto">
        {loading ? (
          <div className="bg-card rounded-2xl p-12 text-center shadow-sm">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="bg-card rounded-2xl p-12 text-center shadow-sm">
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
          <div className="space-y-3">
            {clientes.map((cliente) => (
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
                          <p className="text-xs">{cliente.telefone}</p>
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
      </main>

      {/* Modal de Fichas do Cliente */}
      <Dialog open={!!selectedCliente} onOpenChange={(open) => !open && setSelectedCliente(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fichas de {selectedCliente?.nome}</DialogTitle>
            <DialogDescription>
              {selectedCliente?.telefone && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  <span className="text-xs">{selectedCliente.telefone}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {loadingFichas ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">Carregando fichas...</p>
              </div>
            ) : fichasCliente.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">Nenhuma ficha encontrada para este cliente.</p>
              </div>
            ) : (
              fichasCliente.map((ficha) => (
                <Card key={ficha.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header com Código e Tipo */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">
                            #{ficha.codigo_ficha || "Sem código"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Criado em {format(new Date(ficha.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5 items-end">
                          <Badge className={getTipoColor(ficha.tipo)}>
                            {ficha.tipo || "N/A"}
                          </Badge>
                          <Badge className={getStatusColor(ficha.status)}>
                            {ficha.status === "pendente" ? "Pendente" : ficha.status === "ativa" ? "Ativa" : "Erro"}
                          </Badge>
                        </div>
                      </div>

                      <Separator />

                      {/* Datas */}
                      {(ficha.data_retirada || ficha.data_devolucao || ficha.data_festa) && (
                        <div className="space-y-1.5">
                          {ficha.data_retirada && (
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Retirada:</span>
                              <span className="font-medium">{format(new Date(ficha.data_retirada), "dd/MM/yyyy", { locale: ptBR })}</span>
                            </div>
                          )}
                          {ficha.data_devolucao && (
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Devolução:</span>
                              <span className="font-medium">{format(new Date(ficha.data_devolucao), "dd/MM/yyyy", { locale: ptBR })}</span>
                            </div>
                          )}
                          {ficha.data_festa && (
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Festa:</span>
                              <span className="font-medium">{format(new Date(ficha.data_festa), "dd/MM/yyyy", { locale: ptBR })}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Valores */}
                      {(ficha.valor || ficha.garantia) && (
                        <>
                          <Separator />
                          <div className="space-y-1.5">
                            {ficha.valor && (
                              <div className="flex items-center gap-2 text-xs">
                                <DollarSign className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Valor:</span>
                                <span className="font-medium">R$ {parseFloat(ficha.valor).toFixed(2)}</span>
                              </div>
                            )}
                            {ficha.garantia && (
                              <div className="flex items-center gap-2 text-xs">
                                <DollarSign className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Garantia:</span>
                                <span className="font-medium">R$ {parseFloat(ficha.garantia).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Peças */}
                      {(ficha.paleto || ficha.calca || ficha.camisa || ficha.sapato) && (
                        <>
                          <Separator />
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Peças:</p>
                            <div className="grid grid-cols-2 gap-1.5 text-xs">
                              {ficha.paleto && (
                                <div className="truncate">
                                  <span className="text-muted-foreground">Paletó:</span> {ficha.paleto}
                                </div>
                              )}
                              {ficha.calca && (
                                <div className="truncate">
                                  <span className="text-muted-foreground">Calça:</span> {ficha.calca}
                                </div>
                              )}
                              {ficha.camisa && (
                                <div className="truncate">
                                  <span className="text-muted-foreground">Camisa:</span> {ficha.camisa}
                                </div>
                              )}
                              {ficha.sapato && (
                                <div className="truncate">
                                  <span className="text-muted-foreground">Sapato:</span> {ficha.sapato}
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Status de Pagamento */}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-muted-foreground">Pagamento:</span>
                        <Badge variant={ficha.pago ? "default" : "secondary"}>
                          {ficha.pago ? "Pago" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Clients;
