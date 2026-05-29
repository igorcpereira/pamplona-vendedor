-- Define as tags principais (padrao = true) exibidas como botões on/off na
-- página da ficha. A UI lê `padrao = true` dinamicamente (sem hardcode no código).
-- Normaliza os nomes para exibição. Renomear é seguro: relacao_cliente_tag é por id.
-- Idempotente: pode rodar mais de uma vez sem duplicar.

UPDATE public.tags SET nome = 'Advogado', padrao = true WHERE lower(nome) = 'advogado';
UPDATE public.tags SET nome = 'Médico',   padrao = true WHERE lower(nome) = 'médico';
UPDATE public.tags SET nome = 'Noivo',    padrao = true WHERE lower(nome) = 'noivo';

-- "trabalha de terno" possui caracteres invisíveis no início; compara nome normalizado.
UPDATE public.tags SET nome = 'Trabalha de terno', padrao = true
  WHERE lower(regexp_replace(nome, '[^[:alnum:] ]', '', 'g')) = 'trabalha de terno';

INSERT INTO public.tags (nome, padrao)
SELECT 'Empresário', true
WHERE NOT EXISTS (SELECT 1 FROM public.tags WHERE lower(nome) = 'empresário');

INSERT INTO public.tags (nome, padrao)
SELECT 'Cliente A', true
WHERE NOT EXISTS (SELECT 1 FROM public.tags WHERE lower(nome) = 'cliente a');
