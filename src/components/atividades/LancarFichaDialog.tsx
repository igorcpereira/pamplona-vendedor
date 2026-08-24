import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, FileText, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTravaSubmit } from "@/hooks/useTravaSubmit";
import { toast } from "@/hooks/use-toast";

/**
 * Lançamento de ficha de dentro da atividade do funil.
 *
 * Existe por dois motivos, nesta ordem:
 *   1. o cliente vem do CARD, travado. Antes o vendedor caía em /novo e digitava
 *      nome e telefone de novo, o que criava (ou casava com) outro cliente — e a
 *      oportunidade ficava aberta para sempre, porque o vínculo do banco é por
 *      cliente;
 *   2. a ficha nasce COMPLETA numa única operação (`status: 'ativa'` +
 *      `cliente_id` + `oportunidade_id`), em vez do padrão "insere vazia e
 *      completa por UPDATE" das outras telas. É esse INSERT já elegível que faz
 *      o gatilho fechar o card e concluir esta atividade.
 *
 * O que ele deliberadamente NÃO faz: foto/OCR, provas, pedidos, tags, lanifício
 * e categoria. Isso continua na tela completa, que o botão do fim oferece. Ficha
 * lançada aqui não tem imagem da ficha de papel — quem precisa da foto usa o
 * caminho da câmera, que carrega o mesmo vínculo.
 */
export interface ContextoDaFicha {
  oportunidadeId: string;
  clienteId: string;
  clienteNome: string | null;
  clienteTelefone: string | null;
  unidadeId: number | null;
  /** 'noivo' | 'sob_medida' | 'avulsa' — deriva is_noivo/sob_medida da ficha. */
  tipoNegociacao: string | null;
  /** Data do evento do card: pré-preenche a data da festa. */
  dataEvento: string | null;
}

interface Props {
  open: boolean;
  contexto: ContextoDaFicha | null;
  onClose: () => void;
}

const TIPOS = [
  { valor: "aluguel", label: "Aluguel" },
  { valor: "venda", label: "Venda" },
  { valor: "ajuste", label: "Ajuste" },
];

