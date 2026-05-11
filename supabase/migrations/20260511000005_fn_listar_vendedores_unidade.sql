-- Retorna usuários disponíveis para atribuição de vendas em uma unidade:
-- - Usuários vinculados diretamente à unidade solicitada
-- - Usuários vinculados à unidade "Todas" (acesso global)
-- Exclui administrativos em qualquer caso. SECURITY DEFINER para contornar RLS.
CREATE OR REPLACE FUNCTION public.listar_vendedores_unidade(p_unidade_id integer)
RETURNS TABLE(id uuid, nome text)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT p.id, p.nome
  FROM public.profiles p
  JOIN public.usuario_unidade_role uur ON uur.user_id = p.id
  WHERE p.ativo = true
    AND uur.role != 'administrativo'::public.app_role
    AND (
      uur.unidade_id = p_unidade_id
      OR uur.unidade_id IN (SELECT id FROM public.unidades WHERE nome = 'Todas')
    )
  ORDER BY p.nome;
$$;
