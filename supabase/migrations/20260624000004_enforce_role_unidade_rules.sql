-- ============================================================
-- Regras de vinculo cargo x unidade (modelo de 2 niveis) + update autoritativo
-- ============================================================
-- Niveis:
--   * Unidade unica: administrativo, vendedor, franqueado
--       -> exatamente 1 vinculo, unidade real (nunca 3 = "Todas")
--   * Global: gestor, admin, master
--       -> sempre e somente unidade 3 ("Todas")
--
-- A trava vive no banco (fonte de verdade). O painel do CRM tambem restringe,
-- mas o trigger garante a regra mesmo via SQL/RPC.
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_role_unidade_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_outros int;
  v_single_outros int;
BEGIN
  IF NEW.role IN ('administrativo', 'vendedor', 'franqueado') THEN
    IF NEW.unidade_id = 3 THEN
      RAISE EXCEPTION 'Cargo % nao pode ser vinculado a unidade "Todas".', NEW.role
        USING ERRCODE = 'check_violation';
    END IF;
    -- Unidade unica: nao pode haver outro vinculo para este usuario.
    SELECT count(*) INTO v_outros
    FROM public.usuario_unidade_role
    WHERE user_id = NEW.user_id
      AND (TG_OP <> 'UPDATE' OR id <> NEW.id);
    IF v_outros > 0 THEN
      RAISE EXCEPTION 'Cargo % e de unidade unica: o usuario nao pode ter outros vinculos.', NEW.role
        USING ERRCODE = 'check_violation';
    END IF;

  ELSIF NEW.role IN ('gestor', 'admin', 'master') THEN
    IF NEW.unidade_id <> 3 THEN
      RAISE EXCEPTION 'Cargo % deve ser vinculado a unidade "Todas".', NEW.role
        USING ERRCODE = 'check_violation';
    END IF;
    -- Global nao coexiste com cargo de unidade unica.
    SELECT count(*) INTO v_single_outros
    FROM public.usuario_unidade_role
    WHERE user_id = NEW.user_id
      AND (TG_OP <> 'UPDATE' OR id <> NEW.id)
      AND role IN ('administrativo', 'vendedor', 'franqueado');
    IF v_single_outros > 0 THEN
      RAISE EXCEPTION 'Usuario com cargo de unidade unica nao pode receber cargo global.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_enforce_role_unidade ON public.usuario_unidade_role;
CREATE TRIGGER trg_enforce_role_unidade
BEFORE INSERT OR UPDATE ON public.usuario_unidade_role
FOR EACH ROW EXECUTE FUNCTION public.enforce_role_unidade_rules();

-- ------------------------------------------------------------
-- update_user_role autoritativo: o usuario passa a ter EXATAMENTE este vinculo.
-- (Antes fazia ON CONFLICT(user_id,unidade_id) e podia deixar vinculo antigo ao
-- trocar de unidade.) O delete antes do insert mantem a regra de unidade unica.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_user_role(_user_id uuid, _unidade_id bigint, _new_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.usuario_unidade_role
    WHERE user_id = auth.uid()
      AND role IN ('master', 'admin', 'gestor')
  ) THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;

  DELETE FROM public.usuario_unidade_role WHERE user_id = _user_id;
  INSERT INTO public.usuario_unidade_role (user_id, unidade_id, role)
  VALUES (_user_id, _unidade_id, _new_role);
END;
$function$;
