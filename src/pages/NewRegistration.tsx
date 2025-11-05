import { useState, useRef, useEffect } from "react";
import { Camera, Upload, Edit, X, Check, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EditFichaModal } from "@/components/EditFichaModal";

const NewRegistration = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // Novo fluxo: controle da ficha e modal
  const [currentFichaId, setCurrentFichaId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [fichaData, setFichaData] = useState<any>(null);
  const [isLoadingFicha, setIsLoadingFicha] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Limpa polling quando componente desmonta
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Função para iniciar polling da ficha
  const startPolling = (fichaId: string) => {
    let pollCount = 0;
    const maxPolls = 15; // 30 segundos (2s * 15)

    pollingIntervalRef.current = setInterval(async () => {
      pollCount++;

      if (pollCount >= maxPolls) {
        // Timeout - parar polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        toast.error("Tempo limite excedido ao processar ficha");
        return;
      }

      // Busca status da ficha
      const { data: ficha, error } = await supabase
        .from('fichas')
        .select('*')
        .eq('id', fichaId)
        .single();

      if (error) {
        console.error('Erro ao buscar ficha:', error);
        return;
      }

      console.log('Polling ficha:', ficha.status);

      if (ficha.status === 'ativa') {
        // Ficha processada com sucesso
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        
        setFichaData(ficha);
        setIsLoadingFicha(false);
        toast.success("Ficha processada com sucesso!");
        
      } else if (ficha.status === 'erro') {
        // Erro no processamento
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        
        setShowEditModal(false);
        setShowErrorDialog(true);
        setIsLoadingFicha(false);
      }
    }, 2000); // Poll a cada 2 segundos
  };

  const sendImageToWebhook = async (file: File) => {
    try {
      setIsUploading(true);

      console.log('Enviando imagem para Edge Function...');

      const user = (await supabase.auth.getUser()).data.user;
      
      const formData = new FormData();
      formData.append('image', file);
      formData.append('user_id', user?.id || '');

      // Chama a Edge Function
      const { data, error } = await supabase.functions.invoke('processar-ficha', {
        body: formData,
      });

      if (error) {
        console.error('Erro ao chamar Edge Function:', error);
        throw error;
      }

      console.log('Edge Function resposta:', data);

      if (data.ficha_id) {
        // Modal abre SEMPRE que a ficha foi criada
        setCurrentFichaId(data.ficha_id);
        setIsLoadingFicha(true);
        setFichaData({ id: data.ficha_id, status: 'processando' });
        setShowEditModal(true);
        
        // Inicia polling independente do success
        toast.info("Processando ficha...");
        startPolling(data.ficha_id);
        
        // Log para debug
        if (!data.success) {
          console.warn('Ficha criada mas webhook retornou erro. Polling irá verificar status.');
        }
      } else {
        // Só lança erro se nem a ficha foi criada
        throw new Error(data.error || 'Erro ao criar ficha no banco');
      }

    } catch (error: any) {
      console.error('Erro:', error);
      
      // Se houver ficha criada, excluir
      if (currentFichaId) {
        await supabase.from('fichas').delete().eq('id', currentFichaId);
      }
      
      toast.error("Falha ao enviar a imagem. Tente novamente.");
      setShowErrorDialog(true);
    } finally {
      setIsUploading(false);
    }
  };

  const reenviarImagem = async () => {
    if (!currentFichaId) return;
    
    try {
      setShowErrorDialog(false);
      
      // Busca a imagem da ficha no storage
      const { data: ficha } = await supabase
        .from('fichas')
        .select('url_bucket')
        .eq('id', currentFichaId)
        .single();

      if (!ficha?.url_bucket) {
        throw new Error('Imagem não encontrada');
      }

      // Baixa a imagem do storage
      const { data: imageData } = await supabase.storage
        .from('fichas')
        .download(ficha.url_bucket);

      if (!imageData) {
        throw new Error('Erro ao baixar imagem');
      }

      // Busca webhook re-ler-image
      const { data: webhook } = await supabase
        .from('webhooks')
        .select('webhook')
        .eq('nome', 're-ler-image')
        .single();

      if (!webhook) {
        throw new Error('Webhook re-ler-image não encontrado');
      }

      // Atualiza status para pendente
      await supabase
        .from('fichas')
        .update({ status: 'pendente' })
        .eq('id', currentFichaId);

      // Envia para webhook
      const formData = new FormData();
      formData.append('image', imageData);
      formData.append('ficha_id', currentFichaId);

      await fetch(webhook.webhook, {
        method: 'POST',
        body: formData,
      });
      
      // Abre modal imediatamente com loading
      setIsLoadingFicha(true);
      setFichaData({ id: currentFichaId, status: 'processando' });
      setShowEditModal(true);
      
      // Retoma polling
      toast.info("Processando ficha...");
      startPolling(currentFichaId);
      
    } catch (error) {
      console.error('Erro ao reenviar imagem:', error);
      toast.error("Erro ao reenviar imagem");
      setShowErrorDialog(true);
    }
  };

  const handleNovaFoto = () => {
    // Exclui a ficha com erro
    if (currentFichaId) {
      supabase.from('fichas').delete().eq('id', currentFichaId);
    }
    
    setShowErrorDialog(false);
    setCurrentFichaId(null);
    setFichaData(null);
    setSelectedFile(null);
    
    // Permite nova captura
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
    
    // Se já criou uma ficha, excluir
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
    <div className="min-h-screen bg-background pb-20">
      <Header title="Novo Pré-Cadastro" />
      
      <main className="px-4 py-6 max-w-md mx-auto">
        <div className="bg-card rounded-2xl p-8 shadow-sm">
          {/* Camera Icon Area */}
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-border bg-accent/30 flex items-center justify-center">
              <Camera className="w-16 h-16 text-primary/60" />
            </div>
          </div>

          {/* Title and Description */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Capturar Ficha de Atendimento
            </h2>
            <p className="text-muted-foreground text-sm">
              Tire uma foto da ficha ou carregue uma imagem da sua galeria.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              onClick={handleCameraClick}
              disabled={isUploading}
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg transition-all"
            >
              <Camera className="w-5 h-5 mr-2" />
              {isUploading ? "Enviando..." : "Tirar Foto"}
            </Button>

            <Button
              onClick={handleUploadClick}
              disabled={isUploading}
              variant="secondary"
              className="w-full h-12 bg-gradient-to-r from-secondary to-secondary/90 hover:shadow-lg transition-all"
            >
              <Upload className="w-5 h-5 mr-2" />
              Carregar Imagem
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
          <button className="w-full py-3 text-accent-foreground hover:text-primary transition-colors flex items-center justify-center gap-2">
            <Edit className="w-4 h-4" />
            <span className="font-medium">Cadastrar Manualmente</span>
          </button>

          {/* Hidden File Inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={fileInputRef}
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

      <EditFichaModal
        open={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open);
          if (!open && pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
        }}
        ficha={fichaData}
        isLoading={isLoadingFicha}
        onSuccess={() => {
          setShowEditModal(false);
          toast.success("Ficha salva com sucesso!");
          navigate('/clientes');
        }}
      />

      <BottomNav />
    </div>
  );
};

export default NewRegistration;
