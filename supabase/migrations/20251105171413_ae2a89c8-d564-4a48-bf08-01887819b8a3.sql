-- Adiciona webhooks necessários para o novo fluxo
INSERT INTO webhooks (nome, webhook, plataforma) 
VALUES 
  ('processar-ficha', 'https://webhook.site/seu-webhook-processar-ficha', 'n8n'),
  ('re-ler-image', 'https://webhook.site/seu-webhook-re-ler-image', 'n8n')
ON CONFLICT (nome) DO NOTHING;