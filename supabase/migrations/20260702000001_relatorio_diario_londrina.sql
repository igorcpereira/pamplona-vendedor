-- ============================================================
-- relatorio_diario_londrina(): réplica de relatorio_diario_maringa()
-- ============================================================
-- Relatório do dia anterior (fuso America/Sao_Paulo) por vendedor, agora para a
-- unidade de Londrina (id 2). Idêntica à versão de Maringá, trocando unidade_id
-- 1 -> 2 em fichas, provas, pedidos e profiles.
-- ============================================================

CREATE OR REPLACE FUNCTION public.relatorio_diario_londrina()
 RETURNS TABLE(nome text, fichas bigint, provas bigint, aluguel numeric, venda numeric, avulsas_qtd bigint, avulsas_valor numeric, total numeric, ultimo_login timestamp with time zone)
 LANGUAGE sql
 STABLE
AS $function$
  with periodo as (
    select
      (((now() at time zone 'America/Sao_Paulo')::date - 1)::timestamp
         at time zone 'America/Sao_Paulo') as inicio,
      (((now() at time zone 'America/Sao_Paulo')::date)::timestamp
         at time zone 'America/Sao_Paulo') as fim
  ),
  f as (
    select
      f.vendedor_id,
      count(*)                                                   as fichas,
      coalesce(sum(f.valor) filter (where f.tipo = 'aluguel'), 0) as aluguel,
      coalesce(sum(f.valor) filter (where f.tipo = 'venda'),   0) as venda
    from fichas f, periodo
    where f.unidade_id = 2
      and f.created_at >= periodo.inicio
      and f.created_at <  periodo.fim
    group by f.vendedor_id
  ),
  pr as (
    select pr.vendedor_id, count(*) as provas
    from provas pr, periodo
    where pr.unidade_id = 2
      and pr.created_at >= periodo.inicio
      and pr.created_at <  periodo.fim
    group by pr.vendedor_id
  ),
  pe as (
    select
      pe.vendedor_id,
      count(*)                        as avulsas_qtd,
      coalesce(sum(pe.valor_total),0) as avulsas_valor
    from pedidos pe, periodo
    where pe.unidade_id = 2
      and pe.created_at >= periodo.inicio
      and pe.created_at <  periodo.fim
    group by pe.vendedor_id
  )
  select
    p.nome,
    coalesce(f.fichas, 0)        as fichas,
    coalesce(pr.provas, 0)       as provas,
    coalesce(f.aluguel, 0)       as aluguel,
    coalesce(f.venda, 0)         as venda,
    coalesce(pe.avulsas_qtd, 0)  as avulsas_qtd,
    coalesce(pe.avulsas_valor,0) as avulsas_valor,
    coalesce(f.aluguel,0) + coalesce(f.venda,0) + coalesce(pe.avulsas_valor,0) as total,
    p.ultimo_login
  from profiles p
  left join f  on f.vendedor_id  = p.id
  left join pr on pr.vendedor_id = p.id
  left join pe on pe.vendedor_id = p.id
  where p.unidade_id = 2
    and p.ativo = true
    and coalesce(p.is_teste, false) = false
  order by total desc, p.nome;
$function$;
