import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onTagsExtracted?: (tags: string[]) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onProcessingStart?: () => void;
  onProcessingEnd?: () => void;
}

export function AudioRecorder({ 
  onTranscriptionComplete, 
  onTagsExtracted,
  onRecordingStart,
  onRecordingStop,
  onProcessingStart,
  onProcessingEnd
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await sendAudioToWebhook(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingStart?.();
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onRecordingStop?.();
    }
  };

  const sendAudioToWebhook = async (audioBlob: Blob) => {
    setIsProcessing(true);
    onProcessingStart?.();
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const { data, error } = await supabase.functions.invoke('transcrever-audio', {
        body: formData,
      });

      if (error) {
        throw error;
      }

      if (data?.text) {
        onTranscriptionComplete(data.text);
        
        // Extrair tags se existirem
        if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
          console.log('Tags recebidas do webhook:', data.tags);
          onTagsExtracted?.(data.tags);
        }
      } else {
        throw new Error("Formato de resposta inválido");
      }
    } catch (error) {
      console.error("Erro ao processar áudio:", error);
    } finally {
      setIsProcessing(false);
      onProcessingEnd?.();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={startRecording}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      ) : (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={stopRecording}
          className="animate-pulse"
        >
          <Square className="h-4 w-4" />
        </Button>
      )}
      <span className="text-xs text-muted-foreground">
        {isRecording ? "Gravando..." : isProcessing ? "Processando..." : "Gravar áudio"}
      </span>
    </div>
  );
}
