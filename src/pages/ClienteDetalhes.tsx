import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, DollarSign, Save, Loader2, Scissors, Package, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseDataSemFuso } from "@/lib/utils";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

type ProvaInfo = { id: string; created_at: string };
type ItemAvulsoAgg = { tipo_item: string; quantidade: number };

export default function ClienteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cliente, setCliente] = useState<any>(null);
  const [fichas, setFichas] = useState<any[]>([]);
  const [provasByFichaId, setProvasByFichaId] = useState<Map<string, ProvaInfo[]>>(new Map());
  const [itensByFichaId, setItensByFichaId] = useState<Map<string, ItemAvulsoAgg[]>>(new Map());
  const [vendedorNomes, setVendedorNomes] = useState<Map<string, string>>(new Map());
  const [formData, setFormData] = useState({ nome: "", telefone: "" });

  useEffect(() => {
    const loadClienteData = async () => {
      if (!id) { navigate("/clientes"); return; }
      setLoading(true);
      try {
        const { data: clienteData, error: clienteError } = await supabase
          .from('clientes').select('*').eq('id', id).single();
        if (clienteError) throw clienteError;
        if (!clienteData) { navigate("/clientes"); return; }

        setCliente(clienteData);
        setFormData({ nome: clienteData.nome || "", telefone: clienteData.telefone || "" });

        const { data: fichasData, error: fichasError } = await supabase
          .from('fichas').select('*').eq('cliente_id', id).order('created_at', { ascending: false });
        if (fichasError) throw fichasError;
        const loadedFichas = fichasData || [];
        setFichas(loadedFichas);

        if (loadedFichas.length > 0) {
          const fichaIds = loadedFichas.map((f: any) => f.id);
          const vendedorIds = [...new Set(
            loadedFichas.map((f: any) => f.vendedor_id).filter(Boolean)
          )] as string[];

          const [provasRes, itensRes, profilesRes] = await Promise.all([
            supabase.from('provas').select('id, ficha_id, created_at').in('ficha_id', fichaIds).order('created_at'),
            supabase.from('itens_avulsos_ficha').select('ficha_id, tipo_item, quantidade').in('ficha_id', fichaIds),
            vendedorIds.length > 0
              ? supabase.from('profiles').select('id, nome').in('id', vendedorIds)
              : Promise.resolve({ data: [] as any[], error: null }),
          ]);

          const provasMap = new Map<string, ProvaInfo[]>();
          for (const p of (provasRes.data ?? [])) {
            const arr = provasMap.get(p.ficha_id) ?? [];
            arr.push({ id: p.id, created_at: p.created_at });
            provasMap.set(p.ficha_id, arr);
          }
          setProvasByFichaId(provasMap);

          const itensAggMap = new Map<string, Map<string, number>>();
          for (const item of (itensRes.data ?? [])) {
            const tipoMap = itensAggMap.get(item.ficha_id) ?? new Map<string, number>();
            tipoMap.set(item.tipo_item, (tipoMap.get(item.tipo_item) ?? 0) + item.quantidade);
            itensAggMap.set(item.ficha_id, tipoMap);
          }
          const itensFinal = new Map<string, ItemAvulsoAgg[]>();
          for (const [fichaId, tipoMap] of itensAggMap.entries()) {
            itensFinal.set(fichaId,
              Array.from(tipoMap.entries())
                .filter(([, qty]) => qty > 0)
                .map(([tipo_item, quantidade]) => ({ tipo_item, quantidade }))
            );
          }
          setItensByFichaId(itensFinal);

          const nomesMap = new Map<string, string>();
          for (const p of (profilesRes.data ?? [])) {
            nomesMap.set(p.id, p.nome || "");
          }
          setVendedorNomes(nomesMap);
        }
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
        .update({ nome: formData.nome, telefone: formData.telefone, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      const { data: clienteData } = await supabase.from('clientes').select('*').eq('id', id).single();
      if (clienteData) setCliente(clienteData);
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
    } finally {
      setSaving(false);
    }
  };

  const getTipoColor = (tipo?: string) => {
    if (!tipo) return "bg-muted text-muted-foreground";
    switch (tipo.toLowerCase()) {
      case "aluguel": return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "venda": return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "ajuste": return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatValor = (v?: any) => {
    if (v === null || v === undefined || v === "") return null;
    const n = parseFloat(String(v).replace(",", "."));
    if (Number.isNaN(n)) return null;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  };

  const joinParts = (...parts: (string | null | undefined)[]) =>
    parts.filter(Boolean).join(" · ");

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
          <div className="mb-6 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Detalhes do Cliente</h1>
          </div>

          {/* Informações do Cliente */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <Avatar className="w-20 h-20">
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

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Nome completo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} placeholder="(00) 00000-0000" />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full">
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
              fichas.map((ficha) => {
                const provas = provasByFichaId.get(ficha.id) ?? [];
                const itens = itensByFichaId.get(ficha.id) ?? [];
                const vendedorNome = ficha.vendedor_id ? vendedorNomes.get(ficha.vendedor_id) : undefined;
                const isNaoAtiva = ficha.status === 'pendente' || ficha.status === 'erro';

                const paletoParts = joinParts(ficha.paleto ? `Paletó ${ficha.paleto}` : null, ficha.paleto_cor, ficha.paleto_lanificio);
                const calcaParts = ficha.calca ? `Calça ${ficha.calca}` : null;
                const camisaParts = joinParts(ficha.camisa ? `Camisa ${ficha.camisa}` : null, ficha.camisa_fios ? `${ficha.camisa_fios} fios` : null, ficha.camisa_cor);
                const sapatoParts = joinParts(ficha.sapato ? `Sapato ${ficha.sapato}` : null, ficha.sapato_tipo);

                const hasItemDetails = !!(paletoParts || calcaParts || camisaParts || sapatoParts);
                const hasValores = !!(ficha.valor || ficha.garantia);
                const hasDatas = !!(ficha.data_retirada || ficha.data_devolucao || ficha.data_festa);

                return (
                  <Card
                    key={ficha.id}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-all"
                    onClick={() => navigate(`/editar-ficha-v3/${ficha.id}`, { state: { cliente_id: id } })}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">
                              #{ficha.codigo_ficha || "Sem código"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Criado em {format(new Date(ficha.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                            {vendedorNome && (
                              <div className="flex items-center gap-1 mt-1">
                                <User className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{vendedorNome}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5 items-end">
                            <Badge className={getTipoColor(ficha.tipo)}>
                              {ficha.tipo || "N/A"}
                            </Badge>
                            {isNaoAtiva && (
                              <Badge className={ficha.status === 'pendente' ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}>
                                {ficha.status === 'pendente' ? 'Pendente' : 'Erro'}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Datas */}
                        {hasDatas && (
                          <>
                            <Separator />
                            <div className="space-y-1.5">
                              {ficha.data_retirada && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Calendar className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Retirada:</span>
                                  <span className="font-medium">{format(parseDataSemFuso(ficha.data_retirada)!, "dd/MM/yyyy", { locale: ptBR })}</span>
                                </div>
                              )}
                              {ficha.data_devolucao && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Calendar className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Devolução:</span>
                                  <span className="font-medium">{format(parseDataSemFuso(ficha.data_devolucao)!, "dd/MM/yyyy", { locale: ptBR })}</span>
                                </div>
                              )}
                              {ficha.data_festa && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Calendar className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Festa:</span>
                                  <span className="font-medium">{format(parseDataSemFuso(ficha.data_festa)!, "dd/MM/yyyy", { locale: ptBR })}</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {/* Peças com detalhes */}
                        {hasItemDetails && (
                          <>
                            <Separator />
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Peças:</p>
                              <div className="space-y-0.5 text-xs">
                                {paletoParts && <p className="truncate">{paletoParts}</p>}
                                {calcaParts && <p className="truncate">{calcaParts}</p>}
                                {camisaParts && <p className="truncate">{camisaParts}</p>}
                                {sapatoParts && <p className="truncate">{sapatoParts}</p>}
                              </div>
                            </div>
                          </>
                        )}

                        {/* Provas */}
                        {provas.length > 0 && (
                          <>
                            <Separator />
                            <div className="flex items-start gap-1.5">
                              <Scissors className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <p className="text-xs">
                                <span className="text-muted-foreground">Provas ({provas.length}): </span>
                                {provas.map(p => format(new Date(p.created_at), "dd/MM", { locale: ptBR })).join(" · ")}
                              </p>
                            </div>
                          </>
                        )}

                        {/* Itens avulsos */}
                        {itens.length > 0 && (
                          <>
                            <Separator />
                            <div className="flex items-start gap-1.5">
                              <Package className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <p className="text-xs">
                                <span className="text-muted-foreground">Avulsos: </span>
                                {itens.map(i => `${i.tipo_item} (${i.quantidade})`).join(" · ")}
                              </p>
                            </div>
                          </>
                        )}

                        {/* Valores e pagamento */}
                        {hasValores && (
                          <>
                            <Separator />
                            <div className="space-y-1.5">
                              {ficha.valor && (
                                <div className="flex items-center gap-2 text-xs">
                                  <DollarSign className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Valor:</span>
                                  <span className="font-medium">{formatValor(ficha.valor)}</span>
                                </div>
                              )}
                              {ficha.garantia && (
                                <div className="flex items-center gap-2 text-xs">
                                  <DollarSign className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Garantia:</span>
                                  <span className="font-medium">{formatValor(ficha.garantia)}</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {/* Pagamento */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-muted-foreground">Pagamento:</span>
                          <Badge variant={ficha.pago ? "default" : "secondary"}>
                            {ficha.pago ? "Pago" : "Pendente"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
