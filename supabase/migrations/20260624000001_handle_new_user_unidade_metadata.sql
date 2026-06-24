-- ============================================================
-- handle_new_user: ler unidade_id do metadata (em vez de fixar em 1)
-- ============================================================
-- Antes, todo usuario novo nascia com profiles.unidade_id = 1 (Maringa),
-- e a unidade real so era corrigida depois pela edge function create-user.
-- Se a create-user falhasse no meio, o usuario ficava preso em Maringa.
--
-- Agora o trigger le `raw_user_meta_data->>'unidade_id'` (que a create-user v10
-- passa no momento da criacao). Fallback = 1, preservando o comportamento do
-- signup publico (Auth.tsx), que nao envia unidade -> sem regressao.
--
-- ROLLBACK: restaurar a versao anterior (unidade_id fixo em 1) -- ver migration
-- original que criou handle_new_user.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nome, unidade_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Vendedor'),
    COALESCE((NEW.raw_user_meta_data->>'unidade_id')::int, 1)
  );
  -- NAO criar vinculo aqui: a criacao de cargo e responsabilidade da edge function.
  RETURN NEW;
END;
$function$;
