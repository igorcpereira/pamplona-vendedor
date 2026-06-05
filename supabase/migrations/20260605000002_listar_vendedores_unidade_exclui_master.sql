-- Ajusta listar_vendedores_unidade: lista usada nos seletores de vendedor
-- (nova ficha, pedido avulso, prova avulsa) onde o administrativo atribui a venda.
--
-- Regras:
--   - apenas usuários ativos (p.ativo = true)
--   - escopo por unidade: vinculados à unidade solicitada OU à unidade "Todas"
--   - exclui apenas o role 'master' (antes excluía 'administrativo';
--     agora administrativos passam a aparecer e masters ficam ocultos)
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
    AND uur.role != 'master'::public.app_role
    AND (
      uur.unidade_id = p_unidade_id
      OR uur.unidade_id IN (SELECT id FROM public.unidades WHERE nome = 'Todas')
    )
  ORDER BY p.nome;
$$;
