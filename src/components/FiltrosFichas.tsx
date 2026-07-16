import { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  contarFiltrosAtivos,
  FILTROS_FICHAS_DEFAULT,
  type FiltrosFichas,
} from '@/hooks/useFiltrosFichas';

interface UnidadeOption {
  id: number;
  nome: string;
}

const TIPOS: { value: string; label: string }[] = [
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'venda', label: 'Venda' },
  { value: 'ajuste', label: 'Ajuste' },
];

// valor sentinela do Select para "Todas as unidades" (Radix não aceita value="")
const UNIDADE_TODAS = '__todas__';

interface FiltrosFichasProps {
  filtros: FiltrosFichas;
  onChange: (filtros: FiltrosFichas) => void;
  mostrarTipo?: boolean;
  mostrarUnidade?: boolean;
}

const FiltrosFichas = ({
  filtros,
  onChange,
  mostrarTipo = false,
  mostrarUnidade = false,
}: FiltrosFichasProps) => {
  const [open, setOpen] = useState(false);
  const [unidades, setUnidades] = useState<UnidadeOption[]>([]);

  useEffect(() => {
    if (!mostrarUnidade) return;
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('unidades')
        .select('id, nome')
        .neq('id', 3) // exclui a unidade virtual "Todas"
        .order('nome');
      if (error) {
        console.error('Erro ao buscar unidades:', error);
        return;
      }
      if (mounted) setUnidades((data ?? []) as UnidadeOption[]);
    })();
    return () => {
      mounted = false;
    };
  }, [mostrarUnidade]);

  const ativos = contarFiltrosAtivos(filtros);

  const toggleTipo = (tipo: string) => {
    const has = filtros.tipos.includes(tipo);
    const tipos = has
      ? filtros.tipos.filter((t) => t !== tipo)
      : [...filtros.tipos, tipo];
    onChange({ ...filtros, tipos });
  };

  const limpar = () => {
    onChange({ ...FILTROS_FICHAS_DEFAULT, tipos: [] });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {ativos > 0 && (
            <Badge className="ml-1 h-5 min-w-5 justify-center px-1.5 py-0 text-[10px]">
              {ativos}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-4">
        {/* Tipo */}
        {mostrarTipo && (
          <div className="space-y-2">
            <Label className="text-sm">Tipo</Label>
            <div className="flex flex-wrap gap-2">
              {TIPOS.map((t) => {
                const active = filtros.tipos.includes(t.value);
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => toggleTipo(t.value)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background text-foreground hover:bg-muted'
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Data */}
        <div className="space-y-2">
          <Label className="text-sm">Data</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-1">
              <span className="text-[10px] text-muted-foreground">De</span>
              <input
                type="date"
                value={filtros.dataInicio ?? ''}
                onChange={(e) =>
                  onChange({ ...filtros, dataInicio: e.target.value || null })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
              />
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-[10px] text-muted-foreground">Até</span>
              <input
                type="date"
                value={filtros.dataFim ?? ''}
                onChange={(e) =>
                  onChange({ ...filtros, dataFim: e.target.value || null })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Unidade */}
        {mostrarUnidade && (
          <div className="space-y-2">
            <Label className="text-sm">Unidade</Label>
            <Select
              value={filtros.unidadeId !== null ? String(filtros.unidadeId) : UNIDADE_TODAS}
              onValueChange={(v) =>
                onChange({
                  ...filtros,
                  unidadeId: v === UNIDADE_TODAS ? null : Number(v),
                })
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Todas as unidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNIDADE_TODAS}>Todas as unidades</SelectItem>
                {unidades.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={limpar}
          disabled={ativos === 0}
        >
          Limpar filtros
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default FiltrosFichas;
