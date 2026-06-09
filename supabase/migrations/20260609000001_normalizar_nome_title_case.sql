-- ============================================================
-- Normalização de nome para Title Case ("Igor Corazza Pereira")
-- ============================================================
-- Regra: cada palavra com a primeira letra maiúscula e o restante
-- minúsculo. Conectores (de, da, do, dos, das, e) ficam minúsculos,
-- exceto quando são a primeira palavra do nome.
--
-- Aplicação:
--   - clientes.nome        (trigger BEFORE INSERT OR UPDATE)
--   - fichas.nome_cliente  (trigger BEFORE INSERT OR UPDATE)
--   - dados já existentes   (UPDATE retroativo no final)
-- ============================================================

-- ------------------------------------------------------------
-- Função pura: recebe um nome e devolve no padrão Title Case
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.title_case_nome(p_nome text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_conectores constant text[] := ARRAY['de', 'da', 'do', 'dos', 'das', 'e'];
  v_palavras   text[];
  v_palavra    text;
  v_saida      text[] := '{}';
  v_i          int := 0;
BEGIN
  IF p_nome IS NULL THEN
    RETURN NULL;
  END IF;

  -- Colapsa espaços repetidos e divide em palavras
  v_palavras := regexp_split_to_array(
    btrim(regexp_replace(p_nome, '\s+', ' ', 'g')),
    ' '
  );

  FOREACH v_palavra IN ARRAY v_palavras LOOP
    v_i := v_i + 1;

    IF v_palavra = '' THEN
      CONTINUE;
    END IF;

    -- Conector vira minúsculo, exceto se for a primeira palavra
    IF lower(v_palavra) = ANY (v_conectores) AND v_i > 1 THEN
      v_saida := array_append(v_saida, lower(v_palavra));
    ELSE
      v_saida := array_append(
        v_saida,
        upper(left(v_palavra, 1)) || lower(substr(v_palavra, 2))
      );
    END IF;
  END LOOP;

  RETURN array_to_string(v_saida, ' ');
END;
$$;

-- ------------------------------------------------------------
-- Trigger: clientes.nome
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_clientes_normalizar_nome()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.nome := public.title_case_nome(NEW.nome);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clientes_normalizar_nome ON public.clientes;
CREATE TRIGGER trg_clientes_normalizar_nome
  BEFORE INSERT OR UPDATE OF nome ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_clientes_normalizar_nome();

-- ------------------------------------------------------------
-- Trigger: fichas.nome_cliente
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_fichas_normalizar_nome_cliente()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.nome_cliente := public.title_case_nome(NEW.nome_cliente);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fichas_normalizar_nome_cliente ON public.fichas;
CREATE TRIGGER trg_fichas_normalizar_nome_cliente
  BEFORE INSERT OR UPDATE OF nome_cliente ON public.fichas
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_fichas_normalizar_nome_cliente();

-- ------------------------------------------------------------
-- Normalização retroativa dos dados já existentes
-- ------------------------------------------------------------
UPDATE public.clientes
SET nome = public.title_case_nome(nome)
WHERE nome IS NOT NULL
  AND nome IS DISTINCT FROM public.title_case_nome(nome);

UPDATE public.fichas
SET nome_cliente = public.title_case_nome(nome_cliente)
WHERE nome_cliente IS NOT NULL
  AND nome_cliente IS DISTINCT FROM public.title_case_nome(nome_cliente);
