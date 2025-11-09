import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para processar webhook em background
async function processWebhookInBackground(
  supabaseClient: any,
  fichaId: string,
  file: File
) {
  try {
    console.log('Iniciando processamento em background para ficha:', fichaId)

    // Busca o webhook principal da tabela
    const { data: webhooks, error: webhookError } = await supabaseClient
      .from('webhooks')
      .select('webhook')
      .eq('nome', 'nova-ficha')
      .single()

    if (webhookError || !webhooks) {
      console.error('Erro ao buscar webhook:', webhookError)
      await supabaseClient
        .from('fichas')
        .update({ status: 'erro' })
        .eq('id', fichaId)
      return
    }

    console.log('Webhook encontrado, enviando requisição em background...')

    // Prepara FormData para enviar ao webhook
    const webhookFormData = new FormData()
    webhookFormData.append('image', file)
    webhookFormData.append('ficha_id', fichaId)

    // Envia para o webhook com timeout de 30s
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const webhookResponse = await fetch(webhooks.webhook, {
        method: 'POST',
        body: webhookFormData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!webhookResponse.ok) {
        throw new Error(`Webhook retornou status ${webhookResponse.status}`)
      }

      const webhookData = await webhookResponse.json()
      console.log('Resposta do webhook recebida (background):', webhookData)

      if (webhookData.sucesso === true) {
        console.log('Webhook processou com sucesso em background')
        // Status continua 'pendente' - usuário vai editar na página
      } else {
        console.error('Webhook retornou erro:', webhookData.erro || 'Erro desconhecido')
        throw new Error(webhookData.erro || 'Erro no processamento da ficha')
      }

    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error('Erro ao chamar webhook em background:', fetchError)
      
      // Marca como erro
      await supabaseClient
        .from('fichas')
        .update({ status: 'erro' })
        .eq('id', fichaId)
    }

  } catch (error) {
    console.error('Erro no processamento em background:', error)
    // Marca como erro
    await supabaseClient
      .from('fichas')
      .update({ status: 'erro' })
      .eq('id', fichaId)
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Recebe a imagem
    const formData = await req.formData()
    const file = formData.get('image') as File
    const userId = formData.get('user_id') as string
    
    if (!file) {
      throw new Error('Nenhuma imagem foi enviada')
    }

    console.log('Recebido arquivo:', file.name, file.type, file.size)

    // 1. Cria a ficha com status pendente
    const { data: ficha, error: fichaError } = await supabaseClient
      .from('fichas')
      .insert({
        status: 'pendente',
        vendedor_id: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (fichaError) {
      console.error('Erro ao criar ficha:', fichaError)
      throw fichaError
    }

    console.log('Ficha criada:', ficha.id)

    // 2. Faz upload da imagem para o Storage
    const fileName = `${ficha.id}_${Date.now()}.${file.name.split('.').pop()}`
    const { error: uploadError } = await supabaseClient.storage
      .from('fichas')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError)
      // Se falhar o upload, remove a ficha criada
      await supabaseClient.from('fichas').delete().eq('id', ficha.id)
      throw uploadError
    }

    console.log('Upload concluído:', fileName)

    // 3. Atualiza a ficha com a URL do storage
    await supabaseClient
      .from('fichas')
      .update({ 
        url_bucket: fileName
      })
      .eq('id', ficha.id)

    // 4. Retorna IMEDIATAMENTE com a ficha_id
    // O webhook será processado em background
    console.log('Ficha criada e upload concluído. Retornando ficha_id:', ficha.id)

    // 5. Processa webhook em BACKGROUND (não bloqueia resposta)
    // Fire-and-forget: inicia a promise mas não aguarda
    processWebhookInBackground(supabaseClient, ficha.id, file).catch(err => 
      console.error('Erro no background task:', err)
    )

    return new Response(
      JSON.stringify({
        success: true,
        ficha_id: ficha.id,
        message: 'Ficha criada com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Erro na edge function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
