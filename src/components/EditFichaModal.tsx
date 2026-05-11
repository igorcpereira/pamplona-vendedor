import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Image as ImageIcon, Plus, Minus, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, parseDataSemFuso, formatarDataParaBanco } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useItensAvulsosFicha, useSalvarItensAvulsos, TIPOS_ITEM_AVULSO, type ItemAvulso } from "@/hooks/useItensAvulsosFicha";
import { useVendedoresUnidade } from "@/hooks/useVendedoresUnidade";

interface EditFichaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ficha: any;
  isLoading?: boolean;
  onSuccess: () => void;
}

const TIPO_LABEL: Record<string, string> = {
  camiseta: 'Camiseta',
  gravata: 'Gravata',
  sapato: 'Sapato',
  meia: 'Meia',
  cinto: 'Cinto',
};

export function EditFichaModal({ open, onOpenChange, ficha, isLoading = false, onSuccess }: EditFichaModalProps) {
  const { user, profile, activeUnidade } = useAuth();
  const isAdmin = activeUnidade?.role === 'administrativo';

  const [loading, setLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);
  const [tagsPadrao, setTagsPadrao] = useState<{ id: string; nome: string }[]>([]);
  const [fichaVendedorId, setFichaVendedorId] = useState<string | undefined>(undefined);
  const [avulsosVendedorId, setAvulsosVendedorId] = useState<string | undefined>(undefined);
  const [itens, setItens] = useState<ItemAvulso[]>([]);

  const { data: vendedores = [] } = useVendedoresUnidade();

  const resolvedAvulsosVendedorId = avulsosVendedorId ?? user?.id;
  const fichaId = ficha?.id as string | undefined;
  const { data: itensDB = [] } = useItensAvulsosFicha(fichaId, resolvedAvulsosVendedorId);
  const salvarItens = useSalvarItensAvulsos(fichaId, resolvedAvulsosVendedorId);

  const [formData, setFormData] = useState({
    nome_cliente: "",
    telefone_cliente: "",
    codigo_ficha: "",
    tipo: "Aluguel",
    status: "pendente",
    data_retirada: undefined as Date | undefined,
    data_devolucao: undefined as Date | undefined,
    data_festa: undefined as Date | undefined,
    valor: "",
    garantia: "",
    paleto: "",
    calca: "",
    camisa: "",
    sapato: "",
    paleto_cor: null as string | null,
    paleto_lanificio: null as string | null,
    camisa_fios: null as string | null,
    camisa_cor: null as string | null,
    sapato_tipo: null as string | null,
    pago: false,
    tags: [] as string[],
  });

  useEffect(() => {
    setItens(itensDB);
  }, [itensDB]);

  useEffect(() => {
    supabase
      .from('tags')
      .select('id, nome')
      .eq('padrao', true)
      .order('nome')
      .then(({ data }) => {
        if (data) setTagsPadrao(data as { id: string; nome: string }[]);
      });
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!ficha) return;

      setFichaVendedorId(ficha.vendedor_id ?? user?.id);

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
        data_retirada: parseDataSemFuso(ficha.data_retirada),
        data_devolucao: parseDataSemFuso(ficha.data_devolucao),
        data_festa: parseDataSemFuso(ficha.data_festa),
        valor: ficha.valor || "",
        garantia: ficha.garantia || "",
        paleto: ficha.paleto || "",
        calca: ficha.calca || "",
        camisa: ficha.camisa || "",
        sapato: ficha.sapato || "",
        paleto_cor: ficha.paleto_cor || null,
        paleto_lanificio: ficha.paleto_lanificio || null,
        camisa_fios: ficha.camisa_fios || null,
        camisa_cor: ficha.camisa_cor || null,
        sapato_tipo: ficha.sapato_tipo || null,
        pago: ficha.pago || false,
        tags: clienteTags,
      });
    };

    loadData();
  }, [ficha]);

  const handleToggleTag = (tagNome: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagNome)
        ? prev.tags.filter(t => t !== tagNome)
        : [...prev.tags, tagNome],
    }));
  };

  const handleQuantChange = (tipo: string, delta: number) => {
    setItens(prev =>
      prev.map(item =>
        item.tipo_item === tipo
          ? { ...item, quantidade: Math.max(0, item.quantidade + delta) }
          : item
      )
    );
  };

  const handleValorUnitarioChange = (tipo: string, valor: string) => {
    const num = valor ? parseFloat(valor.replace(',', '.')) : null;
    setItens(prev =>
      prev.map(item =>
        item.tipo_item === tipo
          ? { ...item, valor_unitario: num !== null && !isNaN(num) ? num : null }
          : item
      )
    );
  };

  const handleSalvarItens = async () => {
    try {
      await salvarItens.mutateAsync(itens);
      toast({ title: "Peças avulsas salvas" });
    } catch (err) {
      toast({
        title: "Erro ao salvar peças avulsas",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let clienteId: string | null = null;

      if (formData.telefone_cliente && formData.telefone_cliente.trim() !== '') {
        const telefone = formData.telefone_cliente.trim();

        const { data: clienteExistente, error: searchError } = await supabase
          .from('clientes')
          .select('id')
          .eq('telefone', telefone)
          .maybeSingle();

        if (searchError) throw searchError;

        if (clienteExistente) {
          clienteId = clienteExistente.id;
        } else {
          const authUser = (await supabase.auth.getUser()).data.user;
          const { data: novoCliente, error: insertError } = await supabase
            .from('clientes')
            .insert({
              nome: formData.nome_cliente || 'Cliente sem nome',
              telefone: telefone,
              vendedor_id: authUser?.id,
            })
            .select('id')
            .single();

          if (insertError) throw insertError;
          clienteId = novoCliente.id;
        }
      }

      const novoStatus = formData.status === 'pendente' ? 'ativa' : formData.status;

      const updateData: any = {
        nome_cliente: formData.nome_cliente || null,
        telefone_cliente: formData.telefone_cliente || null,
        codigo_ficha: formData.codigo_ficha || null,
        tipo: formData.tipo || null,
        data_retirada: formatarDataParaBanco(formData.data_retirada),
        data_devolucao: formatarDataParaBanco(formData.data_devolucao),
        data_festa: formatarDataParaBanco(formData.data_festa),
        valor: formData.valor ? parseFloat(formData.valor.toString()) : null,
        garantia: formData.garantia ? parseFloat(formData.garantia.toString()) : null,
        paleto: formData.paleto || null,
        calca: formData.calca || null,
        camisa: formData.camisa || null,
        sapato: formData.sapato || null,
        paleto_cor: formData.paleto_cor || null,
        paleto_lanificio: formData.paleto_lanificio || null,
        camisa_fios: formData.camisa_fios || null,
        camisa_cor: formData.camisa_cor || null,
        sapato_tipo: formData.sapato_tipo || null,
        pago: formData.pago,
        cliente_id: clienteId,
        status: novoStatus,
        updated_at: new Date().toISOString(),
      };

      if (isAdmin && fichaVendedorId) {
        updateData.vendedor_id = fichaVendedorId;
      }

      const { error } = await supabase
        .from("fichas")
        .update(updateData)
        .eq("id", ficha.id);

      if (error) throw error;

      supabase.functions.invoke('notificar-ficha-whatsapp', {
        body: { ficha_id: ficha.id }
      }).catch(err => {
        console.error('Erro ao enviar notificação WhatsApp:', err);
      });

      // Surgical tag save: only update padrao tags, never touch non-padrao relations
      if (clienteId && tagsPadrao.length > 0) {
        const padraoIds = tagsPadrao.map(t => t.id);
        const { data: existingRelacoes } = await supabase
          .from('relacao_cliente_tag')
          .select('id_tag')
          .eq('id_cliente', clienteId)
          .in('id_tag', padraoIds);

        const existingTagIds = new Set((existingRelacoes ?? []).map(r => r.id_tag));

        for (const padraoTag of tagsPadrao) {
          const isSelected = formData.tags.some(t => t.toLowerCase() === padraoTag.nome.toLowerCase());
          const exists = existingTagIds.has(padraoTag.id);

          if (isSelected && !exists) {
            await supabase
              .from('relacao_cliente_tag')
              .insert({ id_cliente: clienteId, id_tag: padraoTag.id });
          } else if (!isSelected && exists) {
            await supabase
              .from('relacao_cliente_tag')
              .delete()
              .eq('id_cliente', clienteId)
              .eq('id_tag', padraoTag.id);
          }
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar ficha:", error);
      toast({
        title: "Erro ao salvar ficha",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(null);
  };

  const handleImageError = () => {
    setImageError('Não foi possível carregar a imagem.');
    setImageLoading(false);
  };

  const handleOpenImageModal = () => {
    setImageLoading(true);
    setImageError(null);
    setShowImageModal(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Ficha</DialogTitle>
            <DialogDescription>
              Altere os campos necessários e clique em salvar
            </DialogDescription>

            {isLoading && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Processando imagem</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">Os campos serão preenchidos automaticamente quando o processamento terminar.</p>
                </div>
              </div>
            )}
          </DialogHeader>

          {ficha?.url_bucket && (
            <div className="px-6 pt-4">
              <Button
                type="button"
                onClick={handleOpenImageModal}
                className="w-full flex items-center justify-center gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Ver Ficha Original
              </Button>
            </div>
          )}

          <div className="space-y-6 py-4">

            {/* Tags */}
            {tagsPadrao.length > 0 && (
              <>
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tagsPadrao.map((tag) => {
                      const selected = formData.tags.some(t => t.toLowerCase() === tag.nome.toLowerCase());
                      return (
                        <Button
                          key={tag.id}
                          type="button"
                          size="sm"
                          variant={selected ? 'default' : 'outline'}
                          onClick={() => handleToggleTag(tag.nome)}
                        >
                          {tag.nome}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Cabeçalho */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Cabeçalho</h3>

              {isAdmin && (
                <div className="space-y-2">
                  <Label>Vendedor responsável pela ficha</Label>
                  <Select value={fichaVendedorId ?? ''} onValueChange={setFichaVendedorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendedores.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>

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

            {/* Detalhes do Item */}
            <div className="space-y-6">
              <h3 className="text-base font-semibold">Detalhes do Item</h3>

              {/* Paletó / Calça */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Paletó / Calça</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paleto">Paletó</Label>
                    <Input
                      id="paleto"
                      value={formData.paleto}
                      onChange={(e) => setFormData({ ...formData, paleto: e.target.value })}
                      placeholder="Número"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calca">Calça</Label>
                    <Input
                      id="calca"
                      value={formData.calca}
                      onChange={(e) => setFormData({ ...formData, calca: e.target.value })}
                      placeholder="Número"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Azul', 'Preto', 'Cinza', 'Outros'].map(cor => (
                      <Button
                        key={cor}
                        type="button"
                        size="sm"
                        variant={formData.paleto_cor === cor ? 'default' : 'outline'}
                        onClick={() => setFormData({ ...formData, paleto_cor: formData.paleto_cor === cor ? null : cor })}
                      >
                        {cor}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Lanifício</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Reda', 'Paramount', 'Canonico', 'Pietro di Mosso'].map(lan => (
                      <Button
                        key={lan}
                        type="button"
                        size="sm"
                        variant={formData.paleto_lanificio === lan ? 'default' : 'outline'}
                        onClick={() => setFormData({ ...formData, paleto_lanificio: formData.paleto_lanificio === lan ? null : lan })}
                      >
                        {lan}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <Separator className="opacity-50" />

              {/* Camisa */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Camisa</h4>
                <div className="space-y-2">
                  <Label htmlFor="camisa">Número</Label>
                  <Input
                    id="camisa"
                    value={formData.camisa}
                    onChange={(e) => setFormData({ ...formData, camisa: e.target.value })}
                    placeholder="Número"
                    className="max-w-[160px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fios</Label>
                  <div className="flex flex-wrap gap-2">
                    {['140', '120', '100'].map(fio => (
                      <Button
                        key={fio}
                        type="button"
                        size="sm"
                        variant={formData.camisa_fios === fio ? 'default' : 'outline'}
                        onClick={() => setFormData({ ...formData, camisa_fios: formData.camisa_fios === fio ? null : fio })}
                      >
                        {fio}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Branco', 'Outros'].map(cor => (
                      <Button
                        key={cor}
                        type="button"
                        size="sm"
                        variant={formData.camisa_cor === cor ? 'default' : 'outline'}
                        onClick={() => setFormData({ ...formData, camisa_cor: formData.camisa_cor === cor ? null : cor })}
                      >
                        {cor}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <Separator className="opacity-50" />

              {/* Sapato */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Sapato</h4>
                <div className="space-y-2">
                  <Label htmlFor="sapato">Número</Label>
                  <Input
                    id="sapato"
                    value={formData.sapato}
                    onChange={(e) => setFormData({ ...formData, sapato: e.target.value })}
                    placeholder="Número"
                    className="max-w-[160px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Casual', 'Social'].map(tipo => (
                      <Button
                        key={tipo}
                        type="button"
                        size="sm"
                        variant={formData.sapato_tipo === tipo ? 'default' : 'outline'}
                        onClick={() => setFormData({ ...formData, sapato_tipo: formData.sapato_tipo === tipo ? null : tipo })}
                      >
                        {tipo}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Peças Avulsas */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Peças Avulsas
              </h3>

              {isAdmin && (
                <div className="space-y-2">
                  <Label>Vendedor das peças avulsas</Label>
                  <Select
                    value={resolvedAvulsosVendedorId ?? ''}
                    onValueChange={setAvulsosVendedorId}
                  >
                    <SelectTrigger className="max-w-xs">
                      <SelectValue placeholder="Selecione o vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendedores.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                {TIPOS_ITEM_AVULSO.map(tipo => {
                  const item = itens.find(i => i.tipo_item === tipo) ?? { tipo_item: tipo, quantidade: 0, valor_unitario: null };
                  const total = item.quantidade * (item.valor_unitario ?? 0);
                  return (
                    <div key={tipo} className="flex items-center gap-3 p-3 rounded border border-border">
                      <span className="w-20 text-sm font-medium">{TIPO_LABEL[tipo]}</span>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => handleQuantChange(tipo, -1)}
                          disabled={item.quantidade === 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm tabular-nums">{item.quantidade}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => handleQuantChange(tipo, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-1 flex-1">
                        <span className="text-xs text-muted-foreground">R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.valor_unitario ?? ''}
                          onChange={(e) => handleValorUnitarioChange(tipo, e.target.value)}
                          placeholder="0,00"
                          className="h-7 text-sm w-24"
                        />
                      </div>

                      <div className="text-sm text-muted-foreground text-right min-w-[64px] tabular-nums">
                        {total > 0
                          ? total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : '—'
                        }
                      </div>
                    </div>
                  );
                })}
              </div>

              {itens.some(i => i.quantidade > 0) && (
                <div className="flex justify-between items-center pt-1 text-sm font-medium">
                  <span>Total avulsos</span>
                  <span className="tabular-nums">
                    {itens
                      .reduce((acc, i) => acc + i.quantidade * (i.valor_unitario ?? 0), 0)
                      .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              )}

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleSalvarItens}
                disabled={salvarItens.isPending || !fichaId}
              >
                {salvarItens.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar peças avulsas
              </Button>
            </div>

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
            <DialogDescription>Imagem capturada da ficha</DialogDescription>
          </DialogHeader>

          <div className="relative w-full h-full px-6 pb-6 overflow-auto">
            {ficha?.url_bucket ? (
              <div className="relative">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                {imageError && (
                  <div className="flex flex-col items-center justify-center h-64 bg-destructive/10 rounded-lg border border-destructive/20">
                    <p className="text-destructive font-medium mb-2">{imageError}</p>
                  </div>
                )}
                {!imageError && (
                  <img
                    src={ficha.url_bucket}
                    alt="Ficha original"
                    className="w-full h-auto rounded-lg shadow-lg"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    style={{ display: imageLoading ? 'none' : 'block' }}
                  />
                )}
              </div>
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
