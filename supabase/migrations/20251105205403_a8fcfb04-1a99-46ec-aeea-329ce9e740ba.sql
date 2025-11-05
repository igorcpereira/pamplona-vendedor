-- Criar políticas RLS para a tabela tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver tags"
ON tags FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem criar tags"
ON tags FOR INSERT
TO authenticated
WITH CHECK (true);

-- Criar políticas RLS para a tabela relacao_cliente_tag
ALTER TABLE relacao_cliente_tag ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver relações"
ON relacao_cliente_tag FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem criar relações"
ON relacao_cliente_tag FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar relações"
ON relacao_cliente_tag FOR DELETE
TO authenticated
USING (true);