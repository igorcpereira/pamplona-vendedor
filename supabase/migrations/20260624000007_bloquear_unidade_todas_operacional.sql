-- ============================================================
-- Trava: dados operacionais nunca na unidade virtual "Todas" (3)
-- ============================================================
-- Rede de seguranca (alem da unidade alocada no perfil): impede que fichas,
-- clientes, pedidos e provas sejam gravados com unidade_id = 3. Se um usuario
-- global ainda estiver sem unidade alocada real, o lancamento e barrado com
-- mensagem clara em vez de poluir a "Todas".
-- ============================================================

CREATE OR REPLACE FUNCTION public.bloquear_unidade_todas()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.unidade_id = 3 THEN
    RAISE EXCEPTION 'Dados operacionais nao podem ser vinculados a unidade "Todas". Aloque/selecione uma unidade real.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_bloquear_unidade_todas ON public.fichas;
CREATE TRIGGER trg_bloquear_unidade_todas BEFORE INSERT OR UPDATE ON public.fichas
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_unidade_todas();

DROP TRIGGER IF EXISTS trg_bloquear_unidade_todas ON public.clientes;
CREATE TRIGGER trg_bloquear_unidade_todas BEFORE INSERT OR UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_unidade_todas();

DROP TRIGGER IF EXISTS trg_bloquear_unidade_todas ON public.pedidos;
CREATE TRIGGER trg_bloquear_unidade_todas BEFORE INSERT OR UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_unidade_todas();

DROP TRIGGER IF EXISTS trg_bloquear_unidade_todas ON public.provas;
CREATE TRIGGER trg_bloquear_unidade_todas BEFORE INSERT OR UPDATE ON public.provas
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_unidade_todas();
