import { useState, useRef, useEffect } from "react";
import { Camera, Upload, Edit, X, Check, RefreshCw, Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";

interface FichaStats {
  id: string;
  codigo_ficha: string | null;
  nome_cliente: string | null;
  tempo_processamento: number | null;
  created_at: string;
}

interface FichaErro {
  id: string;
  codigo_ficha: string | null;
  nome_cliente: string | null;
  created_at: string;
}

const NewRegistration = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingManual, setIsCreatingManual] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [currentFichaId, setCurrentFichaId] = useState<string | null>(null);
  const [ultimasFichas, setUltimasFichas] = useState<FichaStats[]>([]);
  const [errosRecentes, setErrosRecentes] = useState<FichaErro[]>([]);

  const carregarDados = async () => {
    const [fichasRes, errosRes] = await Promise.all([
      supabase
        .from("fichas")
        .select("id, codigo_ficha, nome_cliente, tempo_processamento, created_at")
        .not("tempo_processamento", "is", null)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("fichas")
        .select("id, codigo_ficha, nome_cliente, created_at")
        .eq("status", "erro")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
    if (fichasRes.data) setUltimasFichas(fichasRes.data);
    if (errosRes.data) setErrosRecentes(errosRes.data);
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const sendImageToWebhook = async (file: File) => {
    try {
      setIsUploading(true);

      const user = (await supabase.auth.getUser()).data.user;
      const formData = new FormData();
      formData.append('image', file);
      formData.append('user_id', user?.id || '');

      const { data, error } = await supabase.functions.invoke('processar-ficha-v3', {
        body: formData,
      });

      if (error) throw error;

      if (data.ficha_id) {
        toast.success("Ficha criada! Aguardando processamento...");
        setTimeout(carregarDados, 35000);
        navigate(`/editar-ficha-v3/${data.ficha_id}`, {
          state: { imageFile: file, isNewFicha: true },
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
    setShowErrorDialog(false);
    toast.info("Reenviando imagem...");
    navigate(`/editar-ficha-v3/${currentFichaId}`, { state: { isReprocessing: true } });
  };

  const handleNovaFoto = () => {
    if (currentFichaId) supabase.from('fichas').delete().eq('id', currentFichaId);
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
        setPreviewUrl(URL.createObjectURL(file));
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

  const handleCadastrarManualmente = async () => {
    if (isCreatingManual) return;
    setIsCreatingManual(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user?.id) {
        toast.error("Usuário não autenticado.");
        return;
      }

      const { data: ficha, error } = await supabase
        .from('fichas')
        .insert({
          vendedor_id: user.id,
          unidade_id: profile?.unidade_id ?? null,
          status: 'pendente',
        })
        .select('id')
        .single();

      if (error || !ficha?.id) {
        console.error('Erro ao criar ficha manual:', error);
        toast.error("Não foi possível criar a ficha. Tente novamente.");
        return;
      }

      navigate(`/editar-ficha-v3/${ficha.id}`, {
        state: { isManual: true },
      });
    } finally {
      setIsCreatingManual(false);
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

  const formatarData = (iso: string) => {
    const d = new Date(iso);
    return (
      d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
      ' ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    );
  };

  const labelFicha = (f: { codigo_ficha: string | null; nome_cliente: string | null; id: string }) =>
    f.codigo_ficha ? `#${f.codigo_ficha}` : f.nome_cliente ?? f.id.slice(0, 8);

  const media = ultimasFichas.length
    ? Math.round(
        ultimasFichas.reduce((acc, f) => acc + (f.tempo_processamento ?? 0), 0) /
          ultimasFichas.length
      )
    : null;

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <Header title="Novo Pré-Cadastro" />

      {/* Logo de fundo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <Logo className="w-96 h-96 object-contain" />
      </div>

      <main className="px-4 py-6 max-w-md mx-auto relative z-10 space-y-4">

        {/* Formulário de captura */}
        <div className="bg-card rounded-lg p-8 shadow-sm">
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 rounded-lg border-2 border-dashed border-primary/40 dark:border-primary/70 bg-accent/30 dark:bg-primary/10 flex items-center justify-center">
              <Camera className="w-16 h-16 text-primary/60 dark:text-primary/90" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Capturar Ficha de Atendimento
            </h2>
            <p className="text-muted-foreground text-sm">
              Tire uma foto da ficha ou carregue uma imagem da sua galeria.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <Button
              onClick={() => cameraInputRef.current?.click()}
              disabled={isUploading}
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg transition-all"
            >
              <Camera className="w-5 h-5 mr-2" />
              {isUploading ? "Enviando..." : "Tirar Foto"}
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="secondary"
              className="w-full h-12 bg-gradient-to-r from-secondary to-secondary/90 hover:shadow-lg transition-all"
            >
              <Upload className="w-5 h-5 mr-2" />
              Carregar Imagem
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-card text-muted-foreground">ou</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCadastrarManualmente}
            disabled={isCreatingManual || isUploading}
            className="w-full py-3 text-primary hover:text-accent transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Edit className="w-4 h-4" />
            <span className="font-medium">{isCreatingManual ? "Criando..." : "Cadastrar Manualmente"}</span>
          </button>

          <input ref={cameraInputRef} id="camera-input" name="camera-input" type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
          <input ref={fileInputRef} id="file-input" name="file-input" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>

        {/* Últimas fichas processadas */}
        <div className="bg-card rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Últimas fichas processadas</h3>
          </div>

          {ultimasFichas.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma ficha processada ainda.</p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {ultimasFichas.map((f) => (
                  <div key={f.id} className="flex items-center justify-between text-sm">
                    <div className="flex flex-col min-w-0">
                      <span className="text-foreground truncate">{labelFicha(f)}</span>
                      <span className="text-xs text-muted-foreground">{formatarData(f.created_at)}</span>
                    </div>
                    <span className="font-mono font-medium text-primary ml-4 shrink-0">
                      {f.tempo_processamento}s
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Média de processamento</span>
                <span className="font-mono font-bold text-primary">{media}s</span>
              </div>
            </>
          )}
        </div>

        {/* Erros recentes */}
        <div className="bg-card rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h3 className="text-sm font-semibold text-foreground">Erros recentes</h3>
            {errosRecentes.length > 0 && (
              <span className="ml-auto text-xs font-bold bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                {errosRecentes.length}
              </span>
            )}
          </div>

          {errosRecentes.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum erro recente.</p>
          ) : (
            <div className="space-y-2">
              {errosRecentes.map((f) => (
                <div key={f.id} className="flex items-center justify-between text-sm">
                  <div className="flex flex-col min-w-0">
                    <span className="text-foreground truncate">{labelFicha(f)}</span>
                    <span className="text-xs text-muted-foreground">{formatarData(f.created_at)}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/editar-ficha-v3/${f.id}`)}
                    className="ml-4 shrink-0 text-xs text-primary hover:underline"
                  >
                    ver
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Dialogs */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Imagem</DialogTitle>
            <DialogDescription>Verifique se a imagem está correta antes de enviar</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="relative w-full aspect-[4/3] bg-muted rounded-lg overflow-hidden">
              {previewUrl && <img src={previewUrl} alt="Prévia" className="w-full h-full object-contain" />}
            </div>
            <p className="text-sm text-muted-foreground text-center">Esta é a imagem que será enviada. Confirma?</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancelSend} disabled={isUploading} className="flex-1">
              <X className="w-4 h-4 mr-2" />Cancelar
            </Button>
            <Button onClick={handleConfirmSend} disabled={isUploading} className="flex-1">
              <Check className="w-4 h-4 mr-2" />{isUploading ? "Enviando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Erro ao processar imagem</AlertDialogTitle>
            <AlertDialogDescription>Não foi possível extrair os dados da ficha. Tente novamente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={reenviarImagem} className="w-full sm:w-auto">
              <RefreshCw className="w-4 h-4 mr-2" />Reenviar Imagem
            </Button>
            <Button onClick={handleNovaFoto} className="w-full sm:w-auto">
              <Camera className="w-4 h-4 mr-2" />Tirar Nova Foto
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default NewRegistration;
