-- ============================================================
-- Relaxa public.normalize_phone: critério passa a ser apenas chegar a 13 dígitos
-- ============================================================
-- Antes, para 13 dígitos exigia que o 5º dígito (início do local) fosse '9', e
-- para 11 dígitos exigia o '9' na 3ª posição. Isso barrava números já com 13
-- dígitos cujo local não começa com 9 (ex.: 5543897346064) e derrubava o
-- salvamento de fichas com erro 500 na Edge Function criar-cliente
-- (o INSERT em clientes falhava com 23514 via trg_clientes_normalize_phone).
--
-- Regra nova (canônica): 55 + DDD + 9 + 8 dígitos = 13 dígitos. A normalização
-- migra os formatos menores para 13 (inserindo o 9 quando vier 55 + DDD + 8, ou
-- DDD + 8). Não policiamos qual dígito é o 9. Só rejeita quando não dá para
-- formar 13 dígitos com DDI 55.
--
-- Função compartilhada pelos triggers de clientes e historico_whatsapp.
-- ============================================================

CREATE OR REPLACE FUNCTION public.normalize_phone(input text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
  d text;
  len int;
BEGIN
  IF input IS NULL OR trim(input) = '' THEN
    RETURN NULL;
  END IF;
  d := regexp_replace(input, '\D', '', 'g');
  len := length(d);

  -- > 13: trunca para os PRIMEIROS 13 (mantém DDI 55 + DDD)
  IF len > 13 THEN
    d := left(d, 13);
    len := 13;
  END IF;

  IF len = 13 THEN
    -- 55 + DDD + 9 dígitos de local: aceita como está (sem policiar o 9)
    IF substring(d, 1, 2) = '55' THEN
      RETURN d;
    END IF;
    RETURN NULL;
  ELSIF len = 12 THEN
    -- 55 + DDD + 8 dígitos → insere o 9 antes dos 8 dígitos
    IF substring(d, 1, 2) = '55' THEN
      RETURN substring(d, 1, 4) || '9' || substring(d, 5);
    END IF;
    RETURN NULL;
  ELSIF len = 11 THEN
    -- DDD + 9 dígitos → prefixa o DDI 55
    RETURN '55' || d;
  ELSIF len = 10 THEN
    -- DDD + 8 dígitos → prefixa 55 e insere o 9
    RETURN '55' || substring(d, 1, 2) || '9' || substring(d, 3);
  ELSE
    RETURN NULL;
  END IF;
END;
$function$;
