import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Target, UserPlus } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, normalizarTelefone, formatarTelefoneInput } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClientes } from "@/hooks/useClientes";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

type TipoNegociacao = "noivo" | "sob_medida" | "avulsa";

const TIPOS: { valor: TipoNegociacao; label: string }[] = [
  { valor: "noivo", label: "Noivo" },
  { valor: "sob_medida", label: "Sob medida" },
  { valor: "avulsa", label: "Avulsa" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Abre oportunidade para si mesmo (a RPC força o próprio usuário como
 * responsável). Não escolhe data: a primeira atividade nasce com o prazo da
 * etapa 0 configurado em funil_etapas.
 *
 * O Pré Cadastro é a porta de entrada do funil (ata §13): nome + telefone viram
 * cliente real pela edge `criar-cliente`, com dedup por telefone.
 */
const NovaOportunidadeDialog = ({ open, onClose }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  /** Padrao: contato novo. Quem entra no funil quase sempre nao e cliente ainda. */
  const [origem, setOrigem] = useState<"pre" | "cliente">("pre");
  const [busca, setBusca] = useState("");
  const [cliente, setCliente] = useState<{ id: string; nome: string } | null>(null);
  const [preNome, setPreNome] = useState("");
  const [preTelefone, setPreTelefone] = useState("");
  const [tipo, setTipo] = useState<TipoNegociacao>("noivo");
  const [salvando, setSalvando] = useState(false);

  const buscaAtiva = busca.trim().length >= 2 ? busca.trim() : undefined;
  const { data: paginas, isFetching } = useClientes(buscaAtiva);
  const clientes = useMemo(
    () => (buscaAtiva ? (paginas?.pages.flat() ?? []).slice(0, 8) : []),
    [buscaAtiva, paginas],
  );

  useEffect(() => {
    if (open) return;
    setOrigem("pre");
    setBusca("");
    setCliente(null);
    setPreNome("");
    setPreTelefone("");
    setTipo("noivo");
  }, [open]);

  const salvar = async () => {
    setSalvando(true);
    try {
      let clienteId = cliente?.id ?? null;

      if (origem === "pre") {
        const telefone = normalizarTelefone(preTelefone);
        if (!preNome.trim() || !telefone) {
          toast({ title: "Informe nome e telefone válido.", variant: "destructive" });
          return;
        }
        const { data: resposta, error } = await supabase.functions.invoke("criar-cliente", {
          body: { nome: preNome.trim(), telefone, vendedor_id: user?.id },
        });
        if (error || !resposta?.cliente_id) {
          throw new Error(resposta?.error || error?.message || "Falha ao criar o cliente.");
        }
        clienteId = resposta.cliente_id as string;
      }

      if (!clienteId) {
        toast({ title: "Escolha o cliente.", variant: "destructive" });
        return;
      }

      const { error } = await supabase.rpc("oportunidades_criar", {
        p_cliente_id: clienteId,
        p_tipo_negociacao: tipo,
      });
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["atividades"] });
      toast({ title: "Oportunidade aberta", description: "A primeira atividade já está na sua agenda." });
      onClose();
    } catch (err) {
      toast({
        title: "Não foi possível abrir",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  const pronto = origem === "cliente" ? !!cliente : !!preNome.trim() && !!normalizarTelefone(preTelefone);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !salvando && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogTitle className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Nova oportunidade
        </DialogTitle>
        <DialogDescription>
          A negociação entra no funil e a primeira atividade cai na sua agenda.
        </DialogDescription>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={origem === "pre" ? "default" : "outline"}
              size="sm"
              onClick={() => { setOrigem("pre"); setCliente(null); }}
            >
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              Contato novo
            </Button>
            <Button
              variant={origem === "cliente" ? "default" : "outline"}
              size="sm"
              onClick={() => setOrigem("cliente")}
            >
              <Search className="h-3.5 w-3.5 mr-1.5" />
              Já é cliente
            </Button>
          </div>

          {origem === "cliente" ? (
            cliente ? (
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-sm font-medium">{cliente.nome}</span>
                <Button variant="ghost" size="sm" onClick={() => setCliente(null)}>Trocar</Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar cliente (2+ letras)..."
                />
                {isFetching && buscaAtiva && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> buscando...
                  </p>
                )}
                {clientes.length > 0 && (
                  <div className="border rounded-md divide-y max-h-52 overflow-y-auto">
                    {clientes.map((c: { id: string; nome: string | null }) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCliente({ id: c.id, nome: c.nome ?? "—" })}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      >
                        {c.nome ?? "—"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome</Label>
                <Input value={preNome} onChange={(e) => setPreNome(e.target.value)} placeholder="Nome do prospect" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Telefone</Label>
                <Input
                  value={formatarTelefoneInput(preTelefone)}
                  onChange={(e) => setPreTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Telefone já cadastrado reaproveita o cliente existente.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de negociação</Label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS.map((t) => (
                <Button
                  key={t.valor}
                  variant={tipo === t.valor ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTipo(t.valor)}
                  className={cn(tipo === t.valor && "pointer-events-none")}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={salvando}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={salvar} disabled={!pronto || salvando}>
              {salvando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Abrir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NovaOportunidadeDialog;
