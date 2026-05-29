import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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

export default function ProvaAvulsaModal({ open, onClose }: Props) {
  const { user, profile, activeUnidade } = useAuth();
  const isAdmin = activeUnidade?.role === 'administrativo';
  const { data: vendedores = [] } = useVendedoresUnidade();
  const queryClient = useQueryClient();

  const [vendedorId, setVendedorId] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setVendedorId(user?.id ?? '');
    setNomeCliente('');
    setTelefoneCliente('');
  }, [open, user?.id]);

  const handleSalvar = async () => {
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
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['provas-vendedor-mes'] });

      toast({ title: 'Prova avulsa registrada!' });
      onClose();
    } catch (err) {
      toast({
        title: 'Erro ao registrar prova',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle>Nova Prova Avulsa</DialogTitle>
        <DialogDescription>
          Registra uma prova vinculada ao vendedor, sem necessidade de ficha.
        </DialogDescription>

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
            <Label htmlFor="provaNomeCliente">Nome do Cliente *</Label>
            <Input
              id="provaNomeCliente"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              placeholder="Nome completo"
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