const LancarFichaDialog = ({ open, contexto, onClose }: Props) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const travarSubmit = useTravaSubmit();

  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState("aluguel");
  const [paleto, setPaleto] = useState("");
  const [calca, setCalca] = useState("");
  const [dataRetirada, setDataRetirada] = useState("");
  const [dataDevolucao, setDataDevolucao] = useState("");
  const [dataFesta, setDataFesta] = useState("");
  const [valor, setValor] = useState("");
  const [garantia, setGarantia] = useState("");
  const [pago, setPago] = useState(false);
  const [salvando, setSalvando] = useState(false);
  /** Id da ficha criada: o modal vira tela de sucesso em vez de fechar sozinho. */
  const [fichaCriada, setFichaCriada] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCodigo("");
    setTipo("aluguel");
    setPaleto("");
    setCalca("");
    setDataRetirada("");
    setDataDevolucao("");
    setDataFesta(contexto?.dataEvento ?? "");
    setValor("");
    setGarantia("");
    setPago(false);
    setFichaCriada(null);
  }, [open, contexto?.dataEvento]);

  const lancar = () => travarSubmit(async () => {
    if (!contexto) return;
    if (!codigo.trim()) {
      toast({ title: "Informe o código da ficha", variant: "destructive" });
      return;
    }

    setSalvando(true);
    try {
      const { data: ficha, error } = await supabase
        .from("fichas")
        .insert({
          // Vínculo com o card: é o que garante o fechamento, sem depender de o
          // telefone digitado casar com o cliente da oportunidade.
          oportunidade_id: contexto.oportunidadeId,
          cliente_id: contexto.clienteId,
          nome_cliente: contexto.clienteNome,
          telefone_cliente: contexto.clienteTelefone,
          // 'ativa' de saída: a ficha já nasce elegível, sem passar por
          // 'pendente' (que é o estado de quem ainda vai preencher pelo OCR).
          status: "ativa",
          vendedor_id: user?.id ?? null,
          unidade_id: contexto.unidadeId ?? profile?.unidade_id ?? null,
          codigo_ficha: codigo.trim(),
          tipo,
          paleto: paleto.trim() || null,
          calca: calca.trim() || null,
          data_retirada: dataRetirada || null,
          data_devolucao: dataDevolucao || null,
          data_festa: dataFesta || null,
          valor: valor ? Number(valor.replace(",", ".")) : null,
          garantia: garantia.trim() || null,
          pago,
          // O card já sabe o tipo de negociação; não faz sentido perguntar.
          is_noivo: contexto.tipoNegociacao === "noivo",
          sob_medida: contexto.tipoNegociacao === "sob_medida",
        })
        .select("id")
        .single();

      if (error) throw error;
      if (!ficha?.id) throw new Error("A ficha não retornou id.");

      // Mesmo aviso que a tela completa dispara ao salvar: sem isso a ficha
      // lançada pelo funil não avisa o cliente. Fire-and-forget de propósito.
      void supabase.functions
        .invoke("notificar-ficha-whatsapp", { body: { ficha_id: ficha.id } })
        .catch((err) => console.error("Erro ao notificar WhatsApp:", err));

      // A atividade foi concluída e o card ganho pelo gatilho da ficha — as duas
      // listas precisam recarregar para o vendedor ver isso.
      void queryClient.invalidateQueries({ queryKey: ["atividades"] });
      void queryClient.invalidateQueries({ queryKey: ["historico-cliente"] });

      setFichaCriada(ficha.id);
      toast({ title: "Ficha lançada! A oportunidade foi fechada como ganha." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Tente novamente.";
      toast({
        title: "Não foi possível lançar a ficha",
        // O código é único por loja: o erro cru do Postgres não diz isso.
        description: /duplicate key|unique/i.test(msg)
          ? `O código ${codigo.trim()} já existe nesta unidade.`
          : msg,
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  });

  if (!contexto) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[calc(100dvh-5rem)] overflow-y-auto">
        <DialogTitle>
          {fichaCriada ? "Ficha lançada" : "Lançar ficha"}
        </DialogTitle>
        <DialogDescription>
          {fichaCriada
            ? "A oportunidade foi fechada como ganha e esta atividade está concluída."
            : `Para ${contexto.clienteNome ?? "o cliente do card"} — a ficha já nasce ligada a esta oportunidade.`}
        </DialogDescription>

        {fichaCriada ? (
          <div className="space-y-4 mt-2">
            <div className="flex gap-2 rounded-md border border-green-600/40 bg-green-500/10 p-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-700 shrink-0 mt-0.5" />
              <p>
                Provas, pedidos, tags e a foto da ficha continuam na ficha completa.
                Dá para abrir agora ou depois, em Fichas.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Fechar
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  onClose();
                  navigate(`/editar-ficha-v3/${fichaCriada}`);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Abrir ficha completa
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="codigoFicha">Código da ficha *</Label>
              <Input
                id="codigoFicha"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Como está na ficha de papel"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.valor} value={t.valor}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="paleto">Paletó</Label>
                <Input id="paleto" value={paleto}
                  onChange={(e) => setPaleto(e.target.value)} placeholder="Ex.: 48" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="calca">Calça</Label>
                <Input id="calca" value={calca}
                  onChange={(e) => setCalca(e.target.value)} placeholder="Ex.: 42" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dataRetirada">Retirada</Label>
              <Input id="dataRetirada" type="date" value={dataRetirada}
                onChange={(e) => setDataRetirada(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataDevolucao">Devolução</Label>
              <Input id="dataDevolucao" type="date" value={dataDevolucao}
                onChange={(e) => setDataDevolucao(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataFesta">Festa</Label>
              <Input id="dataFesta" type="date" value={dataFesta}
                onChange={(e) => setDataFesta(e.target.value)} />
              {contexto.dataEvento && (
                <p className="text-xs text-muted-foreground">
                  Veio da data do evento da oportunidade.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="valor">Valor</Label>
                <Input id="valor" inputMode="decimal" value={valor}
                  onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="garantia">Garantia</Label>
                <Input id="garantia" value={garantia}
                  onChange={(e) => setGarantia(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="pago" className="cursor-pointer">Pago</Label>
              <Switch id="pago" checked={pago} onCheckedChange={setPago} />
            </div>

            {/* Ficha lançada aqui não tem foto da ficha de papel: o upload vive
                na edge do OCR. Quem precisa da imagem vai por este caminho, que
                carrega o mesmo vínculo com a oportunidade. */}
            <button
              type="button"
              className="text-xs text-muted-foreground underline underline-offset-2"
              onClick={() => {
                onClose();
                navigate("/novo", {
                  state: { oportunidadeId: contexto.oportunidadeId },
                });
              }}
            >
              Prefiro lançar pela foto da ficha
            </button>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={salvando}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-green-600 text-white hover:bg-green-700"
                onClick={lancar}
                disabled={salvando}
              >
                {salvando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Lançar ficha
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LancarFichaDialog;
