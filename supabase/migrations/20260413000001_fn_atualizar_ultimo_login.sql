-- Função RPC para registrar o último uso do app
-- SECURITY DEFINER: executa com permissão do owner (bypassa RLS)
-- Throttle de 5 minutos embutido no WHERE (banco garante, não o frontend)
-- Usa auth.uid() — nenhum parâmetro externo, sem vetor de abuso
CREATE OR REPLACE FUNCTION public.atualizar_ultimo_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET ultimo_login = NOW()
  WHERE id = auth.uid()
    AND (ultimo_login IS NULL OR ultimo_login < NOW() - INTERVAL '5 minutes');
END;
$$;
