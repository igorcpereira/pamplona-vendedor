import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface EditFichaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ficha: any;
  onSuccess: () => void;
}

export function EditFichaModal({ open, onOpenChange, ficha, onSuccess }: EditFichaModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_cliente: ficha?.nome_cliente || "",
    telefone_cliente: ficha?.telefone_cliente || "",
    codigo_ficha: ficha?.codigo_ficha || "",
    tipo: ficha?.tipo || "Aluguel",
    status: ficha?.status || "processing",
    vendedor_responsavel: ficha?.vendedor_responsavel || "",
    data_retirada: ficha?.data_retirada ? new Date(ficha.data_retirada) : undefined,
    data_devolucao: ficha?.data_devolucao ? new Date(ficha.data_devolucao) : undefined,
    data_festa: ficha?.data_festa ? new Date(ficha.data_festa) : undefined,
    data_prova_1: ficha?.data_prova_1 ? new Date(ficha.data_prova_1) : undefined,
    data_prova_2: ficha?.data_prova_2 ? new Date(ficha.data_prova_2) : undefined,
    valor: ficha?.valor || "",
    garantia: ficha?.garantia || "",
    paleto: ficha?.paleto || "",
    calca: ficha?.calca || "",
    camisa: ficha?.camisa || "",
    sapato: ficha?.sapato || "",
    colete: ficha?.colete || "",
    gravata: ficha?.gravata || "",
    faixa: ficha?.faixa || "",
    abotoaduras: ficha?.abotoaduras || "",
    outros: ficha?.outros || "",
    transcricao_audio: ficha?.transcricao_audio || "",
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData: any = {
        nome_cliente: formData.nome_cliente || null,
        telefone_cliente: formData.telefone_cliente || null,
        codigo_ficha: formData.codigo_ficha || null,
        tipo: formData.tipo || null,
        status: formData.status || null,
        vendedor_responsavel: formData.vendedor_responsavel || null,
        data_retirada: formData.data_retirada ? format(formData.data_retirada, "yyyy-MM-dd") : null,
        data_devolucao: formData.data_devolucao ? format(formData.data_devolucao, "yyyy-MM-dd") : null,
        data_festa: formData.data_festa ? format(formData.data_festa, "yyyy-MM-dd") : null,
        data_prova_1: formData.data_prova_1 ? formData.data_prova_1.toISOString() : null,
        data_prova_2: formData.data_prova_2 ? formData.data_prova_2.toISOString() : null,
        valor: formData.valor ? parseFloat(formData.valor) : null,
        garantia: formData.garantia ? parseFloat(formData.garantia) : null,
        paleto: formData.paleto || null,
        calca: formData.calca || null,
        camisa: formData.camisa || null,
        sapato: formData.sapato || null,
        colete: formData.colete || null,
        gravata: formData.gravata || null,
        faixa: formData.faixa || null,
        abotoaduras: formData.abotoaduras || null,
        outros: formData.outros || null,
        transcricao_audio: formData.transcricao_audio || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("fichas")
        .update(updateData)
        .eq("id", ficha.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Ficha atualizada com sucesso!",
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Ficha</DialogTitle>
          <DialogDescription>
            Altere os campos necessários e clique em salvar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações do Cliente */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Informações do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome_cliente">Nome do Cliente</Label>
                <Input
                  id="nome_cliente"
                  value={formData.nome_cliente}
                  onChange={(e) => setFormData({ ...formData, nome_cliente: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone_cliente">Telefone</Label>
                <Input
                  id="telefone_cliente"
                  value={formData.telefone_cliente}
                  onChange={(e) => setFormData({ ...formData, telefone_cliente: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo_ficha">Código da Ficha</Label>
                <Input
                  id="codigo_ficha"
                  value={formData.codigo_ficha}
                  onChange={(e) => setFormData({ ...formData, codigo_ficha: e.target.value })}
                  placeholder="Código"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Atendimento</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aluguel">Aluguel</SelectItem>
                    <SelectItem value="Venda">Venda</SelectItem>
                    <SelectItem value="Reparo">Reparo</SelectItem>
                    <SelectItem value="Prova">Prova</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="processing">Pendente</SelectItem>
                    <SelectItem value="erro">Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendedor_responsavel">Vendedor Responsável</Label>
                <Input
                  id="vendedor_responsavel"
                  value={formData.vendedor_responsavel}
                  onChange={(e) => setFormData({ ...formData, vendedor_responsavel: e.target.value })}
                  placeholder="Nome do vendedor"
                />
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Datas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label>Data Prova 1</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.data_prova_1 && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.data_prova_1 ? format(formData.data_prova_1, "PPP", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={formData.data_prova_1} onSelect={(date) => setFormData({ ...formData, data_prova_1: date })} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data Prova 2</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.data_prova_2 && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.data_prova_2 ? format(formData.data_prova_2, "PPP", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={formData.data_prova_2} onSelect={(date) => setFormData({ ...formData, data_prova_2: date })} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Valores</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* Peças */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Peças</h3>
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

              <div className="space-y-2">
                <Label htmlFor="colete">Colete</Label>
                <Input
                  id="colete"
                  value={formData.colete}
                  onChange={(e) => setFormData({ ...formData, colete: e.target.value })}
                  placeholder="Descrição do colete"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gravata">Gravata</Label>
                <Input
                  id="gravata"
                  value={formData.gravata}
                  onChange={(e) => setFormData({ ...formData, gravata: e.target.value })}
                  placeholder="Descrição da gravata"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="faixa">Faixa</Label>
                <Input
                  id="faixa"
                  value={formData.faixa}
                  onChange={(e) => setFormData({ ...formData, faixa: e.target.value })}
                  placeholder="Descrição da faixa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="abotoaduras">Abotoaduras</Label>
                <Input
                  id="abotoaduras"
                  value={formData.abotoaduras}
                  onChange={(e) => setFormData({ ...formData, abotoaduras: e.target.value })}
                  placeholder="Descrição das abotoaduras"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Observações</h3>
            <div className="space-y-2">
              <Label htmlFor="outros">Outros</Label>
              <Textarea
                id="outros"
                value={formData.outros}
                onChange={(e) => setFormData({ ...formData, outros: e.target.value })}
                placeholder="Observações adicionais"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transcricao_audio">Transcrição de Áudio</Label>
              <Textarea
                id="transcricao_audio"
                value={formData.transcricao_audio}
                onChange={(e) => setFormData({ ...formData, transcricao_audio: e.target.value })}
                placeholder="Transcrição do áudio"
                rows={3}
              />
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
  );
}
