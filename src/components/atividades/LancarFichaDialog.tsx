import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, CheckCircle2, FileText, Loader2, PenLine, Upload, X } from "lucide-react";
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
import { garantirJpeg } from "@/lib/imagem";

/**
 * Lançamento de ficha de dentro da atividade do funil.
 *
 * Existe porque o cliente vem do CARD, travado. Antes o vendedor caía em /novo
 * e digitava nome e telefone de novo, o que criava (ou casava com) outro
 * cliente — e a oportunidade ficava aberta para sempre, porque o vínculo do
 * banco é por cliente.
 *
 * Dois caminhos, nesta ordem de importância:
 *
 *   1. FOTO (padrão). É assim que a ficha nasce no dia a dia: o vendedor
 *      fotografa a ficha de papel, a edge `processar-ficha-v3` cria a ficha
 *      `pendente` já ligada ao card e ao cliente, e o OCR preenche o resto em
 *      background (~10-30s). A tela de edição assume dali, e é o save dela —
 *      que promove a ficha a 'ativa' — que fecha o card. O gatilho
 *      `trg_ficha_fecha_oportunidade` roda em INSERT **e** UPDATE desde a
 *      migration de 24/08, então esse fechamento tardio é coberto.
 *
 *   2. MANUAL (desvio). Digitação dos campos-núcleo. Aqui a ficha nasce
 *      COMPLETA numa única operação (`status: 'ativa'` + `cliente_id` +
 *      `oportunidade_id`), então o card fecha na hora. Serve para quando não há
 *      papel para fotografar, ou a foto falhou.
 *
 * A diferença de MOMENTO entre os dois é deliberada e está escrita na tela: a
 * venda só é real quando a ficha é real. Ficha `pendente` abandonada no meio
 * não pode fechar card nenhum.
 *
 * O que este modal deliberadamente NÃO faz, nos dois caminhos: provas, pedidos,
 * tags, lanifício e categoria. Isso continua na tela completa.
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

/**
 * O mesmo conjunto que a edge valida em ACCEPTED_FORMATS. Barrar aqui é o que
 * transforma um 400 'invalid_format' genérico numa frase que o vendedor
 * entende — webp, por exemplo, o seletor de galeria oferece e a edge recusa.
 */
const FORMATOS_ACEITOS = /^image\/(jpeg|png|heic|heif)$/i;

