import { useState, useEffect } from 'react';
import { Loader2, Minus, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useVendedoresUnidade } from '@/hooks/useVendedoresUnidade';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TIPOS_ITEM_AVULSO, type TipoItemAvulso } from '@/hooks/useItensAvulsosFicha';
import { toast } from '@/hooks/use-toast';

const TIPO_LABEL: Record<TipoItemAvulso, string> = {
  camiseta: 'Camiseta',
  camisa: 'Camisa',
  gravata: 'Gravata',
  sapato: 'Sapato',
  meia: 'Meia',
  cinto: 'Cinto',
};

interface ItemLocal {
  tipo_item: TipoItemAvulso;
  quantidade: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const itensZerados = (): ItemLocal[] =>
  TIPOS_ITEM_AVULSO.map((tipo) => ({ tipo_item: tipo, quantidade: 0 }));

const formatPhone = (digits: string): string => {
  const d = digits.slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const toPhone13 = (digits: string): string => {
  const d = digits.replace(/\D/g, '');
  if (d.length === 13) return d;
  if (d.length === 11) return `55${d}`;
  return d;
};

export default function PedidoAvulsoModal({ open, onClose }: Props) {
  const { user, profile, activeUnidade } = useAuth();
  const isAdmin = activeUnidade?.role === 'administrativo';
  const { data: vendedores = [] } = useVendedoresUnidade();
  const queryClient = useQueryClient();

  const [vendedorId, setVendedorId] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [itens, setItens] = useState<ItemLocal[]>(itensZerados());
  const [valorTotal, setValorTotal] = useState('');
  const [garantia, setGarantia] = useState('');
  const [pago, setPago] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setVendedorId(user?.id ?? '');
    setNomeCliente('');
    setTelefoneCliente('');
    setItens(itensZerados());
    setValorTotal('');
    setGarantia('');
    setPago(false);
  }, [open, user?.id]);

  const handleQuantChange = (tipo: TipoItemAvulso, delta: number) => {
    setItens((prev) =>
      prev.map((item) =>
        item.tipo_item === tipo
          ? { ...item, quantidade: Math.max(0, item.quantidade + delta) }
          : item,
      ),
    );
  };

  const handleSalvar = async () => {
    if (!nomeCliente.trim()) {
      toast({ title: 'Informe o nome do cliente', variant: 'destructive' });
      return;
    }

    setIsPending(true);
    try {
      const vid = isAdmin ? vendedorId : (user?.id ?? '');
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const codigoFicha = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const valorTotalNum = valorTotal ? parseFloat(valorTotal.replace(',', '.')) : 0;
      const garantiaNum = garantia ? parseFloat(garantia.replace(',', '.')) : null;

      const telefone13 = telefoneCliente ? toPhone13(telefoneCliente) : null;

      // 1. Cria ficha em branco (invisível ao sistema)
      const { data: ficha, error: fichaError } = await supabase
        .from('fichas')
        .insert({
          vendedor_id: vid,
          unidade_id: profile?.unidade_id ?? null,
          status: 'avulso',
          tipo: 'venda',
          nome_cliente: nomeCliente.trim(),
          telefone_cliente: telefone13,
          codigo_ficha: codigoFicha,
        })
        .select('id')
        .single();

      if (fichaError || !ficha?.id) throw fichaError ?? new Error('Erro ao criar ficha');

      // 1b. Busca/cria cliente e vincula à ficha
      if (telefone13) {
        const { data: clienteExistente } = await supabase
          .from('clientes')
          .select('id')
          .eq('telefone', telefone13)
          .maybeSingle();

        let clienteId: string | null = null;
        if (clienteExistente) {
          clienteId = clienteExistente.id;
        } else {
          const { data: novoCliente } = await supabase
            .from('clientes')
            .insert({ nome: nomeCliente.trim(), telefone: telefone13, vendedor_id: vid })
            .select('id')
            .single();
          clienteId = novoCliente?.id ?? null;
        }

        if (clienteId) {
          await supabase.from('fichas').update({ cliente_id: clienteId }).eq('id', ficha.id);
        }
      }

      // 2. Cria pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          ficha_id: ficha.id,
          vendedor_id: vid,
          unidade_id: profile?.unidade_id ?? null,
          pago,
          garantia: garantiaNum,
          valor_total: 0,
        })
        .select('id')
        .single();

      if (pedidoError || !pedido?.id) throw pedidoError ?? new Error('Erro ao criar pedido');

      // 3. Insere itens (apenas com quantidade > 0)
      const itensComQtd = itens.filter((i) => i.quantidade > 0);
      if (itensComQtd.length > 0) {
        const { error: itensError } = await supabase
          .from('itens_avulsos_ficha')
          .insert(
            itensComQtd.map((i) => ({
              pedido_id: pedido.id,
              tipo_item: i.tipo_item,
              quantidade: i.quantidade,
              valor_unitario: null,
            })),
          );
        if (itensError) throw itensError;
      }

      // 4. Sobrescreve valor_total após trigger de sync
      await supabase
        .from('pedidos')
        .update({ valor_total: valorTotalNum })
        .eq('id', pedido.id);

      queryClient.invalidateQueries({ queryKey: ['pedidos-mes'] });

      toast({ title: 'Pedido avulso criado!' });
      onClose();
    } catch (err) {
      toast({
        title: 'Erro ao salvar pedido',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[calc(100dvh-5rem)] overflow-y-auto">
        <DialogTitle>Novo Pedido Avulso</DialogTitle>

        <div className="space-y-4 mt-2">
          {isAdmin && (
            <div className="space-y-2">
              <Label>Vendedor</Label>
              <Select value={vendedorId} onValueChange={setVendedorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o vendedor" />
                </SelectTrigger>
                <SelectContent>
                  {vendedores.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nomeCliente">Nome do Cliente *</Label>
            <Input
              id="nomeCliente"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              placeholder="Nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefoneCliente">Telefone</Label>
            <Input
              id="telefoneCliente"
              type="tel"
              value={formatPhone(telefoneCliente)}
              onChange={(e) => setTelefoneCliente(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            {TIPOS_ITEM_AVULSO.map((tipo) => {
              const item = itens.find((i) => i.tipo_item === tipo)!;
              return (
                <div key={tipo} className="flex items-center gap-3 p-3 rounded border border-border">
                  <span className="flex-1 text-sm font-medium">{TIPO_LABEL[tipo]}</span>
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
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorTotal">Valor Total (R$)</Label>
            <Input
              id="valorTotal"
              type="number"
              step="0.01"
              min="0"
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="garantia">Garantia / Entrada (R$)</Label>
            <Input
              id="garantia"
              type="number"
              step="0.01"
              min="0"
              value={garantia}
              onChange={(e) => setGarantia(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch id="pago" checked={pago} onCheckedChange={setPago} />
            <Label htmlFor="pago">Pago</Label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="button" className="flex-1" onClick={handleSalvar} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
