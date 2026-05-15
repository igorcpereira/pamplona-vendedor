CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.trg_notificar_pedido_criado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://pukcbqfjzswqmjkhwzfk.supabase.co/functions/v1/notificar-pedido-whatsapp',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := jsonb_build_object('pedido_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notificar_pedido_criado
  AFTER INSERT ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notificar_pedido_criado();
