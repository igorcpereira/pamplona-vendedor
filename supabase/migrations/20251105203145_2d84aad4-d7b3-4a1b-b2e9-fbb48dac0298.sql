-- Primeiro, atualizar fichas existentes que tenham tipos inválidos
UPDATE fichas 
SET tipo = 'Ajuste' 
WHERE tipo = 'Reparo' OR tipo = 'Prova';

-- Adicionar constraint para garantir apenas 3 tipos de atendimento
ALTER TABLE fichas 
DROP CONSTRAINT IF EXISTS fichas_tipo_check;

ALTER TABLE fichas 
ADD CONSTRAINT fichas_tipo_check 
CHECK (tipo IN ('Aluguel', 'Venda', 'Ajuste'));