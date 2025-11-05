import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ficha_id } = await req.json();
    
    if (!ficha_id) {
      throw new Error('ficha_id é obrigatório');
    }

    console.log('Iniciando notificação WhatsApp para ficha:', ficha_id);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Buscar webhook ficha-whatsapp
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('webhook')
      .eq('nome', 'ficha-whatsapp')
      .single();
    
    if (webhookError || !webhook?.webhook) {
      console.error('Webhook ficha-whatsapp não encontrado:', webhookError);
      throw new Error('Webhook ficha-whatsapp não encontrado');
    }
    
    console.log('Enviando ficha_id para webhook:', ficha_id);
    
    // Enviar para webhook
    const response = await fetch(webhook.webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ficha_id }),
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error('Webhook respondeu com erro:', response.status, responseText);
      throw new Error(`Webhook respondeu com status ${response.status}`);
    }
    
    console.log('Webhook enviado com sucesso para ficha:', ficha_id);
    
    return new Response(
      JSON.stringify({ success: true, ficha_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao enviar webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
