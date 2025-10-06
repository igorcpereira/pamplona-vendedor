import { useState, useRef } from "react";
import { Camera, Upload, Edit, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const NewRegistration = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showLoadingDialog, setShowLoadingDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [webhookResponse, setWebhookResponse] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const sendImageToWebhook = async (file: File) => {
    setIsUploading(true);
    setShowLoadingDialog(true);
    
    try {
      const now = new Date();
      const formData = new FormData();
      formData.append("image", file);
      formData.append("dia", now.getDate().toString());
      formData.append("mes", (now.getMonth() + 1).toString());
      formData.append("ano", now.getFullYear().toString());
      formData.append("hora", now.getHours().toString());
      formData.append("minuto", now.getMinutes().toString());
      formData.append("segundo", now.getSeconds().toString());
      formData.append("timestamp", now.toISOString());
      
      const response = await fetch("https://n8n.agenciakadin.com.br/webhook-test/pamplona", {
        method: "POST",
        body: formData,
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Resposta do webhook:", result);
      
      setWebhookResponse(result);
      setShowResponseDialog(true);
      toast.success("Imagem enviada com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar imagem:", error);
      toast.error("Erro ao enviar imagem. Verifique sua conexão e tente novamente.");
    } finally {
      setIsUploading(false);
      setShowLoadingDialog(false);
    }
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

  const handleCancelSend = () => {
    setShowConfirmDialog(false);
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

      <Dialog open={showLoadingDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Processando Imagem</DialogTitle>
            <DialogDescription>
              Aguarde enquanto processamos a ficha de atendimento...
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-muted-foreground">Enviando para o servidor...</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Ficha de Atendimento</DialogTitle>
            <DialogDescription>
              Dados extraídos da imagem
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] w-full">
            {webhookResponse && (() => {
              const parsedData = typeof webhookResponse.resposta === 'string' 
                ? JSON.parse(webhookResponse.resposta) 
                : webhookResponse.resposta || {};
              
              const { cabecalho, paleto, calca, camisa, colete, gravata, rodape } = parsedData;

              const renderCabecalho = (data: any) => {
                if (!data) return null;
                return (
                  <div className="mb-8 pb-6 border-b-2 border-border">
                    <div className="grid grid-cols-12 gap-4 mb-3">
                      <div className="col-span-8">
                        <Label className="text-xs font-bold">CLIENTE</Label>
                        <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                          {data.cliente || '-'}
                        </div>
                      </div>
                      <div className="col-span-4">
                        <Label className="text-xs font-bold">NÚMERO DA FICHA</Label>
                        <div className="text-2xl font-bold text-destructive px-3 py-1">
                          {data.numero_da_ficha || '-'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-12 gap-4 mb-3">
                      <div className="col-span-5">
                        <Label className="text-xs font-bold">FONES</Label>
                        <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                          {data.fones || '-'}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs font-bold">MEDIDA</Label>
                        <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                          {data.medida || '-'}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs font-bold">PROVA 1</Label>
                        <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                          {data.prova_1 || '-'}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs font-bold">PROVA 2</Label>
                        <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                          {data.prova_2 || '-'}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs font-bold">HORA</Label>
                        <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                          {data.hora || '-'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs font-bold">DATA DA RESERVA</Label>
                        <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                          {data.data_da_reserva || '-'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-bold">DATA DE DEVOLUÇÃO</Label>
                        <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                          {data.data_de_devolucao || '-'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-bold">DATA DA FESTA</Label>
                        <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                          {data.data_da_festa || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              };

              const renderPaleto = (data: any) => {
                if (!data) return null;
                return (
                  <div className="mb-8 pb-6 border-b-2 border-border">
                    <h3 className="text-base font-bold mb-4 bg-accent/50 p-2 rounded-md uppercase">
                      Paletó
                    </h3>
                    
                    <div className="mb-3">
                      <Label className="text-xs font-bold">PALETÓ</Label>
                      <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                        {data.paleto || '-'}
                      </div>
                    </div>

                    <div className="mb-3">
                      <Label className="text-xs font-bold">SOB MEDIDA</Label>
                      <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                        {data.sob_medida || '-'}
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4 mb-3">
                      <div className="col-span-4">
                        <Label className="text-xs font-bold">CINTURA</Label>
                        <div className="flex gap-2 items-center mt-1">
                          <span className="text-xs">SOLTAR:</span>
                          <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                            {data.cintura_soltar || '-'}
                          </div>
                          <span className="text-xs">APERTAR:</span>
                          <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                            {data.cintura_apertar || '-'}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs font-bold">MEDIDA</Label>
                        <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                          {data.cintura_medida || '-'}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs font-bold">MARCA</Label>
                        <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                          {data.cintura_marca || '-'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4 mb-3">
                      <div className="col-span-4">
                        <Label className="text-xs font-bold">COMPRIMENTO</Label>
                        <div className="flex gap-2 items-center mt-1">
                          <span className="text-xs">+/-:</span>
                          <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                            {data.comprimento_ajuste || '-'}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs font-bold">MEDIDA</Label>
                        <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                          {data.comprimento_medida || '-'}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs font-bold">MARCA</Label>
                        <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                          {data.comprimento_marca || '-'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4 mb-3">
                      <div className="col-span-4">
                        <Label className="text-xs font-bold">MANGA</Label>
                        <div className="flex gap-2 items-center mt-1">
                          <span className="text-xs">+/-:</span>
                          <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                            {data.manga_ajuste || '-'}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs font-bold">MEDIDA</Label>
                        <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                          {data.manga_medida || '-'}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs font-bold">MARCA</Label>
                        <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                          {data.manga_marca || '-'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-bold">OUTROS</Label>
                      <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                        {data.outros || '-'}
                      </div>
                    </div>
                  </div>
                );
              };

              const renderCalca = (data: any) => {
                if (!data) return null;
                return (
                  <div className="mb-8 pb-6 border-b-2 border-border">
                    <h3 className="text-base font-bold mb-4 bg-accent/50 p-2 rounded-md uppercase">
                      Calça
                    </h3>
                    
                    <div className="mb-3">
                      <Label className="text-xs font-bold">CALÇA</Label>
                      <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                        {data.calca || '-'}
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label className="text-xs font-bold">SOB MEDIDA</Label>
                      <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                        {data.sob_medida || '-'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      {/* Coluna Esquerda */}
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs font-bold">CINTURA</Label>
                          <div className="flex gap-2 items-center mt-1 mb-2">
                            <span className="text-xs">SOLTAR:</span>
                            <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                              {data.cintura_soltar || '-'}
                            </div>
                            <span className="text-xs">APERTAR:</span>
                            <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                              {data.cintura_apertar || '-'}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">MEDIDA</Label>
                              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md mt-1">
                                {data.cintura_medida || '-'}
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">MARCA</Label>
                              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md mt-1">
                                {data.cintura_marca || '-'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs font-bold">JOELHO</Label>
                          <div className="flex gap-2 items-center mt-1 mb-2">
                            <span className="text-xs">SOLTAR:</span>
                            <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                              {data.joelho_soltar || '-'}
                            </div>
                            <span className="text-xs">APERTAR:</span>
                            <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                              {data.joelho_apertar || '-'}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">BOCA</Label>
                              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md mt-1">
                                {data.joelho_boca || '-'}
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">MARCA</Label>
                              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md mt-1">
                                {data.joelho_marca || '-'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Coluna Direita */}
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs font-bold">COXA</Label>
                          <div className="flex gap-2 items-center mt-1 mb-2">
                            <span className="text-xs">SOLTAR:</span>
                            <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                              {data.coxa_soltar || '-'}
                            </div>
                            <span className="text-xs">APERTAR:</span>
                            <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                              {data.coxa_apertar || '-'}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">MARCA</Label>
                            <div className="text-sm bg-muted/30 px-2 py-1 rounded-md mt-1">
                              {data.coxa_marca || '-'}
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs font-bold">BARRA</Label>
                          <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1 mb-2">
                            {data.barra_observacao || '-'}
                          </div>
                          <div className="flex gap-2 items-center mb-2">
                            <span className="text-xs">SOLTAR:</span>
                            <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                              {data.barra_soltar || '-'}
                            </div>
                            <span className="text-xs">APERTAR:</span>
                            <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                              {data.barra_apertar || '-'}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">MEDIDA</Label>
                            <div className="text-sm bg-muted/30 px-2 py-1 rounded-md mt-1">
                              {data.barra_medida || '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              };

              const renderCamisa = (data: any) => {
                if (!data) return null;
                return (
                  <div className="mb-8 pb-6 border-b-2 border-border">
                    <h3 className="text-base font-bold mb-4 bg-accent/50 p-2 rounded-md uppercase">
                      Camisa
                    </h3>
                    
                    <div className="mb-3">
                      <Label className="text-xs font-bold">CAMISA</Label>
                      <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                        {data.camisa || '-'}
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label className="text-xs font-bold">SOB MEDIDA</Label>
                      <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                        {data.sob_medida || '-'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      {/* Coluna Esquerda */}
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs font-bold">COLARINHO</Label>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs">☐ ORIGINAL:</span>
                              <div className="text-sm bg-muted/30 px-2 py-1 rounded flex-1">
                                {data.colarinho_original || '-'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs">☐ PONTA:</span>
                              <div className="text-sm bg-muted/30 px-2 py-1 rounded flex-1">
                                {data.colarinho_ponta || '-'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs">☐ ALARGADOR:</span>
                              <div className="text-sm bg-muted/30 px-2 py-1 rounded flex-1">
                                {data.colarinho_alargador || '-'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs font-bold">CINTURA</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div>
                              <span className="text-xs">☐ PENCE:</span>
                              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md mt-1">
                                {data.cintura_pence || '-'}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs">☐ LATERAL:</span>
                              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md mt-1">
                                {data.cintura_lateral || '-'}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Label className="text-xs">MARCA</Label>
                            <div className="text-sm bg-muted/30 px-2 py-1 rounded-md mt-1">
                              {data.cintura_marca || '-'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Coluna Direita */}
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs font-bold">MANGA</Label>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            <div>
                              <span className="text-xs">☐ -:</span>
                              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md mt-1">
                                {data.manga_menos || '-'}
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">MEDIDA</Label>
                              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md mt-1">
                                {data.manga_medida || '-'}
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">APERTAR</Label>
                              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md mt-1">
                                {data.manga_apertar || '-'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs font-bold">OUTROS</Label>
                          <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                            {data.outros || '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              };

              const renderColete = (data: any) => {
                if (!data) return null;
                return (
                  <div className="mb-8 pb-6 border-b-2 border-border">
                    <h3 className="text-base font-bold mb-4 bg-accent/50 p-2 rounded-md uppercase">
                      Colete
                    </h3>
                    
                    <div className="mb-4">
                      <Label className="text-xs font-bold">SOB MEDIDA</Label>
                      <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                        {data.sob_medida || '-'}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs font-bold">PEITO</Label>
                        <div className="flex gap-2 items-center mt-2">
                          <span className="text-xs">SOLTAR:</span>
                          <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                            {data.peito_soltar || '-'}
                          </div>
                          <span className="text-xs">APERTAR:</span>
                          <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                            {data.peito_apertar || '-'}
                          </div>
                          <span className="text-xs ml-4">☐ MARCA:</span>
                          <div className="text-sm bg-muted/30 px-2 py-1 rounded flex-1">
                            {data.peito_marca || '-'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-bold">CINTURA</Label>
                        <div className="flex gap-2 items-center mt-2">
                          <span className="text-xs">SOLTAR:</span>
                          <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                            {data.cintura_soltar || '-'}
                          </div>
                          <span className="text-xs">APERTAR:</span>
                          <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                            {data.cintura_apertar || '-'}
                          </div>
                          <span className="text-xs ml-4">☐ MARCA:</span>
                          <div className="text-sm bg-muted/30 px-2 py-1 rounded flex-1">
                            {data.cintura_marca || '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              };

              const renderGravata = (data: any) => {
                if (!data) return null;
                return (
                  <div className="mb-8 pb-6 border-b-2 border-border">
                    <h3 className="text-base font-bold mb-4 bg-accent/50 p-2 rounded-md uppercase">
                      Gravata
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-bold">MODELO</Label>
                        <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                          {data.modelo || '-'}
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-bold">MEDIDA</Label>
                        <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                          {data.medida || '-'}
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-bold">OUTROS</Label>
                        <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
                          {data.outros || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              };
              const renderSection = (title: string, data: any) => {
                if (!data) return null;
                
                return (
                  <div className="mb-6 pb-6 border-b border-border last:border-0">
                    <h3 className="text-lg font-semibold text-foreground mb-4 bg-accent/50 p-2 rounded-md">
                      {title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-2">
                      {Object.entries(data).map(([key, value]) => (
                        <div key={key} className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm text-foreground bg-muted/30 px-3 py-2 rounded-md">
                            {value !== null && value !== undefined && value !== '' 
                              ? String(value) 
                              : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              };

              return (
                <div className="space-y-4 p-4">
                  {renderCabecalho(cabecalho)}
                  {renderPaleto(paleto)}
                  {renderCalca(calca)}
                  {renderCamisa(camisa)}
                  {renderColete(colete)}
                  {renderGravata(gravata)}
                  {renderSection("Rodapé", rodape)}
                </div>
              );
            })()}
          </ScrollArea>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowResponseDialog(false);
                navigate("/");
              }}
              className="w-full sm:w-auto"
            >
              Fechar e Voltar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default NewRegistration;
