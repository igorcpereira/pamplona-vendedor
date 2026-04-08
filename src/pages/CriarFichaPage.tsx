import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, Upload, X, ImageIcon, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const ACCEPTED_FORMATS = ["image/jpeg", "image/png", "image/heic"];
const MAX_SIZE_MB = 15;

function formatError(code: string): string {
  const map: Record<string, string> = {
    image_required: "Selecione uma imagem.",
    invalid_format: "Formato inválido. Use JPEG, PNG ou HEIC.",
    file_too_large: `Arquivo muito grande. Máximo: ${MAX_SIZE_MB}MB.`,
    unauthorized: "Sessão expirada. Faça login novamente.",
  };
  return map[code] ?? "Erro ao processar. Tente novamente.";
}

export default function CriarFichaPage() {
  const { user, activeUnidade } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function validateFile(f: File): string | null {
    if (!ACCEPTED_FORMATS.includes(f.type)) {
      return "Formato inválido. Use JPEG, PNG ou HEIC.";
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `Arquivo muito grande. Máximo: ${MAX_SIZE_MB}MB.`;
    }
    return null;
  }

  function handleFileSelected(f: File) {
    const err = validateFile(f);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFileSelected(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelected(f);
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!file || !user || !activeUnidade) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("user_id", user.id);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const { data: { session } } = await supabase.auth.getSession();

      const resp = await fetch(
        `${supabaseUrl}/functions/v1/processar-ficha-v2`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: formData,
        }
      );

      const body = await resp.json();

      if (!resp.ok) {
        toast.error(formatError(body.error ?? ""));
        setUploading(false);
        return;
      }

      const { ficha_id } = body as { ficha_id: string };
      navigate(`/fichas/${ficha_id}`, { replace: true });
    } catch {
      toast.error("Erro de conexão. Verifique sua internet.");
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Nova Ficha" />

      <main className="flex-1 px-4 py-6 pb-20 max-w-md mx-auto w-full">
        <p className="text-sm text-muted-foreground mb-6">
          Fotografe a ficha manuscrita. O sistema extrai os dados automaticamente.
        </p>

        {/* Área de upload */}
        {!preview ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={cn(
              "border-2 border-dashed rounded-[var(--radius)] p-8 flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer",
              validationError
                ? "border-destructive bg-destructive/5"
                : "border-border hover:border-primary"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-10 h-10 text-muted-foreground" strokeWidth={1} />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Arraste a foto aqui
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG ou HEIC · Máx. {MAX_SIZE_MB}MB
              </p>
            </div>

            {validationError && (
              <div className="flex items-center gap-2 text-destructive text-xs mt-2">
                <AlertCircle className="w-4 h-4" strokeWidth={1.5} />
                {validationError}
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <img
              src={preview}
              alt="Preview da ficha"
              className="w-full rounded-[var(--radius)] border border-border object-cover max-h-96"
            />
            <button
              onClick={clearFile}
              className="absolute top-2 right-2 w-8 h-8 bg-background/80 rounded-full flex items-center justify-center hover:bg-background transition-colors"
            >
              <X className="w-4 h-4 text-foreground" strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* Inputs ocultos */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic"
          className="hidden"
          onChange={handleInputChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleInputChange}
        />

        {/* Botões de ação */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" strokeWidth={1.5} />
            Câmera
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" strokeWidth={1.5} />
            Galeria
          </Button>
        </div>

        {file && (
          <Button
            onClick={handleSubmit}
            disabled={uploading || !file}
            size="lg"
            className="w-full mt-6"
          >
            {uploading ? "Enviando..." : "Enviar para processamento"}
          </Button>
        )}
      </main>
    </div>
  );
}
