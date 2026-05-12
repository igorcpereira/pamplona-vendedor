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
import { useCriarPedido, useAtualizarPedido, type Pedido, type ItemPedido } from '@/hooks/usePedidosFicha';
import { TIPOS_ITEM_AVULSO, type TipoItemAvulso } from '@/hooks/useItensAvulsosFicha';
import { toast } from '@/hooks/use-toast';

const TIPO_LABEL: Record<TipoItemAvulso, string> = {
  camiseta: 'Camiseta',
  gravata: 'Gravata',
  sapato: 'Sapato',
  meia: 'Meia',
  cinto: 'Cinto',
};

interface Props {
  fichaId: string | undefined;
  pedido?: Pedido;
  open: boolean;
  onClose: () => void;
}

const itemZerado = (tipo: TipoItemAvulso): ItemPedido => ({
  tipo_item: tipo,
  quantidade: 0,
  valor_unitario: null,
});

export default function PedidoModal({ fichaId, pedido, open, onClose }: Props) {
  const { user, activeUnidade } = useAuth();
  const isAdmin = activeUnidade?.role === 'administrativo';
  const { data: vendedores = [] } = useVendedoresUnidade();

  const criarPedido = useCriarPedido(fichaId);
  const atualizarPedido = useAtualizarPedido(fichaId);

  const [vendedorId, setVendedorId] = useState<string>('');
  const [pago, setPago] = useState(false);
  const [garantia, setGarantia] = useState('');
  const [itens, setItens] = useState<ItemPedido[]>(TIPOS_ITEM_AVULSO.map(itemZerado));

  useEffect(() => {
    if (!open) return;
    if (pedido) {
      setVendedorId(pedido.vendedor_id);
      setPago(pedido.pago);
      setGarantia(pedido.garantia != null ? String(pedido.garantia) : '');
      const mapa = new Map(pedido.itens.map((i) => [i.tipo_item, i]));
      setItens(TIPOS_ITEM_AVULSO.map((t) => mapa.get(t) ?? itemZerado(t)));
    } else {
      setVendedorId(user?.id ?? '');
      setPago(false);
      setGarantia('');
      setItens(TIPOS_ITEM_AVULSO.map(itemZerado));
    }
  }, [open, pedido, user?.id]);

  const handleQuantChange = (tipo: TipoItemAvulso, delta: number) => {
    setItens((prev) =>
      prev.map((item) =>
        item.tipo_item === tipo
          ? { ...item, quantidade: Math.max(0, item.quantidade + delta) }
          : item,
      ),
    );
  };

  const handleValorChange = (tipo: TipoItemAvulso, valor: string) => {
    const num = valor ? parseFloat(valor.replace(',', '.')) : null;
    setItens((prev) =>
      prev.map((item) =>
        item.tipo_item === tipo
          ? { ...item, valor_unitario: num !== null && !isNaN(num) ? num : null }
          : item,
      ),
    );
  };

  const handleSalvar = async () => {
    const garantiaNum = garantia ? parseFloat(garantia.replace(',', '.')) : null;

    try {
      if (pedido) {
        await atualizarPedido.mutateAsync({
          pedidoId: pedido.id,
          pago,
          garantia: garantiaNum,
          itens,
        });
        toast({ title: 'Pedido atualizado' });
      } else {
        await criarPedido.mutateAsync({
          vendedor_id: isAdmin ? vendedorId : undefined,
          pago,
          garantia: garantiaNum,
          itens,
        });
        toast({ title: 'Pedido criado' });
      }
      onClose();
    } catch (err) {
      toast({
        title: 'Erro ao salvar pedido',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const isPending = criarPedido.isPending || atualizarPedido.isPending;

  const valorTotal = itens.reduce(
    (acc, i) => acc + i.quantidade * (i.valor_unitario ?? 0),
    0,
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogTitle>{pedido ? 'Editar Pedido' : 'Novo Pedido'}</DialogTitle>

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

          {/* Cabeçalho da tabela de itens */}
          <div className="flex items-center gap-3 px-3 pb-1 text-xs text-muted-foreground">
            <span className="w-20" />
            <span className="w-[88px] text-center">Quantidade</span>
            <span className="flex-1 pl-5">Valor unitário</span>
            <span className="min-w-[64px] text-right">Valor total</span>
          </div>

          <div className="space-y-2">
            {TIPOS_ITEM_AVULSO.map((tipo) => {
              const item = itens.find((i) => i.tipo_item === tipo) ?? itemZerado(tipo);
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
                      onChange={(e) => handleValorChange(tipo, e.target.value)}
                      placeholder="0,00"
                      className="h-7 text-sm w-24"
                    />
                  </div>

                  <div className="text-sm text-muted-foreground text-right min-w-[64px] tabular-nums">
                    {total > 0 ? total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                  </div>
                </div>
              );
            })}
          </div>

          {valorTotal > 0 && (
            <div className="flex justify-between items-center pt-1 text-sm font-medium border-t">
              <span>Total</span>
              <span className="tabular-nums">
                {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          )}

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
