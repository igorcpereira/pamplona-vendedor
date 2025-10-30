-- Criar tabela para pré-cadastros
CREATE TABLE IF NOT EXISTS public.pre_cadastros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'error')),
  phone TEXT,
  webhook_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índice para buscar por timestamp
CREATE INDEX idx_pre_cadastros_timestamp ON public.pre_cadastros(timestamp);

-- Criar índice para ordenar por data de criação
CREATE INDEX idx_pre_cadastros_created_at ON public.pre_cadastros(created_at DESC);

-- Habilitar Row Level Security
ALTER TABLE public.pre_cadastros ENABLE ROW LEVEL SECURITY;

-- Criar policy para permitir todas as operações (temporário, até implementar autenticação)
CREATE POLICY "Permitir todas operações em pre_cadastros"
  ON public.pre_cadastros
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Habilitar realtime para a tabela
ALTER TABLE public.pre_cadastros REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pre_cadastros;