import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

const REMETENTE = 'Pamplona Alfaiataria <naoresponda@agenciakadin.com.br>'

// --------------------------------------------------------
// Templates de email por tipo de ação
// --------------------------------------------------------

function templateRecuperacaoSenha(token: string, redirectTo: string): { subject: string; html: string } {
  const link = `${redirectTo}?token_hash=${token}&type=recovery`

  return {
    subject: 'Redefinição de senha — Pamplona Alfaiataria',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#F5F2EB;font-family:Inter,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F2EB;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:4px;overflow:hidden;">

          <!-- Header dourado -->
          <tr>
            <td style="background-color:#C5A059;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:20px;font-weight:600;color:#0B0F19;letter-spacing:2px;font-family:Georgia,serif;">
                PAMPLONA ALFAIATARIA
              </p>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:40px 40px 32px;color:#0B0F19;">
              <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#0B0F19;">
                Redefinição de senha
              </h2>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4B5563;">
                Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.
              </p>
              <p style="margin:0 0 32px;font-size:14px;line-height:1.6;color:#4B5563;">
                Se você não fez essa solicitação, ignore este email — sua senha permanece a mesma.
              </p>

              <!-- Botão -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${link}"
                       style="display:inline-block;background-color:#C5A059;color:#0B0F19;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:3px;letter-spacing:0.5px;">
                      Redefinir minha senha
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:32px 0 0;font-size:12px;color:#9CA3AF;text-align:center;">
                O link expira em 1 hora. Se o botão não funcionar, copie e cole o endereço abaixo no seu navegador:
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#9CA3AF;text-align:center;word-break:break-all;">
                ${link}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F5F2EB;padding:20px 40px;text-align:center;border-top:1px solid #E5E0D8;">
              <p style="margin:0;font-size:11px;color:#9CA3AF;">
                Este é um email automático. Não responda a esta mensagem.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  }
}

function templateConvite(token: string, redirectTo: string): { subject: string; html: string } {
  const link = `${redirectTo}?token_hash=${token}&type=invite`

  return {
    subject: 'Você foi convidado — Pamplona Alfaiataria',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#F5F2EB;font-family:Inter,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F2EB;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:4px;">

          <tr>
            <td style="background-color:#C5A059;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:20px;font-weight:600;color:#0B0F19;letter-spacing:2px;font-family:Georgia,serif;">
                PAMPLONA ALFAIATARIA
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 40px 32px;color:#0B0F19;">
              <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;">Acesso ao sistema</h2>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4B5563;">
                Você recebeu acesso ao sistema da Pamplona Alfaiataria. Clique no botão abaixo para definir sua senha e ativar sua conta.
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4B5563;">
                Sua senha provisória é: <strong>Mudar@123</strong>. Você será solicitado a alterá-la no primeiro acesso.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${link}"
                       style="display:inline-block;background-color:#C5A059;color:#0B0F19;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:3px;">
                      Ativar minha conta
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color:#F5F2EB;padding:20px 40px;text-align:center;border-top:1px solid #E5E0D8;">
              <p style="margin:0;font-size:11px;color:#9CA3AF;">Este é um email automático. Não responda a esta mensagem.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  }
}

// --------------------------------------------------------
// Handler principal
// --------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('método não permitido', { status: 405 })
  }

  const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET')
  if (!hookSecret) {
    return new Response('SEND_EMAIL_HOOK_SECRET não configurado', { status: 500 })
  }

  // Verificar assinatura do Supabase
  let payload: { user: { email: string }; email_data: { token: string; token_hash: string; redirect_to: string; email_action_type: string } }
  try {
    const body = await req.text()
    const headers = Object.fromEntries(req.headers)
    const secret = hookSecret.startsWith('v1,whsec_')
      ? hookSecret.replace('v1,whsec_', '')
      : hookSecret
    const wh = new Webhook(secret)
    payload = wh.verify(body, headers) as typeof payload
  } catch (err) {
    console.error('Assinatura inválida:', err)
    return new Response(JSON.stringify({ error: 'assinatura inválida' }), { status: 401 })
  }

  const { user, email_data } = payload
  const { email } = user
  const { token_hash, redirect_to, email_action_type } = email_data

  // Montar email conforme tipo de ação
  let template: { subject: string; html: string } | null = null

  if (email_action_type === 'recovery') {
    template = templateRecuperacaoSenha(token_hash, redirect_to)
  } else if (email_action_type === 'invite') {
    template = templateConvite(token_hash, redirect_to)
  } else {
    // Ação não tratada — deixa o Supabase usar o comportamento padrão
    console.log(`Ação de email não tratada: ${email_action_type}`)
    return new Response(JSON.stringify({}), { status: 200 })
  }

  // Enviar via Resend
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    return new Response('RESEND_API_KEY não configurado', { status: 500 })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: REMETENTE,
      to: [email],
      subject: template.subject,
      html: template.html,
    }),
  })

  if (!res.ok) {
    const erro = await res.text()
    console.error('Erro Resend:', erro)
    return new Response(JSON.stringify({ error: 'falha ao enviar email' }), { status: 500 })
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
