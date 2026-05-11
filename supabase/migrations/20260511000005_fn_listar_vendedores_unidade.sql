-- Retorna todos os usuários ativos de uma unidade que podem ter vendas atribuídas,
-- excluindo administrativos. SECURITY DEFINER para contornar RLS em usuario_unidade_role.
CREATE OR REPLACE FUNCTION public.listar_vendedores_unidade(p_unidade_id integer)
RETURNS TABLE(id uuid, nome text)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT p.id, p.nome
  FROM public.profiles p
  JOIN public.usuario_unidade_role uur ON uur.user_id = p.id
  WHERE p.ativo = true
    AND uur.unidade_id = p_unidade_id
    AND uur.role != 'administrativo'::public.app_role
  ORDER BY p.nome;
$$;
