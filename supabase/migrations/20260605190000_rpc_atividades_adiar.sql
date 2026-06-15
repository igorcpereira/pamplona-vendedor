-- Reagendar atividade: muda a data e marca status = 'adiada'.
-- Complementa atividades_atualizar_status (que só altera o status, não a data).
-- Mesma checagem de permissão: responsável OU quem acessa a unidade.
CREATE OR REPLACE FUNCTION public.atividades_adiar(p_id uuid, p_nova_data date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'dev', 'public'
AS $function$
BEGIN
  IF p_nova_data IS NULL THEN
    RAISE EXCEPTION 'Informe a nova data.';
  END IF;
  UPDATE dev.atividades a
     SET data = p_nova_data,
         status = 'adiada'
   WHERE a.id = p_id
     AND (a.responsavel_id = auth.uid() OR public.can_access_unidade(auth.uid(), a.unidade_id));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Atividade não encontrada ou sem permissão.';
  END IF;
END $function$;

GRANT EXECUTE ON FUNCTION public.atividades_adiar(uuid, date) TO authenticated;
