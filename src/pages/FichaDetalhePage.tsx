import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useFicha } from "@/hooks/useFichas";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Send,
  Camera,
  User,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Ficha, FichaTipo } from "@/types/database";

const TIPO_OPTIONS: { value: FichaTipo; label: string }[] = [
  { value: "aluguel", label: "Aluguel" },
  { value: "venda", label: "Venda" },
  { value: "ajuste", label: "Ajuste" },
];

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  required?: boolean;
  type?: string;
}

function Field({ label, value, onChange, disabled, required, type = "text" }: FieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "w-full bg-transparent border-0 border-b py-2 text-foreground text-sm outline-none transition-colors",
          disabled
            ? "border-border/50 text-muted-foreground cursor-not-allowed"
            : "border-secondary focus:border-primary"
        )}
      />
    </div>
  );
}

export default function FichaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, activeUnidade } = useAuth();
  const { data: ficha, isLoading } = useFicha(id);

  const [form, setForm] = useState<Partial<Ficha>>({});
  const [saving, setSaving] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<"processing" | "retry" | "done" | "error">("done");
  const cameraRef = useRef<HTMLInputElement>(null);

  // Sync form when ficha loads
  useEffect(() => {
    if (!ficha) return;
    setForm({
      codigo_ficha: ficha.codigo_ficha ?? "",
      tipo: ficha.tipo ?? undefined,
      nome_cliente: ficha.nome_cliente ?? "",
      telefone_cliente: ficha.telefone_cliente ?? "",
      data_retirada: ficha.data_retirada ?? "",
      data_devolucao: ficha.data_devolucao ?? "",
      data_festa: ficha.data_festa ?? "",
      paleto: ficha.paleto ?? "",
      calca: ficha.calca ?? "",
      camisa: ficha.camisa ?? "",
      sapato: ficha.sapato ?? "",
      valor: ficha.valor ?? undefined,
      garantia: ficha.garantia ?? undefined,
      pago: ficha.pago ?? false,
      descricao_cliente: ficha.descricao_cliente ?? "",
    });

    if (ficha.status === "pendente") {
      setOcrStatus(ficha.ocr_tentativa === 2 ? "retry" : "processing");
    } else if (ficha.status === "erro") {
      setOcrStatus("error");
    } else {
      setOcrStatus("done");
    }
  }, [ficha]);

  // Supabase Realtime — ouve ocr_tentativa e status
  const handleRealtimeUpdate = useCallback((payload: { new: Ficha }) => {
    const updated = payload.new;
    queryClient.setQueryData<Ficha>(["ficha", id], updated);

    if (updated.status === "pendente") {
      setOcrStatus(updated.ocr_tentativa === 2 ? "retry" : "processing");
    } else if (updated.status === "erro") {
      setOcrStatus("error");
      toast.error("OCR falhou. Tire uma nova foto ou preencha manualmente.");
    } else if (updated.status === "ativa" || updated.ocr_tentativa != null) {
      setOcrStatus("done");
      toast.success("Dados extraídos com sucesso!");
    }
  }, [id, queryClient]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`ficha-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "fichas", filter: `id=eq.${id}` },
        handleRealtimeUpdate
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, handleRealtimeUpdate]);

  const isProcessing = ocrStatus === "processing" || ocrStatus === "retry";
  const isError = ocrStatus === "error";
  const fieldsDisabled = isProcessing;

  function setField<K extends keyof Ficha>(key: K, value: Ficha[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canSave =
    !fieldsDisabled &&
    !!form.codigo_ficha &&
    !!form.nome_cliente &&
    !!form.telefone_cliente &&
    !!form.tipo;

  async function handleSave() {
    if (!canSave || !id || !user || !activeUnidade) return;
    setSaving(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const { data: { session } } = await supabase.auth.getSession();

      const payload = {
        ficha_id: id,
        nome_cliente: form.nome_cliente,
        telefone_cliente: form.telefone_cliente,
        numero_ficha: form.codigo_ficha,
        tipo: form.tipo,
        data_retirada: form.data_retirada || null,
        data_devolucao: form.data_devolucao || null,
        data_festa: form.data_festa || null,
        paleto: form.paleto || null,
        calca: form.calca || null,
        camisa: form.camisa || null,
        sapato: form.sapato || null,
        valor: form.valor ?? null,
        garantia: form.garantia ?? null,
        pago: form.pago ?? false,
        descricao_cliente: form.descricao_cliente || null,
        tags: [],
      };

      const resp = await fetch(`${supabaseUrl}/functions/v1/salvar-ficha`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const body = await resp.json();
        toast.error(body.error ?? "Erro ao salvar.");
      } else {
        queryClient.invalidateQueries({ queryKey: ["ficha", id] });
        queryClient.invalidateQueries({ queryKey: ["fichas"] });
        toast.success("Ficha salva!");
      }
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendWhatsApp() {
    if (!id) return;
    setSendingWhatsApp(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const { data: { session } } = await supabase.auth.getSession();

      const resp = await fetch(`${supabaseUrl}/functions/v1/notificar-ficha-whatsapp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ ficha_id: id }),
      });

      if (!resp.ok) {
        toast.error("Erro ao enviar WhatsApp.");
      } else {
        queryClient.invalidateQueries({ queryKey: ["ficha", id] });
        toast.success("WhatsApp enviado!");
      }
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setSendingWhatsApp(false);
    }
  }

  async function handleReprocess(file: File) {
    if (!id || !user) return;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const { data: { session } } = await supabase.auth.getSession();

    const formData = new FormData();
    formData.append("image", file);
    formData.append("user_id", user.id);
    formData.append("ficha_id", id);

    setOcrStatus("processing");

    const resp = await fetch(`${supabaseUrl}/functions/v1/processar-ficha-v2`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token}` },
      body: formData,
    });

    if (!resp.ok) {
      toast.error("Erro ao reprocessar.");
      setOcrStatus("error");
    } else {
      toast.info("Reprocessando...");
    }
  }

  if (isLoading || !ficha) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="Ficha" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title={ficha.codigo_ficha ? `#${ficha.codigo_ficha}` : "Ficha"} />

      <main className="flex-1 px-4 py-6 pb-24 max-w-md mx-auto w-full space-y-6">
        {/* Banner de status OCR */}
        {isProcessing && (
          <div className="bg-warning/10 border border-warning/30 rounded-[var(--radius)] p-4 flex items-start gap-3">
            <Loader2 className="w-5 h-5 text-warning animate-spin flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {ocrStatus === "retry"
                  ? "Tentando novamente..."
                  : "Processando ficha..."}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {ocrStatus === "retry"
                  ? "Processamento demorou mais que o esperado. Por favor aguarde."
                  : "Os dados serão preenchidos automaticamente em instantes."}
              </p>
            </div>
          </div>
        )}

        {isError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-[var(--radius)] p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Falha no processamento</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  O OCR não conseguiu ler a ficha. Escolha uma opção:
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => cameraRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Camera className="w-4 h-4" strokeWidth={1.5} />
                Nova foto
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setOcrStatus("done")}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                Preencher manual
              </Button>
            </div>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleReprocess(f);
              }}
            />
          </div>
        )}

        {/* Sugestão de cliente */}
        {ficha.cliente_encontrado && ficha.cliente_sugerido_nome && !ficha.cliente_id && (
          <div className="bg-primary/10 border border-primary/30 rounded-[var(--radius)] p-4 flex items-start gap-3">
            <User className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Cliente encontrado
              </p>
              <p className="text-sm text-muted-foreground">
                {ficha.cliente_sugerido_nome} — é ele?
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button className="text-xs text-success font-medium">Sim</button>
              <button
                className="text-xs text-muted-foreground"
                onClick={() => setField("telefone_cliente", "")}
              >
                Não
              </button>
            </div>
          </div>
        )}

        {/* WhatsApp reenvio */}
        {ficha.status === "ativa" && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              {ficha.enviada_whatsapp_geral ? (
                <CheckCircle className="w-4 h-4 text-success" strokeWidth={1.5} />
              ) : (
                <AlertCircle className="w-4 h-4 text-warning" strokeWidth={1.5} />
              )}
              <span className="text-xs text-muted-foreground">
                {ficha.enviada_whatsapp_geral
                  ? "Enviada pelo WhatsApp"
                  : "WhatsApp não enviado"}
              </span>
            </div>
            <button
              onClick={handleSendWhatsApp}
              disabled={sendingWhatsApp}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50"
            >
              {sendingWhatsApp ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
              )}
              {ficha.enviada_whatsapp_geral ? "Reenviar" : "Enviar agora"}
            </button>
          </div>
        )}

        {/* Seção: Identificação */}
        <section className="space-y-4">
          <h3 className="font-display text-sm font-medium tracking-wide text-foreground/80 uppercase">
            Identificação
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Nº da Ficha"
              required
              value={(form.codigo_ficha as string) ?? ""}
              onChange={(v) => setField("codigo_ficha", v)}
              disabled={fieldsDisabled}
            />
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                Tipo<span className="text-destructive">*</span>
              </label>
              <div className="flex gap-2 pt-1">
                {TIPO_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    disabled={fieldsDisabled}
                    onClick={() => setField("tipo", o.value)}
                    className={cn(
                      "flex-1 text-xs py-1.5 rounded-[var(--radius)] border transition-colors",
                      form.tipo === o.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Field
            label="Nome do cliente"
            required
            value={(form.nome_cliente as string) ?? ""}
            onChange={(v) => setField("nome_cliente", v)}
            disabled={fieldsDisabled}
          />
          <Field
            label="Telefone"
            required
            value={(form.telefone_cliente as string) ?? ""}
            onChange={(v) => setField("telefone_cliente", v)}
            disabled={fieldsDisabled}
            type="tel"
          />
        </section>

        {/* Seção: Datas */}
        <section className="space-y-4">
          <h3 className="font-display text-sm font-medium tracking-wide text-foreground/80 uppercase">
            Datas
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Retirada"
              value={(form.data_retirada as string) ?? ""}
              onChange={(v) => setField("data_retirada", v)}
              disabled={fieldsDisabled}
              type="date"
            />
            {form.tipo === "aluguel" && (
              <Field
                label="Devolução"
                value={(form.data_devolucao as string) ?? ""}
                onChange={(v) => setField("data_devolucao", v)}
                disabled={fieldsDisabled}
                type="date"
              />
            )}
            <Field
              label="Data da festa"
              value={(form.data_festa as string) ?? ""}
              onChange={(v) => setField("data_festa", v)}
              disabled={fieldsDisabled}
              type="date"
            />
          </div>
        </section>

        {/* Seção: Trajes */}
        <section className="space-y-4">
          <h3 className="font-display text-sm font-medium tracking-wide text-foreground/80 uppercase">
            Trajes
          </h3>
          <Field
            label="Paletó"
            value={(form.paleto as string) ?? ""}
            onChange={(v) => setField("paleto", v)}
            disabled={fieldsDisabled}
          />
          <Field
            label="Calça"
            value={(form.calca as string) ?? ""}
            onChange={(v) => setField("calca", v)}
            disabled={fieldsDisabled}
          />
          <Field
            label="Camisa"
            value={(form.camisa as string) ?? ""}
            onChange={(v) => setField("camisa", v)}
            disabled={fieldsDisabled}
          />
          <Field
            label="Sapato"
            value={(form.sapato as string) ?? ""}
            onChange={(v) => setField("sapato", v)}
            disabled={fieldsDisabled}
          />
        </section>

        {/* Seção: Valores */}
        <section className="space-y-4">
          <h3 className="font-display text-sm font-medium tracking-wide text-foreground/80 uppercase">
            Valores
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Valor total"
              value={form.valor != null ? String(form.valor) : ""}
              onChange={(v) => setField("valor", v ? Number(v) : undefined)}
              disabled={fieldsDisabled}
              type="number"
            />
            {(form.tipo === "aluguel" || form.tipo === "venda") && (
              <Field
                label="Garantia"
                value={form.garantia != null ? String(form.garantia) : ""}
                onChange={(v) => setField("garantia", v ? Number(v) : undefined)}
                disabled={fieldsDisabled}
                type="number"
              />
            )}
          </div>

          <div className="flex items-center gap-3 py-1">
            <button
              disabled={fieldsDisabled}
              onClick={() => setField("pago", !form.pago)}
              className={cn(
                "w-10 h-5 rounded-full transition-colors flex-shrink-0",
                form.pago ? "bg-success" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5",
                  form.pago ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
            <span className="text-sm text-foreground">Pago</span>
          </div>
        </section>

        {/* Seção: Observações */}
        <section className="space-y-4">
          <h3 className="font-display text-sm font-medium tracking-wide text-foreground/80 uppercase">
            Observações
          </h3>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Notas sobre o cliente
            </label>
            <textarea
              value={(form.descricao_cliente as string) ?? ""}
              onChange={(e) => setField("descricao_cliente", e.target.value)}
              disabled={fieldsDisabled}
              rows={3}
              placeholder="Preferências, observações do atendimento..."
              className={cn(
                "w-full bg-transparent border rounded-[var(--radius)] p-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none transition-colors",
                fieldsDisabled
                  ? "border-border/50 text-muted-foreground cursor-not-allowed"
                  : "border-secondary focus:border-primary"
              )}
            />
          </div>
        </section>

        {/* Foto da ficha */}
        {ficha.url_bucket && (
          <section className="space-y-3">
            <h3 className="font-display text-sm font-medium tracking-wide text-foreground/80 uppercase">
              Foto da ficha
            </h3>
            <FichaImage bucketPath={ficha.url_bucket} />
          </section>
        )}

        {/* Botão salvar */}
        {!isProcessing && (
          <Button
            onClick={handleSave}
            disabled={!canSave || saving}
            size="lg"
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" strokeWidth={1.5} />
                Salvar ficha
              </>
            )}
          </Button>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function FichaImage({ bucketPath }: { bucketPath: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    supabase.storage
      .from("fichas")
      .createSignedUrl(bucketPath, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setSrc(data.signedUrl);
      });
  }, [bucketPath]);

  if (!src) return null;

  return (
    <img
      src={src}
      alt="Ficha manuscrita"
      className="w-full rounded-[var(--radius)] border border-border"
    />
  );
}
