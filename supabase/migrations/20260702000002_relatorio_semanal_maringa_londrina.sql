-- ============================================================
-- relatorio_semanal_maringa() / relatorio_semanal_londrina()
-- ============================================================
-- Mesma quebra por vendedor do relatório diário, mas cobrindo a SEMANA ANTERIOR
-- fechada (segunda 00:00 até domingo 23:59, fuso America/Sao_Paulo). Ou seja:
-- de date_trunc('week', hoje) - 7 (segunda passada) até date_trunc('week', hoje)
-- (segunda desta semana, exclusivo).
--   - maringa  -> unidade_id = 1
--   - londrina -> unidade_id = 2
-- ============================================================

CREATE OR REPLACE FUNCTION public.relatorio_semanal_maringa()
 RETURNS TABLE(nome text, fichas bigint, provas bigint, aluguel numeric, venda numeric, avulsas_qtd bigint, avulsas_valor numeric, total numeric, ultimo_login timestamp with time zone)
 LANGUAGE sql
 STABLE
AS $function$
  with periodo as (
    select
      ((date_trunc('week', (now() at time zone 'America/Sao_Paulo'))::date - 7)::timestamp
         at time zone 'America/Sao_Paulo') as inicio,
      ((date_trunc('week', (now() at time zone 'America/Sao_Paulo'))::date)::timestamp
         at time zone 'America/Sao_Paulo') as fim
  ),
  f as (
    select
      f.vendedor_id,
      count(*)                                                   as fichas,
      coalesce(sum(f.valor) filter (where f.tipo = 'aluguel'), 0) as aluguel,
      coalesce(sum(f.valor) filter (where f.tipo = 'venda'),   0) as venda
    from fichas f, periodo
    where f.unidade_id = 1
      and f.created_at >= periodo.inicio
      and f.created_at <  periodo.fim
    group by f.vendedor_id
  ),
  pr as (
    select pr.vendedor_id, count(*) as provas
    from provas pr, periodo
    where pr.unidade_id = 1
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
    where pe.unidade_id = 1
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
  where p.unidade_id = 1
    and p.ativo = true
    and coalesce(p.is_teste, false) = false
  order by total desc, p.nome;
$function$;

CREATE OR REPLACE FUNCTION public.relatorio_semanal_londrina()
 RETURNS TABLE(nome text, fichas bigint, provas bigint, aluguel numeric, venda numeric, avulsas_qtd bigint, avulsas_valor numeric, total numeric, ultimo_login timestamp with time zone)
 LANGUAGE sql
 STABLE
AS $function$
  with periodo as (
    select
      ((date_trunc('week', (now() at time zone 'America/Sao_Paulo'))::date - 7)::timestamp
         at time zone 'America/Sao_Paulo') as inicio,
      ((date_trunc('week', (now() at time zone 'America/Sao_Paulo'))::date)::timestamp
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
