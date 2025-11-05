import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { AudioRecorder } from "@/components/AudioRecorder";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface EditFichaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ficha: any;
  isLoading?: boolean;
  onSuccess: () => void;
}

export function EditFichaModal({ open, onOpenChange, ficha, isLoading = false, onSuccess }: EditFichaModalProps) {
  const [loading, setLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [formData, setFormData] = useState({
    nome_cliente: "",
    telefone_cliente: "",
    codigo_ficha: "",
    tipo: "Aluguel",
    status: "pendente",
    vendedor_responsavel: "",
    data_retirada: undefined as Date | undefined,
    data_devolucao: undefined as Date | undefined,
    data_festa: undefined as Date | undefined,
    valor: "",
    garantia: "",
    paleto: "",
    calca: "",
    camisa: "",
    sapato: "",
    pago: false,
    observacoes_cliente: "",
    tags: [] as string[],
  });

  // Atualiza formData quando ficha mudar
  useEffect(() => {
    const loadData = async () => {
      if (ficha) {
        // Buscar tags do cliente se houver cliente_id
        let clienteTags: string[] = [];
        
        if (ficha.cliente_id) {
          try {
            const { data: relacoes, error } = await supabase
              .from('relacao_cliente_tag')
              .select('id_tag, tags(nome)')
              .eq('id_cliente', ficha.cliente_id);
            
            if (!error && relacoes) {
              clienteTags = relacoes
                .map(r => (r as any).tags?.nome)
                .filter(Boolean);
            }
          } catch (error) {
            console.error('Erro ao buscar tags:', error);
          }
        }
        
        setFormData({
          nome_cliente: ficha.nome_cliente || "",
          telefone_cliente: ficha.telefone_cliente || "",
          codigo_ficha: ficha.codigo_ficha || "",
          tipo: ficha.tipo || "Aluguel",
          status: ficha.status || "pendente",
          vendedor_responsavel: ficha.vendedor_responsavel || "",
          data_retirada: ficha.data_retirada ? new Date(ficha.data_retirada) : undefined,
          data_devolucao: ficha.data_devolucao ? new Date(ficha.data_devolucao) : undefined,
          data_festa: ficha.data_festa ? new Date(ficha.data_festa) : undefined,
          valor: ficha.valor || "",
          garantia: ficha.garantia || "",
          paleto: ficha.paleto || "",
          calca: ficha.calca || "",
          camisa: ficha.camisa || "",
          sapato: ficha.sapato || "",
          pago: ficha.pago || false,
          observacoes_cliente: ficha.transcricao_audio || "",
          tags: clienteTags,
        });
      }
    };
    
    loadData();
  }, [ficha]);

  const handleTranscription = (text: string) => {
    console.log('Texto recebido da transcrição:', text);
    setFormData(prev => ({ ...prev, observacoes_cliente: text }));
  };

  const handleTagsExtracted = (tags: string[]) => {
    // Adicionar novas tags sem duplicatas (lowercase para evitar duplicatas)
    const normalizedTags = tags.map(tag => tag.toLowerCase().trim());
    
    setFormData(prev => {
      const existingTags = prev.tags.map(tag => tag.toLowerCase());
      const newTags = normalizedTags.filter(tag => !existingTags.includes(tag));
      
      if (newTags.length > 0) {
        console.log('Adicionando tags:', newTags);
        return { ...prev, tags: [...prev.tags, ...newTags] };
      }
      return prev;
    });
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Gerenciar cliente: verificar se existe ou criar novo
      let clienteId: string | null = null;
      
      if (formData.telefone_cliente && formData.telefone_cliente.trim() !== '') {
        const telefone = formData.telefone_cliente.trim();
        
        // Buscar cliente existente por telefone
        const { data: clienteExistente, error: searchError } = await supabase
          .from('clientes')
          .select('id')
          .eq('telefone', telefone)
          .maybeSingle();
        
        if (searchError) {
          console.error('Erro ao buscar cliente:', searchError);
          throw searchError;
        }
        
        if (clienteExistente) {
          // Cliente existe - usar ID existente
          console.log('Cliente encontrado:', clienteExistente.id);
          clienteId = clienteExistente.id;
        } else {
          // Cliente não existe - criar novo
          console.log('Cliente não encontrado. Criando novo cliente...');
          
          const user = (await supabase.auth.getUser()).data.user;
          
          const { data: novoCliente, error: insertError } = await supabase
            .from('clientes')
            .insert({
              nome: formData.nome_cliente || 'Cliente sem nome',
              telefone: telefone,
              vendedor_id: user?.id,
            })
            .select('id')
            .single();
          
          if (insertError) {
            console.error('Erro ao criar cliente:', insertError);
            throw insertError;
          }
          
          console.log('Novo cliente criado:', novoCliente.id);
          clienteId = novoCliente.id;
        }
      }

      // Preparar dados de atualização da ficha
      // Mudar status de pendente para ativa ao salvar
      const novoStatus = formData.status === 'pendente' ? 'ativa' : formData.status;
      
      console.log('Status atual:', formData.status);
      console.log('Novo status:', novoStatus);
      
      const updateData: any = {
        nome_cliente: formData.nome_cliente || null,
        telefone_cliente: formData.telefone_cliente || null,
        codigo_ficha: formData.codigo_ficha || null,
        tipo: formData.tipo || null,
        vendedor_responsavel: formData.vendedor_responsavel || null,
        data_retirada: formData.data_retirada ? format(formData.data_retirada, "yyyy-MM-dd") : null,
        data_devolucao: formData.data_devolucao ? format(formData.data_devolucao, "yyyy-MM-dd") : null,
        data_festa: formData.data_festa ? format(formData.data_festa, "yyyy-MM-dd") : null,
        valor: formData.valor ? parseFloat(formData.valor.toString()) : null,
        garantia: formData.garantia ? parseFloat(formData.garantia.toString()) : null,
        paleto: formData.paleto || null,
        calca: formData.calca || null,
        camisa: formData.camisa || null,
        sapato: formData.sapato || null,
        pago: formData.pago,
        transcricao_audio: formData.observacoes_cliente || null,
        cliente_id: clienteId,
        status: novoStatus,
        updated_at: new Date().toISOString(),
      };

      // Atualizar ficha
      const { error } = await supabase
        .from("fichas")
        .update(updateData)
        .eq("id", ficha.id);

      if (error) throw error;

      // Gerenciar tags se houver cliente_id
      if (clienteId && formData.tags.length > 0) {
        console.log('Salvando tags para cliente:', clienteId);
        
        // Criar ou obter IDs das tags
        const tagIds: string[] = [];
        
        for (const tagNome of formData.tags) {
          const tagNomeLower = tagNome.toLowerCase().trim();
          
          // Verificar se a tag já existe
          const { data: tagExistente, error: searchTagError } = await supabase
            .from('tags')
            .select('id')
            .eq('nome', tagNomeLower)
            .maybeSingle();
          
          if (searchTagError) {
            console.error('Erro ao buscar tag:', searchTagError);
            continue;
          }
          
          if (tagExistente) {
            tagIds.push(tagExistente.id);
          } else {
            // Criar nova tag
            const { data: novaTag, error: insertTagError } = await supabase
              .from('tags')
              .insert({ nome: tagNomeLower })
              .select('id')
              .single();
            
            if (insertTagError) {
              console.error('Erro ao criar tag:', insertTagError);
              continue;
            }
            
            if (novaTag) {
              tagIds.push(novaTag.id);
            }
          }
        }
        
        // Deletar relações antigas
        await supabase
          .from('relacao_cliente_tag')
          .delete()
          .eq('id_cliente', clienteId);
        
        // Inserir novas relações
        if (tagIds.length > 0) {
          const relacoes = tagIds.map(tagId => ({
            id_cliente: clienteId,
            id_tag: tagId
          }));
          
          const { error: insertRelacoesError } = await supabase
            .from('relacao_cliente_tag')
            .insert(relacoes);
          
          if (insertRelacoesError) {
            console.error('Erro ao criar relações:', insertRelacoesError);
          }
        }
      }

      toast({
        title: "Sucesso",
        description: clienteId 
          ? "Ficha atualizada e cliente vinculado!" 
          : "Ficha atualizada com sucesso!",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar ficha:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a ficha.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle>Editar Ficha</DialogTitle>
              <DialogDescription>
                Altere os campos necessários e clique em salvar
              </DialogDescription>
            </div>
            {ficha?.url_bucket && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowImageModal(true)}
                className="flex items-center gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Ver Ficha
              </Button>
            )}
          </div>
          
          {/* Banner de processamento */}
          {isLoading && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Processando imagem</p>
                <p className="text-xs text-amber-700 dark:text-amber-300">Os campos serão preenchidos automaticamente quando o processamento terminar. Você já pode editar outros campos enquanto aguarda.</p>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cabeçalho */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Cabeçalho</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coluna 1 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_cliente">Nome</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input
                      id="nome_cliente"
                      value={formData.nome_cliente}
                      onChange={(e) => setFormData({ ...formData, nome_cliente: e.target.value })}
                      placeholder="Nome completo"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone_cliente">Telefone</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input
                      id="telefone_cliente"
                      value={formData.telefone_cliente}
                      onChange={(e) => setFormData({ ...formData, telefone_cliente: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendedor_responsavel">Vendedor Responsável</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input
                      id="vendedor_responsavel"
                      value={formData.vendedor_responsavel}
                      onChange={(e) => setFormData({ ...formData, vendedor_responsavel: e.target.value })}
                      placeholder="Nome do vendedor"
                    />
                  )}
                </div>
              </div>

              {/* Coluna 2 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo_ficha">Código da Ficha</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input
                      id="codigo_ficha"
                      value={formData.codigo_ficha}
                      onChange={(e) => setFormData({ ...formData, codigo_ficha: e.target.value })}
                      placeholder="Código"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Atendimento</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aluguel">Aluguel</SelectItem>
                        <SelectItem value="Venda">Venda</SelectItem>
                        <SelectItem value="Ajuste">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    value={formData.status === "pendente" ? "Pendente" : formData.status === "ativa" ? "Ativa" : formData.status === "erro" ? "Erro" : formData.status}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Datas */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Datas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data de Retirada</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.data_retirada && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.data_retirada ? format(formData.data_retirada, "PPP", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={formData.data_retirada} onSelect={(date) => setFormData({ ...formData, data_retirada: date })} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data de Devolução</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.data_devolucao && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.data_devolucao ? format(formData.data_devolucao, "PPP", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={formData.data_devolucao} onSelect={(date) => setFormData({ ...formData, data_devolucao: date })} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data da Festa</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.data_festa && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.data_festa ? format(formData.data_festa, "PPP", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={formData.data_festa} onSelect={(date) => setFormData({ ...formData, data_festa: date })} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <Separator />

          {/* Peças */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Peças</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paleto">Paletó</Label>
                <Input
                  id="paleto"
                  value={formData.paleto}
                  onChange={(e) => setFormData({ ...formData, paleto: e.target.value })}
                  placeholder="Descrição do paletó"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="calca">Calça</Label>
                <Input
                  id="calca"
                  value={formData.calca}
                  onChange={(e) => setFormData({ ...formData, calca: e.target.value })}
                  placeholder="Descrição da calça"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="camisa">Camisa</Label>
                <Input
                  id="camisa"
                  value={formData.camisa}
                  onChange={(e) => setFormData({ ...formData, camisa: e.target.value })}
                  placeholder="Descrição da camisa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sapato">Sapato</Label>
                <Input
                  id="sapato"
                  value={formData.sapato}
                  onChange={(e) => setFormData({ ...formData, sapato: e.target.value })}
                  placeholder="Descrição do sapato"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Observações sobre o Cliente */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Observações sobre o Cliente</h3>
            <div className="space-y-2">
              <div className="flex items-end justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="observacoes_cliente">Observações</Label>
                  <Textarea
                    id="observacoes_cliente"
                    value={formData.observacoes_cliente}
                    onChange={(e) => setFormData({ ...formData, observacoes_cliente: e.target.value })}
                    placeholder="Digite observações sobre o cliente..."
                    rows={4}
                  />
                </div>
              </div>
              <AudioRecorder 
                onTranscriptionComplete={handleTranscription}
                onTagsExtracted={handleTagsExtracted}
              />
            </div>
          </div>

          {/* Tags do Cliente */}
          {formData.tags.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-base font-semibold">Tags do Cliente</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Pagamento */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Pagamento</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="garantia">Garantia</Label>
                <Input
                  id="garantia"
                  type="number"
                  step="0.01"
                  value={formData.garantia}
                  onChange={(e) => setFormData({ ...formData, garantia: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="pago"
                  checked={formData.pago}
                  onCheckedChange={(checked) => setFormData({ ...formData, pago: checked })}
                />
                <Label htmlFor="pago" className="cursor-pointer">Pago</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal para visualizar a imagem */}
    <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Ficha Original</DialogTitle>
          <DialogDescription>
            Imagem capturada da ficha
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative w-full h-full px-6 pb-6 overflow-auto">
          {ficha?.url_bucket ? (
            <img 
              src={ficha.url_bucket} 
              alt="Ficha original" 
              className="w-full h-auto rounded-lg shadow-lg"
            />
          ) : (
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
              <p className="text-muted-foreground">Imagem não disponível</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
