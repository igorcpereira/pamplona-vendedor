-- ============================================================
-- Limpeza de vinculos para o modelo de unidade unica
-- ============================================================
-- Novo modelo: administrativo/vendedor/franqueado tem exatamente 1 unidade
-- (real, nunca "Todas"). Usuarios que violavam (multi-unidade) sao consolidados
-- na unidade 1, conforme decidido.
--   - igorcpereira@gmail.com: administrativo@1 + @2  -> manter so @1
--   - teste2@teste.com:       vendedor@1 + @2 + @5    -> manter so @1
-- ============================================================

delete from public.usuario_unidade_role uur
using auth.users u
where uur.user_id = u.id
  and u.email = 'igorcpereira@gmail.com'
  and uur.role = 'administrativo'
  and uur.unidade_id <> 1;

delete from public.usuario_unidade_role uur
using auth.users u
where uur.user_id = u.id
  and u.email = 'teste2@teste.com'
  and uur.role = 'vendedor'
  and uur.unidade_id <> 1;

-- Mantem profiles.unidade_id coerente com a unica unidade
update public.profiles p
set unidade_id = 1
from auth.users u
where p.id = u.id
  and u.email in ('igorcpereira@gmail.com', 'teste2@teste.com');
