import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, Calendar, DollarSign, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export default function ClienteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cliente, setCliente] = useState<any>(null);
  const [fichas, setFichas] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
  });

  useEffect(() => {
    const loadClienteData = async () => {
      if (!id) {
        navigate("/clientes");
        return;
      }

      setLoading(true);
      try {
        // Buscar dados do cliente
        const { data: clienteData, error: clienteError } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', id)
          .single();

        if (clienteError) throw clienteError;
        if (!clienteData) {
          navigate("/clientes");
          return;
        }

        setCliente(clienteData);
        setFormData({
          nome: clienteData.nome || "",
          telefone: clienteData.telefone || "",
        });

        // Buscar fichas do cliente
        const { data: fichasData, error: fichasError } = await supabase
          .from('fichas')
          .select('*')
          .eq('cliente_id', id)
          .order('created_at', { ascending: false });

        if (fichasError) throw fichasError;
        setFichas(fichasData || []);
      } catch (error) {
        console.error("Erro ao carregar dados do cliente:", error);
      } finally {
        setLoading(false);
      }
    };

    loadClienteData();
  }, [id, navigate]);

  const handleSave = async () => {
    if (!id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('clientes')
        .update({
          nome: formData.nome,
          telefone: formData.telefone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Recarregar dados do cliente
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (clienteData) {
        setCliente(clienteData);
      }
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="Carregando..." />
        <main className="flex-1 p-4 pb-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Detalhes do Cliente" />

      <main className="flex-1 p-4 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Cabeçalho com botão voltar */}
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/clientes')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Detalhes do Cliente</h1>
          </div>

          {/* Informações do Cliente */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {formData.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-1">{cliente?.nome}</h2>
                  <p className="text-sm text-muted-foreground">
                    Cliente desde {cliente?.created_at ? format(new Date(cliente.created_at), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                  </p>
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Formulário de Edição */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Fichas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Histórico de Fichas</h3>
            
            {fichas.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Nenhuma ficha encontrada para este cliente.</p>
                </CardContent>
              </Card>
            ) : (
              fichas.map((ficha) => (
                <Card 
                  key={ficha.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-all"
                  onClick={() => navigate(`/editar-ficha/${ficha.id}`, { state: { cliente_id: id } })}
                >
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
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
