import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Busca o webhook URL
    const { data: webhookData, error: webhookError } = await supabaseClient
      .from('webhooks')
      .select('webhook')
      .eq('nome', 'descricao_cliente')
      .single();

    if (webhookError || !webhookData) {
      console.error('Erro ao buscar webhook:', webhookError);
      throw new Error('Webhook não encontrado');
    }

    // Recebe o áudio do frontend
    const formData = await req.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      throw new Error('Áudio não fornecido');
    }

    // Envia para o webhook externo
    const webhookFormData = new FormData();
    webhookFormData.append('audio', audioFile);

    const webhookResponse = await fetch(webhookData.webhook, {
      method: 'POST',
      body: webhookFormData,
    });

    if (!webhookResponse.ok) {
      throw new Error('Erro ao processar áudio no webhook');
    }

    const data = await webhookResponse.json();

    // Processa resposta: aceita tanto array quanto objeto direto
    let textContent: string | null = null;

    if (Array.isArray(data) && data.length > 0 && data[0].text) {
      textContent = data[0].text;
    } else if (data && typeof data === 'object' && data.text) {
      textContent = data.text;
    }

    if (!textContent) {
      throw new Error('Formato de resposta inválido');
    }

    return new Response(
      JSON.stringify({ text: textContent }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro ao transcrever áudio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
