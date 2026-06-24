-- ============================================================
-- Drop das funcoes de cargo quebradas (referenciam tabela fantasma user_roles)
-- ============================================================
-- add_user_role, remove_user_role e a sobrecarga 2-arg de update_user_role
-- inserem/atualizam em public.user_roles -- tabela que NAO existe. Qualquer
-- chamada delas falha. Verificado em ambos os frontends (pamplona-vendedor e
-- pamplona-crm): nenhum as chama (so aparecem no types.ts gerado). O CRM usa
-- a sobrecarga correta update_user_role(uuid, bigint, app_role) + create-user.
--
-- A sobrecarga 3-arg update_user_role(uuid, bigint, app_role) NAO e tocada.
--
-- ROLLBACK: nao recriar -- estavam quebradas desde sempre. Se for preciso uma
-- funcao de add/remove cargo, criar uma nova correta com unidade_id escrevendo
-- em usuario_unidade_role (ver plano, item futuro).
-- ============================================================

DROP FUNCTION IF EXISTS public.add_user_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.remove_user_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.update_user_role(uuid, app_role);
