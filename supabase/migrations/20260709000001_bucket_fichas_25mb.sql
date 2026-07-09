-- ============================================================
-- Bucket `fichas`: subir limite de 5MB para 25MB
-- ============================================================
-- O limite antigo (5.242.880 = 5MB) rejeitava silenciosamente fotos maiores no
-- upload do processar-ficha-v3, deixando url_bucket nulo e impedindo o envio ao
-- WhatsApp (causa das fichas da Fran Torres em Londrina). Subimos para 25MB para
-- alinhar com o MAX_SIZE da função. HEIC passa a ser convertido para JPEG no
-- front (heic2any), então os mimes permitidos seguem apenas os renderáveis.
-- ============================================================

UPDATE storage.buckets
SET file_size_limit = 26214400  -- 25 MB
WHERE id = 'fichas';
