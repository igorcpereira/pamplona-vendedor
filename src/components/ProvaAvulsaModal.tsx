import { useState, useEffect } from 'react';
import { Loader2, Search, CheckCircle2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useVendedoresUnidade } from '@/hooks/useVendedoresUnidade';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTravaSubmit } from '@/hooks/useTravaSubmit';

interface Props {
  open: boolean;
  onClose: () => void;
}

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

// Converte telefone salvo (13 dígitos com DDI 55) para os 11 dígitos do input.
const phone13ToInput = (telefone: string | null): string => {
  const d = (telefone ?? '').replace(/\D/g, '');
  if (d.length === 13 && d.startsWith('55')) return d.slice(2);
  return d.slice(-11);
};

interface FichaEncontrada {
  id: string;
  codigo_ficha: string | null;
  nome_cliente: string | null;
  telefone_cliente: string | null;
  vendedor_id: string | null;
}

export default function ProvaAvulsaModal({ open, onClose }: Props) {
  const { user, profile, activeUnidade } = useAuth();
  const isAdmin = activeUnidade?.role === 'administrativo';
  const { data: vendedores = [] } = useVendedoresUnidade();
  const queryClient = useQueryClient();

  const [vendedorId, setVendedorId] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [isPending, setIsPending] = useState(false);
  const travarSubmit = useTravaSubmit();

  // Busca por número de ficha
  const [numeroFicha, setNumeroFicha] = useState('');
  const [buscandoFicha, setBuscandoFicha] = useState(false);
  const [fichaEncontrada, setFichaEncontrada] = useState<FichaEncontrada | null>(null);
  const [fichaId, setFichaId] = useState<string | null>(null);

  const resetForm = () => {
    setVendedorId(user?.id ?? '');
    setNomeCliente('');
    setTelefoneCliente('');
    setNumeroFicha('');
    setBuscandoFicha(false);
    setFichaEncontrada(null);
    setFichaId(null);
  };

  useEffect(() => {
    if (!open) return;
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  const handleBuscarFicha = async () => {
    const codigo = numeroFicha.trim();
    if (!codigo) {
      toast({ title: 'Informe o número da ficha', variant: 'destructive' });
      return;
    }

    setBuscandoFicha(true);
    setFichaEncontrada(null);
    try {
      const { data, error } = await supabase
        .from('fichas')
        .select('id, codigo_ficha, nome_cliente, telefone_cliente, vendedor_id')
        .ilike('codigo_ficha', codigo)
        .neq('status', 'avulso')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({ title: 'Ficha não encontrada', description: `Nenhuma ficha com o número "${codigo}".`, variant: 'destructive' });
        return;
      }

      setFichaEncontrada(data);
    } catch (err) {
      toast({
        title: 'Erro ao buscar ficha',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setBuscandoFicha(false);
    }
  };

  const handleConfirmarFicha = () => {
    if (!fichaEncontrada) return;
    setFichaId(fichaEncontrada.id);
    setNomeCliente(fichaEncontrada.nome_cliente?.trim() ?? '');
    setTelefoneCliente(phone13ToInput(fichaEncontrada.telefone_cliente));
    if (isAdmin && fichaEncontrada.vendedor_id) {
      setVendedorId(fichaEncontrada.vendedor_id);
    }
    setFichaEncontrada(null);
  };

  const handleLimparFicha = () => {
    setFichaId(null);
    setNumeroFicha('');
    setFichaEncontrada(null);
    setNomeCliente('');
    setTelefoneCliente('');
  };

  const handleSalvar = () => travarSubmit(async () => {
    if (!nomeCliente.trim()) {
      toast({ title: 'Informe o nome do cliente', variant: 'destructive' });
      return;
    }

    setIsPending(true);
    try {
      const vid = isAdmin ? vendedorId : (user?.id ?? '');
      if (!vid) {
        toast({ title: 'Selecione o vendedor', variant: 'destructive' });
        setIsPending(false);
        return;
      }

      const telefone13 = telefoneCliente ? toPhone13(telefoneCliente) : null;

      const { error } = await supabase.from('provas').insert({
        vendedor_id: vid,
        unidade_id: profile?.unidade_id ?? null,
        nome_cliente: nomeCliente.trim(),
        telefone_cliente: telefone13,
        ficha_id: fichaId,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['provas-vendedor-mes'] });

      toast({ title: 'Prova avulsa registrada!' });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Prova duplicada')) {
        toast({
          title: 'Prova já registrada',
          description: 'Já existe uma prova sua para este cliente nos últimos 10 minutos.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao registrar prova',
          description: msg || 'Tente novamente.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsPending(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle>Nova Prova Avulsa</DialogTitle>
        <DialogDescription>
          Registra uma prova vinculada ao vendedor. Opcionalmente, vincule a uma ficha pelo número.
        </DialogDescription>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="numeroFicha">Número da ficha (opcional)</Label>
            <div className="flex gap-2">
              <Input
                id="numeroFicha"
                value={numeroFicha}
                onChange={(e) => setNumeroFicha(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleBuscarFicha();
                  }
                }}
                placeholder="Ex: A1B2"
                disabled={!!fichaId}
              />
              {fichaId ? (
                <Button type="button" variant="outline" size="icon" onClick={handleLimparFicha} title="Limpar ficha">
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" variant="outline" size="icon" onClick={handleBuscarFicha} disabled={buscandoFicha} title="Buscar ficha">
                  {buscandoFicha ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              )}
            </div>

            {fichaEncontrada && (
              <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Confirme se é o cliente correto:</p>
                <p className="text-sm font-medium">{fichaEncontrada.nome_cliente || 'Sem nome'}</p>
                <p className="text-sm text-muted-foreground">
                  {fichaEncontrada.telefone_cliente
                    ? formatPhone(phone13ToInput(fichaEncontrada.telefone_cliente))
                    : 'Sem telefone'}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button type="button" size="sm" className="flex-1" onClick={handleConfirmarFicha}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    É este cliente
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => setFichaEncontrada(null)}>
                    Não é
                  </Button>
                </div>
              </div>
            )}

            {fichaId && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                <span>Ficha {numeroFicha.trim().toUpperCase()} vinculada</span>
              </div>
            )}
          </div>

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
            <Label htmlFor="provaNomeCliente">Nome do Cliente *</Label>
            <Input
              id="provaNomeCliente"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              placeholder="Nome completo"
              disabled={!!fichaId}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provaTelefoneCliente">Telefone</Label>
            <Input
              id="provaTelefoneCliente"
              type="tel"
              value={formatPhone(telefoneCliente)}
              onChange={(e) => setTelefoneCliente(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="(00) 00000-0000"
              disabled={!!fichaId}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="button" className="flex-1" onClick={handleSalvar} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrar Prova
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
