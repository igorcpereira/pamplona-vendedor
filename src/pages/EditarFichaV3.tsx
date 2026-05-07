import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Image as ImageIcon, X, User, AlertTriangle, Plus, Trash2, Ruler, ShoppingBag } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, parseDataSemFuso, formatarDataParaBanco, normalizarTelefone, formatarTelefoneInput } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { AudioRecorder } from "@/components/AudioRecorder";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useProvasFicha, useAdicionarProva, useDeletarProva } from "@/hooks/useProvasFicha";
import { useVendasAvulsasFicha, useAdicionarVendaAvulsa, useDeletarVendaAvulsa } from "@/hooks/useVendasAvulsasFicha";

export default function EditarFichaV3() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { imageFile, isNewFicha, isReprocessing, cliente_id, duplicateAlert, duplicateCodigo, isManual } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [isLoadingFicha, setIsLoadingFicha] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);
  const [ficha, setFicha] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wasProcessed, setWasProcessed] = useState(false);
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [isAudioProcessing, setIsAudioProcessing] = useState(false);
  const [showDuplicateBanner, setShowDuplicateBanner] = useState<boolean>(!!duplicateAlert);
  const [showVendaModal, setShowVendaModal] = useState(false);
  const [vendaForm, setVendaForm] = useState({ descricao: "", valor: "", pago: false });

  const { data: provas = [] } = useProvasFicha(id);
  const adicionarProva = useAdicionarProva(id);
  const deletarProva = useDeletarProva(id);

  const { data: vendasAvulsas = [] } = useVendasAvulsasFicha(id);
  const adicionarVendaAvulsa = useAdicionarVendaAvulsa(id);
  const deletarVendaAvulsa = useDeletarVendaAvulsa(id);
  const [formData, setFormData] = useState({
    nome_cliente: "",
    telefone_cliente: "",
    codigo_ficha: "",
    tipo: "aluguel",
    status: "pendente",
    data_retirada: undefined as Date | undefined,
    data_devolucao: undefined as Date | undefined,
    data_festa: undefined as Date | undefined,
    valor: "",
    garantia: "",
    paleto: "",
    calca: "",
    camisa: "",
    sapato: "",
    pago: false,
    observacoes_cliente: "",
    tags: [] as string[],
  });


  useEffect(() => {
    const loadFicha = async () => {
      if (!id) {
        navigate("/fichas");
        return;
      }

      setIsLoadingFicha(true);
      try {
        const { data: fichaData, error } = await supabase
          .from('fichas')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!fichaData) {
          navigate("/fichas");
          return;
        }

        // Detectou ficha duplicada — redireciona para a original e descarta esta
        if (
          fichaData.status === 'erro' &&
          fichaData.erro_etapa === 'ficha_duplicada' &&
          fichaData.ficha_original_id &&
          isNewFicha
        ) {
          await supabase.from('fichas').delete().eq('id', fichaData.id);
          navigate(`/editar-ficha-v3/${fichaData.ficha_original_id}`, {
            state: {
              isNewFicha: false,
              duplicateAlert: true,
              duplicateCodigo: fichaData.codigo_ficha,
            },
            replace: true,
          });
          return;
        }

        setFicha(fichaData);

        if (!fichaData.codigo_ficha && fichaData.status === 'pendente' && !isManual) {
          setIsProcessing(true);
        }

        // Buscar tags do cliente se houver cliente_id
        let clienteTags: string[] = [];
        if (fichaData.cliente_id) {
          try {
            const { data: relacoes, error } = await supabase
              .from('relacao_cliente_tag')
              .select('id_tag, tags(nome)')
              .eq('id_cliente', fichaData.cliente_id);

            if (!error && relacoes) {
              clienteTags = relacoes
                .map(r => (r as any).tags?.nome)
                .filter(Boolean);
            }
          } catch (error) {
            console.error('Erro ao buscar tags:', error);
          }
        }

        setFormData(prev => ({
          ...prev,
          nome_cliente: fichaData.nome_cliente || "",
          telefone_cliente: formatarTelefoneInput(fichaData.telefone_cliente),
          codigo_ficha: fichaData.codigo_ficha || "",
          tipo: fichaData.tipo || "aluguel",
          status: fichaData.status || "pendente",
          data_retirada: parseDataSemFuso(fichaData.data_retirada),
          data_devolucao: parseDataSemFuso(fichaData.data_devolucao),
          data_festa: parseDataSemFuso(fichaData.data_festa),
          valor: fichaData.valor?.toString() || "",
          garantia: fichaData.garantia?.toString() || "",
          paleto: fichaData.paleto || "",
          calca: fichaData.calca || "",
          camisa: fichaData.camisa || "",
          sapato: fichaData.sapato || "",
          pago: fichaData.pago || false,
          // Preserva observações_cliente se já existir
          observacoes_cliente: prev.observacoes_cliente || fichaData.transcricao_audio || "",
          tags: clienteTags,
        }));
      } catch (error) {
        console.error('Erro ao carregar ficha:', error);
        navigate("/fichas");
      } finally {
        setIsLoadingFicha(false);
      }
    };

    loadFicha();
  }, [id, navigate, isNewFicha, isManual]);

  // Subscrição Realtime para updates da ficha
  useEffect(() => {
    if (!id) return;

    console.log('📡 Iniciando subscrição realtime para ficha:', id);

    const channel = supabase
      .channel(`ficha-v3-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'fichas',
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log('🔄 Ficha atualizada via realtime:', payload.new);

          // BLOQUEIO: Não atualizar se estiver gravando ou processando áudio
          if (isAudioRecording || isAudioProcessing) {
            console.log('🔒 Update bloqueado: áudio em uso');
            return;
          }

          const fichaAtualizada = payload.new;
          const codigoAnterior = ficha?.codigo_ficha;
          const codigoNovo = fichaAtualizada.codigo_ficha;

          // Detectar processamento concluído: codigo_ficha mudou de null para um valor
          if (!codigoAnterior && codigoNovo) {
            console.log('✅ Processamento detectado: codigo_ficha preenchido');
            setIsProcessing(false);
            setWasProcessed(true);

            setTimeout(() => {
              setWasProcessed(false);
            }, 5000);
          }

          // Detectou ficha duplicada via realtime — redireciona para a original e descarta esta
          if (
            fichaAtualizada.status === 'erro' &&
            fichaAtualizada.erro_etapa === 'ficha_duplicada' &&
            fichaAtualizada.ficha_original_id &&
            isNewFicha
          ) {
            setIsProcessing(false);
            supabase.from('fichas').delete().eq('id', fichaAtualizada.id).then(() => {});
            navigate(`/editar-ficha-v3/${fichaAtualizada.ficha_original_id}`, {
              state: {
                isNewFicha: false,
                duplicateAlert: true,
                duplicateCodigo: fichaAtualizada.codigo_ficha,
              },
              replace: true,
            });
            return;
          }

          setFicha(fichaAtualizada);

          // Atualizar formData apenas com campos do webhook
          setFormData(prev => ({
            ...prev,
            nome_cliente: fichaAtualizada.nome_cliente || prev.nome_cliente,
            telefone_cliente: fichaAtualizada.telefone_cliente ? formatarTelefoneInput(fichaAtualizada.telefone_cliente) : prev.telefone_cliente,
            codigo_ficha: fichaAtualizada.codigo_ficha || prev.codigo_ficha,
            tipo: fichaAtualizada.tipo || prev.tipo,
            status: fichaAtualizada.status || prev.status,
            data_retirada: fichaAtualizada.data_retirada ? parseDataSemFuso(fichaAtualizada.data_retirada) : prev.data_retirada,
            data_devolucao: fichaAtualizada.data_devolucao ? parseDataSemFuso(fichaAtualizada.data_devolucao) : prev.data_devolucao,
            data_festa: fichaAtualizada.data_festa ? parseDataSemFuso(fichaAtualizada.data_festa) : prev.data_festa,
            valor: fichaAtualizada.valor?.toString() || prev.valor,
            garantia: fichaAtualizada.garantia?.toString() || prev.garantia,
            paleto: fichaAtualizada.paleto || prev.paleto,
            calca: fichaAtualizada.calca || prev.calca,
            camisa: fichaAtualizada.camisa || prev.camisa,
            sapato: fichaAtualizada.sapato || prev.sapato,
            pago: fichaAtualizada.pago ?? prev.pago,
            observacoes_cliente: prev.observacoes_cliente || fichaAtualizada.transcricao_audio || "",
          }));

          // Detectar erro apenas se status for explicitamente 'erro' (e não duplicada — essa já foi tratada acima)
          if (fichaAtualizada.status === 'erro' && fichaAtualizada.erro_etapa !== 'ficha_duplicada') {
            setIsProcessing(false);

            toast({
              title: "Erro ao processar",
              description: "Não foi possível processar a imagem. Você pode preencher manualmente.",
              variant: "destructive"
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Desconectando subscrição realtime');
      supabase.removeChannel(channel);
    };
  }, [id, isAudioRecording, isAudioProcessing, isNewFicha, navigate]);

  const handleTranscription = (text: string) => {
    console.log('Texto recebido da transcrição:', text);
    setFormData(prev => ({ ...prev, observacoes_cliente: text }));
  };

  const handleTagsExtracted = (tags: string[]) => {
    const normalizedTags = tags.map(tag => tag.toLowerCase().trim());

    setFormData(prev => {
      const existingTags = prev.tags.map(tag => tag.toLowerCase());
      const newTags = normalizedTags.filter(tag => !existingTags.includes(tag));

      if (newTags.length > 0) {
        console.log('Adicionando tags:', newTags);
        return { ...prev, tags: [...prev.tags, ...newTags] };
      }
      return prev;
    });
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleAdicionarProva = async () => {
    try {
      await adicionarProva.mutateAsync();
      toast({ title: "Prova registrada", description: "Adicionada com sucesso." });
    } catch (err) {
      console.error("Erro ao adicionar prova:", err);
      toast({
        title: "Erro ao adicionar prova",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeletarProva = async (provaId: string) => {
    try {
      await deletarProva.mutateAsync(provaId);
      toast({ title: "Prova removida" });
    } catch (err) {
      console.error("Erro ao remover prova:", err);
      toast({
        title: "Erro ao remover prova",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleAbrirVendaModal = () => {
    setVendaForm({ descricao: "", valor: "", pago: false });
    setShowVendaModal(true);
  };

  const handleSalvarVenda = async () => {
    if (!vendaForm.descricao.trim()) {
      toast({
        title: "Descrição obrigatória",
        description: "Informe o que foi vendido.",
        variant: "destructive",
      });
      return;
    }
    const valorNum = vendaForm.valor ? parseFloat(vendaForm.valor.replace(",", ".")) : null;
    if (vendaForm.valor && (valorNum === null || Number.isNaN(valorNum))) {
      toast({
        title: "Valor inválido",
        description: "Informe um valor numérico.",
        variant: "destructive",
      });
      return;
    }
    try {
      await adicionarVendaAvulsa.mutateAsync({
        descricao: vendaForm.descricao.trim(),
        valor: valorNum,
        pago: vendaForm.pago,
      });
      setShowVendaModal(false);
      toast({ title: "Venda avulsa adicionada" });
    } catch (err) {
      console.error("Erro ao adicionar venda avulsa:", err);
      toast({
        title: "Erro ao adicionar venda",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeletarVenda = async (vendaId: string) => {
    try {
      await deletarVendaAvulsa.mutateAsync(vendaId);
      toast({ title: "Venda removida" });
    } catch (err) {
      console.error("Erro ao remover venda:", err);
      toast({
        title: "Erro ao remover venda",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    console.log('[handleSave] início — id:', id, 'status:', formData.status);
    setLoading(true);
    try {
      // Validar codigo_ficha único
      if (!formData.codigo_ficha) {
        console.warn('[handleSave] abortando: codigo_ficha vazio');
        toast({
          title: "Erro",
          description: "Código da ficha é obrigatório",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      console.log('[handleSave] checando duplicada para codigo_ficha:', formData.codigo_ficha);
      const { data: fichaExistente, error: dupErr } = await supabase
        .from('fichas')
        .select('id')
        .eq('codigo_ficha', formData.codigo_ficha)
        .neq('id', id)
        .maybeSingle();

      if (dupErr) {
        console.error('[handleSave] erro na checagem de duplicada:', dupErr);
        throw dupErr;
      }

      console.log('[handleSave] resultado duplicada:', fichaExistente);

      if (fichaExistente) {
        console.log('[handleSave] duplicada encontrada — deletando ficha atual e redirecionando');
        const { error: delErr } = await supabase.from('fichas').delete().eq('id', id);
        if (delErr) {
          console.error('[handleSave] erro ao deletar ficha duplicada:', delErr);
          throw delErr;
        }
        navigate(`/editar-ficha-v3/${fichaExistente.id}`, {
          state: {
            isNewFicha: false,
            duplicateAlert: true,
            duplicateCodigo: formData.codigo_ficha,
          },
          replace: true,
        });
        return;
      }

      let clienteId: string | null = null;
      let telefoneNormalizado: string | null = null;

      if (formData.telefone_cliente && formData.telefone_cliente.trim() !== '') {
        telefoneNormalizado = normalizarTelefone(formData.telefone_cliente);
        console.log('[handleSave] telefone informado:', formData.telefone_cliente, '→ normalizado:', telefoneNormalizado);

        if (!telefoneNormalizado) {
          console.warn('[handleSave] abortando: telefone inválido');
          toast({
            title: "Telefone inválido",
            description: "Não foi possível normalizar o telefone. Confira o formato e tente novamente.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const user = (await supabase.auth.getUser()).data.user;
        console.log('[handleSave] chamando criar-cliente para vendedor:', user?.id);

        const { data, error: criarError } = await supabase.functions.invoke('criar-cliente', {
          body: {
            nome: formData.nome_cliente || 'Cliente sem nome',
            telefone: telefoneNormalizado,
            vendedor_id: user?.id,
            unidade_id: profile?.unidade_id ?? null,
          },
        });

        console.log('[handleSave] retorno criar-cliente:', { data, criarError });

        if (criarError || !data?.cliente_id) {
          console.error('[handleSave] erro ao criar/buscar cliente:', criarError, data);
          throw new Error(data?.error || criarError?.message || 'Falha ao vincular cliente');
        }

        clienteId = data.cliente_id;
      }

      console.log('[handleSave] clienteId final:', clienteId);

      // Ao salvar, transiciona para 'ativa' tanto a partir de 'pendente' quanto 'erro'
      const novoStatus = ['pendente', 'erro'].includes(formData.status) ? 'ativa' : formData.status;

      const updateData: any = {
        nome_cliente: formData.nome_cliente || null,
        telefone_cliente: telefoneNormalizado || (formData.telefone_cliente?.trim() || null),
        codigo_ficha: formData.codigo_ficha || null,
        tipo: formData.tipo || null,
        data_retirada: formatarDataParaBanco(formData.data_retirada),
        data_devolucao: formatarDataParaBanco(formData.data_devolucao),
        data_festa: formatarDataParaBanco(formData.data_festa),
        valor: formData.valor ? parseFloat(formData.valor.toString()) : null,
        garantia: formData.garantia ? parseFloat(formData.garantia.toString()) : null,
        paleto: formData.paleto || null,
        calca: formData.calca || null,
        camisa: formData.camisa || null,
        sapato: formData.sapato || null,
        pago: formData.pago,
        transcricao_audio: formData.observacoes_cliente || null,
        cliente_id: clienteId,
        status: novoStatus,
        updated_at: new Date().toISOString(),
      };

      // Se está saindo de 'erro' para 'ativa', limpa marcadores de erro
      if (formData.status === 'erro' && novoStatus === 'ativa') {
        updateData.erro_etapa = null;
        updateData.ficha_original_id = null;
      }

      console.log('[handleSave] updateData:', updateData);
      const { error } = await supabase
        .from("fichas")
        .update(updateData)
        .eq("id", id);

      if (error) {
        console.error('[handleSave] erro ao atualizar ficha:', error);
        throw error;
      }
      console.log('[handleSave] ficha atualizada com sucesso');

      const isProva = ficha?.prova1_data || ficha?.prova2_data || ficha?.prova3_data;
      if (!isProva) {
        supabase.functions.invoke('notificar-ficha-whatsapp', {
          body: { ficha_id: id }
        }).catch(err => {
          console.error('Erro ao enviar notificação WhatsApp:', err);
        });
      }

      if (clienteId && formData.tags.length > 0) {
        console.log('Salvando tags para cliente:', clienteId);

        const tagIds: string[] = [];

        for (const tagNome of formData.tags) {
          const tagNomeLower = tagNome.toLowerCase().trim();

          const { data: tagExistente, error: searchTagError } = await supabase
            .from('tags')
            .select('id')
            .eq('nome', tagNomeLower)
            .maybeSingle();

          if (searchTagError) {
            console.error('Erro ao buscar tag:', searchTagError);
            continue;
          }

          if (tagExistente) {
            tagIds.push(tagExistente.id);
          } else {
            const { data: novaTag, error: insertTagError } = await supabase
              .from('tags')
              .insert({ nome: tagNomeLower })
              .select('id')
              .single();

            if (insertTagError) {
              console.error('Erro ao criar tag:', insertTagError);
              continue;
            }

            if (novaTag) {
              tagIds.push(novaTag.id);
            }
          }
        }

        await supabase
          .from('relacao_cliente_tag')
          .delete()
          .eq('id_cliente', clienteId);

        if (tagIds.length > 0) {
          const relacoes = tagIds.map(tagId => ({
            id_cliente: clienteId,
            id_tag: tagId
          }));

          const { error: insertRelacoesError } = await supabase
            .from('relacao_cliente_tag')
            .insert(relacoes);

          if (insertRelacoesError) {
            console.error('Erro ao criar relações:', insertRelacoesError);
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['fichas-processadas'] });

      console.log('[handleSave] navegando — cliente_id state:', cliente_id);
      if (cliente_id) {
        navigate(`/cliente/${cliente_id}`);
      } else {
        navigate("/fichas");
      }
    } catch (error) {
      console.error("Erro ao atualizar ficha:", error);
      const message = error instanceof Error ? error.message : "Não foi possível salvar a ficha. Tente novamente.";
      toast({
        title: "Erro ao salvar ficha",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(null);
  };

  const handleImageError = () => {
    setImageError('Não foi possível carregar a imagem. Verifique se a URL está correta.');
    setImageLoading(false);
  };

  const handleOpenImageModal = async () => {
    if (!ficha?.url_bucket) return;
    setImageLoading(true);
    setImageError(null);
    setSignedImageUrl(null);
    setShowImageModal(true);

    const { data, error } = await supabase.storage
      .from('fichas')
      .createSignedUrl(ficha.url_bucket, 60);

    if (error || !data?.signedUrl) {
      setImageError('Não foi possível gerar o link da imagem.');
      setImageLoading(false);
      return;
    }

    setSignedImageUrl(data.signedUrl);
  };

  if (isLoadingFicha) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="Carregando..." />
        <main className="flex-1 p-4 pb-20">
          <div className="max-w-4xl mx-auto space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Editar Ficha" />

      <main className="flex-1 p-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (cliente_id) {
                  navigate(`/cliente/${cliente_id}`);
                } else {
                  navigate("/fichas");
                }
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Editar Ficha</h1>
          </div>

          {showDuplicateBanner && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Esta ficha já existe no sistema</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  {duplicateCodigo ? `A ficha #${duplicateCodigo} já estava cadastrada. ` : ''}
                  Você foi redirecionado para a ficha original.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDuplicateBanner(false)}
                className="text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 flex-shrink-0"
                aria-label="Fechar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {isProcessing && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Processando dados da ficha...</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">Os campos serão preenchidos automaticamente.</p>
              </div>
            </div>
          )}

          {wasProcessed && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Dados da ficha processados com sucesso</p>
              </div>
            </div>
          )}

          {ficha?.status === 'erro' && isNewFicha && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">Erro ao processar imagem</p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">Você pode preencher os campos manualmente ou reenviar a imagem.</p>
            </div>
          )}

          <div className="mb-4 flex gap-2">
            {ficha?.url_bucket && (
              <Button
                type="button"
                onClick={handleOpenImageModal}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Ver Ficha Original
              </Button>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => ficha?.cliente_id && navigate(`/cliente/${ficha.cliente_id}`)}
                    disabled={!ficha?.cliente_id}
                    className={`${ficha?.url_bucket ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2`}
                  >
                    <User className="h-4 w-4" />
                    Ver Cliente
                  </Button>
                </TooltipTrigger>
                {!ficha?.cliente_id && (
                  <TooltipContent>
                    <p>Cliente será vinculado ao salvar a ficha</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="space-y-6 [&_.border-input]:border-foreground/30">
            {/* Observações do Cliente */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Observações do Cliente</h3>
              <AudioRecorder
                onTranscriptionComplete={handleTranscription}
                onTagsExtracted={handleTagsExtracted}
                onRecordingStart={() => setIsAudioRecording(true)}
                onRecordingStop={() => setIsAudioRecording(false)}
                onProcessingStart={() => setIsAudioProcessing(true)}
                onProcessingEnd={() => setIsAudioProcessing(false)}
              />
              <Textarea
                id="observacoes_cliente"
                name="observacoes_cliente"
                value={formData.observacoes_cliente}
                onChange={(e) => setFormData({ ...formData, observacoes_cliente: e.target.value })}
                placeholder="Observações gerais sobre o atendimento..."
                className="min-h-[100px]"
              />
            </div>

            <Separator />

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {formData.tags.length > 0 ? (
                  formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </div>
            </div>

            <Separator />

            {/* Cabeçalho */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Cabeçalho</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_cliente">Nome</Label>
                    <Input
                      id="nome_cliente"
                      name="nome_cliente"
                      value={formData.nome_cliente}
                      onChange={(e) => setFormData({ ...formData, nome_cliente: e.target.value })}
                      placeholder="Nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone_cliente">Telefone</Label>
                    <Input
                      id="telefone_cliente"
                      name="telefone_cliente"
                      value={formData.telefone_cliente}
                      onChange={(e) => setFormData({ ...formData, telefone_cliente: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo_ficha">Código da Ficha</Label>
                    <Input
                      id="codigo_ficha"
                      name="codigo_ficha"
                      value={formData.codigo_ficha}
                      onChange={(e) => setFormData({ ...formData, codigo_ficha: e.target.value })}
                      placeholder="Código"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Atendimento</Label>
                    <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aluguel">Aluguel</SelectItem>
                        <SelectItem value="venda">Venda</SelectItem>
                        <SelectItem value="ajuste">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Input
                      id="status"
                      name="status"
                      value={formData.status === "pendente" ? "Pendente" : formData.status === "ativa" ? "Ativa" : formData.status === "erro" ? "Erro" : formData.status}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Datas */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Datas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Data de Retirada</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.data_retirada && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.data_retirada ? format(formData.data_retirada, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.data_retirada}
                        onSelect={(date) => setFormData({ ...formData, data_retirada: date })}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Data de Devolução</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.data_devolucao && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.data_devolucao ? format(formData.data_devolucao, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.data_devolucao}
                        onSelect={(date) => setFormData({ ...formData, data_devolucao: date })}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Data da Festa</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.data_festa && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.data_festa ? format(formData.data_festa, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.data_festa}
                        onSelect={(date) => setFormData({ ...formData, data_festa: date })}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <Separator />

            {/* Detalhes do Item */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Detalhes do Item</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paleto">Paletó</Label>
                  <Input
                    id="paleto"
                    name="paleto"
                    value={formData.paleto}
                    onChange={(e) => setFormData({ ...formData, paleto: e.target.value })}
                    placeholder="Número"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calca">Calça</Label>
                  <Input
                    id="calca"
                    name="calca"
                    value={formData.calca}
                    onChange={(e) => setFormData({ ...formData, calca: e.target.value })}
                    placeholder="Número"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="camisa">Camisa</Label>
                  <Input
                    id="camisa"
                    name="camisa"
                    value={formData.camisa}
                    onChange={(e) => setFormData({ ...formData, camisa: e.target.value })}
                    placeholder="Número"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sapato">Sapato</Label>
                  <Input
                    id="sapato"
                    name="sapato"
                    value={formData.sapato}
                    onChange={(e) => setFormData({ ...formData, sapato: e.target.value })}
                    placeholder="Número"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Provas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Provas {provas.length > 0 && <span className="text-muted-foreground text-sm font-normal">({provas.length})</span>}
                </h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAdicionarProva}
                  disabled={adicionarProva.isPending || !id}
                >
                  {adicionarProva.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                  Adicionar Prova
                </Button>
              </div>
              {provas.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma prova registrada.</p>
              ) : (
                <div className="space-y-1">
                  {provas.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm p-2 rounded border border-border">
                      <span>
                        {format(new Date(p.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeletarProva(p.id)}
                        disabled={deletarProva.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Vendas Avulsas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Vendas Avulsas {vendasAvulsas.length > 0 && <span className="text-muted-foreground text-sm font-normal">({vendasAvulsas.length})</span>}
                </h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAbrirVendaModal}
                  disabled={!id}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Venda Avulsa
                </Button>
              </div>
              {vendasAvulsas.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma venda avulsa registrada.</p>
              ) : (
                <div className="space-y-2">
                  {vendasAvulsas.map((v) => (
                    <div key={v.id} className="flex items-start justify-between gap-3 text-sm p-3 rounded border border-border">
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="truncate">{v.descricao || "(sem descrição)"}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{v.valor != null ? Number(v.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-"}</span>
                          <span>{v.pago ? "Pago" : "Não pago"}</span>
                          <span>{format(new Date(v.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                        onClick={() => handleDeletarVenda(v.id)}
                        disabled={deletarVendaAvulsa.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* Pagamento */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Pagamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    name="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="0,00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="garantia">Garantia (R$)</Label>
                  <Input
                    id="garantia"
                    name="garantia"
                    type="number"
                    step="0.01"
                    value={formData.garantia}
                    onChange={(e) => setFormData({ ...formData, garantia: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="pago"
                  checked={formData.pago}
                  onCheckedChange={(checked) => setFormData({ ...formData, pago: checked })}
                />
                <Label htmlFor="pago">Pagamento realizado</Label>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/fichas")}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                variant="success"
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lançar Pedido
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Imagem */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogTitle className="sr-only">Visualização da Ficha Original</DialogTitle>
          <DialogDescription className="sr-only">
            Imagem digitalizada da ficha de atendimento original
          </DialogDescription>
          <div className="relative w-full h-full flex items-center justify-center">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-background">
                <p className="text-destructive">{imageError}</p>
              </div>
            )}
            {signedImageUrl && (
              <img
                src={signedImageUrl}
                alt="Ficha Original"
                className="max-w-full max-h-[80vh] object-contain"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Venda Avulsa */}
      <Dialog open={showVendaModal} onOpenChange={setShowVendaModal}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Adicionar Venda Avulsa</DialogTitle>
          <DialogDescription>Vinculada à ficha #{formData.codigo_ficha || ficha?.codigo_ficha || "—"}</DialogDescription>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="venda_descricao">Descrição</Label>
              <Textarea
                id="venda_descricao"
                value={vendaForm.descricao}
                onChange={(e) => setVendaForm({ ...vendaForm, descricao: e.target.value })}
                placeholder="Ex: Gravata azul, lenço de seda..."
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venda_valor">Valor (R$)</Label>
              <Input
                id="venda_valor"
                type="number"
                step="0.01"
                value={vendaForm.valor}
                onChange={(e) => setVendaForm({ ...vendaForm, valor: e.target.value })}
                placeholder="0,00"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="venda_pago"
                checked={vendaForm.pago}
                onCheckedChange={(checked) => setVendaForm({ ...vendaForm, pago: checked })}
              />
              <Label htmlFor="venda_pago">Pagamento realizado</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowVendaModal(false)}
                disabled={adicionarVendaAvulsa.isPending}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSalvarVenda}
                disabled={adicionarVendaAvulsa.isPending}
                className="flex-1"
              >
                {adicionarVendaAvulsa.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
