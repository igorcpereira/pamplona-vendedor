-- Índices para otimizar queries de fichas
CREATE INDEX IF NOT EXISTS idx_fichas_vendedor_id ON public.fichas(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_fichas_cliente_id ON public.fichas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_fichas_status ON public.fichas(status);
CREATE INDEX IF NOT EXISTS idx_fichas_created_at ON public.fichas(created_at DESC);

-- Índice para otimizar queries de clientes
CREATE INDEX IF NOT EXISTS idx_clientes_vendedor_id ON public.clientes(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON public.clientes(created_at DESC);

-- Índice composto para queries complexas (vendedor + status)
CREATE INDEX IF NOT EXISTS idx_fichas_vendedor_status ON public.fichas(vendedor_id, status);