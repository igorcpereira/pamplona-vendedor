import { useState, useRef, useEffect } from "react";
import { Camera, Upload, Edit, X, Check, RefreshCw, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import Logo from "@/components/Logo";

const TesteEnvio = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [currentFichaId, setCurrentFichaId] = useState<string | null>(null);

  interface FichaStats {
    id: string;
    codigo_ficha: string | null;
    nome_cliente: string | null;
    tempo_processamento: number | null;
    created_at: string;
  }
  const [ultimasFichas, setUltimasFichas] = useState<FichaStats[]>([]);

  const carregarUltimasFichas = async () => {
    const { data } = await supabase
      .from("fichas")
      .select("id, codigo_ficha, nome_cliente, tempo_processamento, created_at")
      .not("tempo_processamento", "is", null)
      .order("created_at", { ascending: false })
      .limit(5);
    if (data) setUltimasFichas(data);
  };

  useEffect(() => {
    carregarUltimasFichas();
  }, []);

  const sendImageToWebhook = async (file: File) => {
    try {
      setIsUploading(true);

      console.log('Enviando imagem para processar-ficha-v2...');

      const user = (await supabase.auth.getUser()).data.user;

      const formData = new FormData();
      formData.append('image', file);
      formData.append('user_id', user?.id || '');

      const { data, error } = await supabase.functions.invoke('processar-ficha-v2', {
        body: formData,
      });

      if (error) {
        console.error('Erro ao chamar Edge Function:', error);
        throw error;
      }

      console.log('Edge Function resposta:', data);

      if (data.ficha_id) {
        toast.success("Ficha criada! Aguardando processamento...");
        setTimeout(carregarUltimasFichas, 35000);
        navigate(`/editar-ficha/${data.ficha_id}`, {
          state: {
            imageFile: file,
            isNewFicha: true,
          },
        });
      } else {
        throw new Error(data.error || 'Erro ao criar ficha no banco');
      }

    } catch (error: any) {
      console.error('Erro:', error);
      toast.error("Falha ao criar a ficha. Tente novamente.");
      setShowErrorDialog(true);
    } finally {
      setIsUploading(false);
    }
  };

  const reenviarImagem = async () => {
    if (!currentFichaId) return;

    try {
      setShowErrorDialog(false);
      toast.info("Reenviando imagem...");

      navigate(`/editar-ficha/${currentFichaId}`, {
        state: {
          isReprocessing: true,
        },
      });

    } catch (error) {
      console.error('Erro ao reenviar imagem:', error);
      toast.error("Erro ao reenviar imagem");
      setShowErrorDialog(true);
    }
  };

  const handleNovaFoto = () => {
    if (currentFichaId) {
      supabase.from('fichas').delete().eq('id', currentFichaId);
    }

    setShowErrorDialog(false);
    setCurrentFichaId(null);
    setSelectedFile(null);

    cameraInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setShowConfirmDialog(true);
      } else {
        toast.error("Por favor, selecione uma imagem válida.");
      }
    }
  };

  const handleConfirmSend = () => {
    if (selectedFile) {
      sendImageToWebhook(selectedFile);
      setShowConfirmDialog(false);
    }
  };

  const handleCancelSend = async () => {
    setShowConfirmDialog(false);

    if (currentFichaId) {
      await supabase.from('fichas').delete().eq('id', currentFichaId);
      setCurrentFichaId(null);
    }

    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <Header title="Teste de Envio (v2)" />

      {/* Logo de fundo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <Logo className="w-96 h-96 object-contain" />
      </div>

      <main className="px-4 py-6 max-w-md mx-auto relative z-10">
        <div className="bg-card rounded-lg p-8 shadow-sm">
          {/* Badge de identificação */}
          <div className="flex justify-center mb-4">
            <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded tracking-wide">
              AMBIENTE DE TESTE — v2 (OpenAI direto)
            </span>
          </div>

          {/* Camera Icon Area */}
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <Camera className="w-16 h-16 text-amber-500" />
            </div>
          </div>

          {/* Title and Description */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              [TESTE] Capturar Ficha de Atendimento
            </h2>
            <p className="text-muted-foreground text-sm">
              Versão de teste com OCR direto via OpenAI. Tire uma foto ou carregue uma imagem.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              onClick={handleCameraClick}
              disabled={isUploading}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 hover:shadow-lg transition-all text-white"
            >
              <Camera className="w-5 h-5 mr-2" />
              {isUploading ? "Enviando [teste]..." : "[Teste] Tirar Foto"}
            </Button>

            <Button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="w-full h-12 bg-gradient-to-r from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 hover:shadow-lg transition-all text-amber-800 border border-amber-300"
            >
              <Upload className="w-5 h-5 mr-2" />
              [Teste] Carregar Imagem
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-card text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Manual Registration Link */}
          <button className="w-full py-3 text-amber-600 hover:text-amber-800 transition-colors flex items-center justify-center gap-2 font-semibold">
            <Edit className="w-4 h-4" />
            <span className="font-medium">[Teste] Cadastrar Manualmente</span>
          </button>

          {/* Hidden File Inputs */}
          <input
            ref={cameraInputRef}
            id="camera-input"
            name="camera-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            id="file-input"
            name="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </main>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Imagem</DialogTitle>
            <DialogDescription>
              Verifique se a imagem está correta antes de enviar
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="relative w-full aspect-[4/3] bg-muted rounded-lg overflow-hidden">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Prévia"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Esta é a imagem que será enviada. Confirma?
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCancelSend}
              disabled={isUploading}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSend}
              disabled={isUploading}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              {isUploading ? "Enviando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Erro ao processar imagem</AlertDialogTitle>
            <AlertDialogDescription>
              Não foi possível extrair os dados da ficha. Tente novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={reenviarImagem}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reenviar Imagem
            </Button>
            <Button
              onClick={handleNovaFoto}
              className="w-full sm:w-auto"
            >
              <Camera className="w-4 h-4 mr-2" />
              Tirar Nova Foto
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {ultimasFichas.length > 0 && (
        <div className="px-4 pb-4 max-w-md mx-auto relative z-10">
          <div className="bg-card rounded-lg p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-foreground">Últimas fichas processadas</h3>
            </div>

            <div className="space-y-2 mb-4">
              {ultimasFichas.map((f) => (
                <div key={f.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate max-w-[60%]">
                    {f.codigo_ficha
                      ? `#${f.codigo_ficha}`
                      : f.nome_cliente
                      ? f.nome_cliente
                      : f.id.slice(0, 8)}
                  </span>
                  <span className="font-mono font-medium text-amber-600">
                    {f.tempo_processamento}s
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Média de processamento</span>
              <span className="font-mono font-bold text-amber-600">
                {Math.round(
                  ultimasFichas.reduce((acc, f) => acc + (f.tempo_processamento ?? 0), 0) /
                    ultimasFichas.length
                )}s
              </span>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default TesteEnvio;
