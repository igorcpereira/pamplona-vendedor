-- Adiciona cliente_telefone ao retorno de atividades_listar, para que a UI
-- consiga abrir WhatsApp/ligar também em atividades de cliente cadastrado
-- (antes só o contato avulso tinha telefone_contato).
DROP FUNCTION IF EXISTS public.atividades_listar(bigint, uuid, text, date, date);

CREATE OR REPLACE FUNCTION public.atividades_listar(p_unidade_id bigint DEFAULT NULL::bigint, p_responsavel_id uuid DEFAULT NULL::uuid, p_status text DEFAULT NULL::text, p_de date DEFAULT NULL::date, p_ate date DEFAULT NULL::date)
 RETURNS TABLE(id uuid, titulo text, descricao text, data date, status text, origem text, gatilho_id uuid, gatilho_tipo text, grupo_id uuid, responsavel_id uuid, responsavel_nome text, cliente_id uuid, cliente_nome text, cliente_telefone text, nome_contato text, telefone_contato text, unidade_id bigint, unidade_nome text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'dev', 'public'
AS $function$
DECLARE v_is_global boolean; v_eff_unidade bigint;
BEGIN
  v_is_global := EXISTS (SELECT 1 FROM public.usuario_unidade_role
                         WHERE user_id = auth.uid() AND role IN ('master','admin','gestor'));
  IF v_is_global THEN v_eff_unidade := p_unidade_id;
  ELSE v_eff_unidade := COALESCE(public.get_user_unidade(auth.uid()), -1); END IF;

  RETURN QUERY
  SELECT a.id, a.titulo, a.descricao, a.data, a.status, a.origem,
         a.gatilho_id, g.tipo, a.grupo_id,
         a.responsavel_id, pr.nome, a.cliente_id, c.nome, c.telefone,
         a.nome_contato, a.telefone_contato, a.unidade_id, u.nome, a.created_at
  FROM dev.atividades a
  LEFT JOIN dev.gatilhos g  ON g.id = a.gatilho_id
  LEFT JOIN public.profiles pr ON pr.id = a.responsavel_id
  LEFT JOIN public.clientes c  ON c.id = a.cliente_id
  LEFT JOIN public.unidades u  ON u.id = a.unidade_id
  WHERE (v_eff_unidade IS NULL OR a.unidade_id = v_eff_unidade)
    AND (p_responsavel_id IS NULL OR a.responsavel_id = p_responsavel_id)
    AND (p_status IS NULL OR a.status = p_status)
    AND (p_de IS NULL OR a.data >= p_de)
    AND (p_ate IS NULL OR a.data <= p_ate)
  ORDER BY a.data, a.created_at;
END $function$;

GRANT EXECUTE ON FUNCTION public.atividades_listar(bigint, uuid, text, date, date) TO authenticated;