const LancarFichaDialog = ({ open, contexto, onClose }: Props) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const travarSubmit = useTravaSubmit();

  /** 'foto' é o padrão: manual é a exceção, não o contrário. */
  const [modo, setModo] = useState<"foto" | "manual">("foto");

  const cameraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [enviando, setEnviando] = useState(false);

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
  /** Id da ficha criada no manual: o modal vira tela de sucesso em vez de fechar. */
  const [fichaCriada, setFichaCriada] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setModo("foto");
    setArquivo(null);
    setPreviewUrl("");
    setEnviando(false);
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

  // O object URL da prévia é o único recurso que este modal vaza se ninguém
  // devolver — e ele troca a cada foto retirada, não só ao fechar.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  // ── Caminho 1: foto ───────────────────────────────────────────────────────

  const escolherArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const original = e.target.files?.[0];
    // Zera o input: sem isso, escolher o MESMO arquivo de novo (depois de
    // "Trocar foto") não dispara change e a tela parece travada.
    e.target.value = "";
    if (!original) return;

    // Converte HEIC/HEIF do iPhone para JPEG no device. Nunca bloqueia: se
    // falhar, segue com o original — a edge aceita HEIC.
    let file = original;
    try {
      file = await garantirJpeg(original);
    } catch (err) {
      console.error("Falha ao converter HEIC para JPEG:", err);
      file = original;
    }

    if (!FORMATOS_ACEITOS.test(file.type)) {
      toast({
        title: "Formato não aceito",
        description: "Use uma foto JPEG ou PNG.",
        variant: "destructive",
      });
      return;
    }

    setArquivo(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const enviarFoto = () => travarSubmit(async () => {
    if (!contexto || !arquivo) return;
    if (!user?.id) {
      toast({ title: "Sessão expirada. Entre de novo.", variant: "destructive" });
      return;
    }

    setEnviando(true);
    try {
      const form = new FormData();
      form.append("image", arquivo);
      form.append("user_id", user.id);
      // Todo o contexto do card viaja junto. `oportunidade_id` é o que fecha o
      // card; `cliente_id` é o que impede a ficha de nascer para um cliente
      // duplicado criado a partir do telefone que o OCR ler do papel.
      form.append("oportunidade_id", contexto.oportunidadeId);
      form.append("cliente_id", contexto.clienteId);
      if (contexto.clienteNome) form.append("cliente_nome", contexto.clienteNome);
      if (contexto.clienteTelefone) form.append("cliente_telefone", contexto.clienteTelefone);
      const unidade = contexto.unidadeId ?? profile?.unidade_id ?? null;
      if (unidade !== null) form.append("unidade_id", String(unidade));

      const { data, error } = await supabase.functions.invoke("processar-ficha-v3", {
        body: form,
      });

      if (error) throw error;
      if (!data?.ficha_id) throw new Error(data?.error || "A ficha não retornou id.");

      // A atividade ainda NÃO foi concluída — a ficha nasceu 'pendente'. Quem
      // conclui é o gatilho, no save da tela de edição. Mesmo assim invalidamos:
      // a listagem some/reordena quando o vendedor voltar, e o custo é zero.
      void queryClient.invalidateQueries({ queryKey: ["atividades"] });

      onClose();
      // `imageFile` + `isNewFicha` são o mesmo par que /novo entrega: a tela
      // mostra a foto local enquanto o OCR não terminou e escuta o realtime.
      navigate(`/editar-ficha-v3/${data.ficha_id}`, {
        state: { imageFile: arquivo, isNewFicha: true },
      });
    } catch (err) {
      // A edge devolve código ('invalid_format', 'file_too_large'), e o
      // supabase-js troca não-2xx por "non-2xx status code" — nenhum dos dois
      // diz nada a quem está com o cliente na frente. O motivo real vai para o
      // console; a tela oferece a saída que sempre existe.
      console.error("Falha ao enviar a ficha para o OCR:", err);
      toast({
        title: "Não foi possível enviar a foto",
        description: "Tente de novo ou preencha a ficha manualmente.",
        variant: "destructive",
      });
    } finally {
      setEnviando(false);
    }
  });

  // ── Caminho 2: manual ─────────────────────────────────────────────────────

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

      // Notificação da ficha no WhatsApp pausada em 11/09/2026: a chamada à edge
      // `notificar-ficha-whatsapp` saiu daqui. A edge continua deployada. Para
      // religar e o porquê, ver pamplona-crm/docs/PLANO-PAUSAR-WHATSAPP.md.

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

  const paraQuem = contexto.clienteNome ?? "o cliente do card";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[calc(100dvh-5rem)] overflow-y-auto">
        <DialogTitle>
          {fichaCriada ? "Ficha lançada" : "Lançar ficha"}
        </DialogTitle>
        <DialogDescription>
          {fichaCriada
            ? "A oportunidade foi fechada como ganha e esta atividade está concluída."
            : `Para ${paraQuem} — a ficha já nasce ligada a esta oportunidade e a este cliente.`}
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
        ) : modo === "foto" ? (
          <div className="space-y-4 mt-2">
            {previewUrl ? (
              <>
                <div className="relative w-full aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                  <img src={previewUrl} alt="Prévia da ficha" className="w-full h-full object-contain" />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Confira se o código e o nome estão legíveis antes de enviar.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setArquivo(null); setPreviewUrl(""); }}
                    disabled={enviando}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Trocar foto
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 text-white hover:bg-green-700"
                    onClick={enviarFoto}
                    disabled={enviando}
                  >
                    {enviando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {enviando ? "Enviando..." : "Enviar ficha"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-primary/40 dark:border-primary/70 bg-accent/30 dark:bg-primary/10 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-primary/60 dark:text-primary/90" />
                  </div>
                </div>

                <Button
                  className="w-full h-12"
                  onClick={() => cameraRef.current?.click()}
                  disabled={enviando}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Tirar foto da ficha
                </Button>

                <Button
                  variant="secondary"
                  className="w-full h-12"
                  onClick={() => galeriaRef.current?.click()}
                  disabled={enviando}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Carregar imagem
                </Button>

                {/* O momento do fechamento muda entre os dois caminhos, e o
                    vendedor precisa saber disso antes de escolher — senão sai
                    da foto achando que o card já fechou. */}
                <p className="text-xs text-muted-foreground">
                  O OCR lê a ficha em alguns segundos e abre a tela de conferência.
                  A oportunidade fecha como ganha quando você salvar lá.
                </p>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-background text-muted-foreground">ou</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setModo("manual")}
                  disabled={enviando}
                >
                  <PenLine className="h-4 w-4 mr-2" />
                  Preencher manualmente
                </Button>

                <Button variant="ghost" className="w-full" onClick={onClose} disabled={enviando}>
                  Cancelar
                </Button>
              </>
            )}

            <input
              ref={cameraRef} id="ficha-camera" name="ficha-camera" type="file"
              accept="image/*" capture="environment"
              onChange={escolherArquivo} className="hidden"
            />
            <input
              ref={galeriaRef} id="ficha-galeria" name="ficha-galeria" type="file"
              accept="image/*"
              onChange={escolherArquivo} className="hidden"
            />
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

            {/* Ficha digitada aqui não tem imagem da ficha de papel: o upload
                vive na edge do OCR, que é o outro caminho deste mesmo modal. */}
            <button
              type="button"
              className="text-xs text-muted-foreground underline underline-offset-2"
              onClick={() => setModo("foto")}
              disabled={salvando}
            >
              Voltar para a foto da ficha
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
