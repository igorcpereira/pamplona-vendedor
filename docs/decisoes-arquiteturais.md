# Decisões Arquiteturais — App Mobile Pamplona Alfaiataria

> ADRs (Architecture Decision Records) registram as decisões importantes tomadas durante o projeto — o problema que existia, o que foi escolhido, por que e qual o custo aceito. O objetivo é preservar o raciocínio para que ninguém tente "consertar" algo que foi escolhido conscientemente, e para que novas decisões sejam tomadas com contexto.

---

## ADR-01 — Migração do n8n para Edge Functions

**Status:** Aceita

### Contexto

O processamento inicial das fichas foi construído sobre o n8n como intermediário — o app enviava a imagem, o n8n orquestrava a chamada ao modelo de OCR e devolvia os dados estruturados. O n8n é uma ferramenta de automação visual que permite criar fluxos sem código, o que acelerou o desenvolvimento inicial.

Com o crescimento do uso, dois problemas ficaram evidentes:

1. **Tempo de processamento:** o n8n adicionava latência ao fluxo — cada requisição passava por um servidor externo antes de chegar à OpenAI e voltar. Em um sistema onde a experiência do vendedor importa muito, 1 ou 2 segundos a mais de processamento são perceptíveis e pesam contra a adoção.

2. **Segurança e controle:** o n8n é fácil de implementar mas introduz um ponto de falha externo e reduz o controle sobre o fluxo de dados. Secrets e credenciais precisavam ser configurados em dois lugares.

### Decisão

Migrar o processamento de OCR para Edge Functions Deno no Supabase, chamando a OpenAI diretamente via Chat Completions sem intermediários.

**Alternativa descartada:** manter o n8n e apenas otimizar os fluxos existentes. Descartada porque o problema de latência é estrutural — o n8n sempre adiciona um hop extra — e o problema de controle não seria resolvido por otimização.

### Consequências

**Ficou mais fácil:**
- Menor latência no processamento — chamada direta à OpenAI
- Controle total sobre o fluxo de dados e tratamento de erros
- Secrets centralizados no Supabase

**Ficou mais difícil:**
- Mais código para manter — a lógica que o n8n abstraía visualmente agora está em código TypeScript/Deno
- Debug mais técnico — sem interface visual do n8n para acompanhar execuções

**Aceito como trade-off:** a complexidade de código é preferível à dependência de uma ferramenta externa que não atende os requisitos de performance e segurança do projeto.

**Ainda pendente:** `transcrever-audio` ainda usa o n8n via webhook. A migração está planejada — ver `edge_functions.md`.

---

## ADR-02 — Fire-and-forget com EdgeRuntime.waitUntil()

**Status:** Aceita

### Contexto

O OCR de uma ficha manuscrita via OpenAI leva entre 10 e 30 segundos. Se o app ficasse bloqueado aguardando o resultado antes de avançar, o vendedor ficaria parado com a tela de loading sem poder fazer nada.

Isso é especialmente crítico porque **nem todos os campos da ficha vêm do OCR** — alguns são preenchidos manualmente pelo vendedor. Em um dia movimentado, com várias fichas para processar, o tempo ocioso enquanto o sistema processa é um ponto diretamente contra a utilização do app.

### Decisão

A Edge Function retorna o `ficha_id` imediatamente após criar a ficha no banco, com `status: pendente`. O processamento pesado — upload da imagem, chamada à OpenAI, parse e atualização da ficha — acontece em background via `EdgeRuntime.waitUntil()`.

O front redireciona imediatamente para a tela da ficha. Os campos que virão do OCR ficam desativados com um aviso de "carregando". Os campos que o vendedor preenche manualmente ficam disponíveis para edição desde o primeiro instante. Quando o OCR conclui, os campos são preenchidos automaticamente via Supabase Realtime.

**Alternativa descartada:** aguardar o processamento completo antes de retornar ao front. Descartada porque bloqueia o vendedor por até 30 segundos em cada ficha — inaceitável para o ritmo de trabalho no balcão.

### Consequências

**Ficou mais fácil:**
- Vendedor pode começar a preencher campos manuais enquanto o OCR processa
- UX percebida como mais rápida — resposta imediata do sistema
- Em dias movimentados, o sistema não vira gargalo

**Ficou mais difícil:**
- O front precisa lidar com estados intermediários — ficha existe mas dados ainda não chegaram
- Necessidade de Supabase Realtime para comunicar o progresso ao front
- Tratamento de erros mais complexo — falha no background não bloqueia o fluxo principal

**Aceito como trade-off:** a complexidade adicional no front e no tratamento de erros é o preço pela fluidez da experiência do vendedor.

---

## ADR-03 — url_bucket: de URL pública para path relativo + bucket privado

**Status:** Aceita — substituiu decisão anterior

### Contexto

Esta decisão passou por duas fases. Registrar as duas é importante para entender por que o sistema está como está.

**Fase 1 — Decisão original:** `url_bucket` armazenava a URL pública completa do arquivo no Storage, com bucket público. Era a abordagem mais simples — o front usava a URL diretamente para exibir a imagem, sem necessidade de gerar URLs temporárias.

**Por que foi revisada:** as fichas de atendimento contêm nome completo e telefone dos clientes da Pamplona Alfaiataria. Com bucket público e URL permanente, qualquer pessoa com o link conseguiria acessar a imagem da ficha sem autenticação. Para um negócio de alto padrão com clientes exclusivos, expor esses dados publicamente é inaceitável.

Além disso, a URL pública completa é frágil tecnicamente — qualquer mudança no nome do bucket, na região ou na configuração do projeto Supabase quebraria todas as URLs salvas no banco.

### Decisão

Migrar para bucket privado. `url_bucket` passa a armazenar apenas o path relativo do arquivo (`fichas/{ficha_id}.jpg`). A URL assinada temporária é gerada pelo front sob demanda, com TTL de 1 hora.

O mesmo padrão foi adotado para `url_audio` (`audios/{ficha_id}.webm`).

**Alternativa descartada:** manter bucket público mas ofuscar as URLs. Descartada porque ofuscação não é segurança — qualquer URL que possa ser acessada sem autenticação pode ser compartilhada ou vazada.

### Consequências

**Ficou mais fácil:**
- Dados dos clientes protegidos — imagem só acessível para usuários autenticados com permissão
- Path relativo é resiliente a mudanças de configuração do bucket
- Modelo consistente para todos os arquivos do sistema

**Ficou mais difícil:**
- Front precisa gerar URL assinada antes de exibir qualquer imagem — adiciona uma chamada ao Supabase Storage
- `notificar-ficha-whatsapp` precisa gerar URL assinada para enviar ao WhatsApp — TTL de 1 hora definido para cobrir o tempo de processamento da Evolution API

**Aceito como trade-off:** a chamada extra para gerar a URL assinada é o preço pela proteção dos dados dos clientes.

**Pendência:** fichas antigas criadas com URL pública completa precisarão de uma migration para converter para path relativo antes de `notificar-ficha-whatsapp` ser atualizada.

---

## ADR-04 — Busca de cliente na função, não no front

**Status:** Aceita

### Contexto

Após o OCR processar a ficha e extrair o telefone do cliente, o sistema precisa verificar se esse cliente já existe no banco. Havia duas abordagens possíveis:

**Opção B (descartada):** o front recebe os dados do OCR via Realtime, extrai o telefone e faz uma query direta ao Supabase para buscar o cliente.

**Opção A (escolhida):** a própria Edge Function faz a busca após o parse do OCR, e persiste o resultado diretamente na ficha no banco.

O princípio que guiou a decisão: **quanto menos lógica de negócio no front, mais seguro e mais controlado o sistema**. O front roda no dispositivo do usuário — queries feitas diretamente pelo front podem ser inspecionadas, modificadas ou reaproveitadas. Quando a lógica fica na Edge Function, ela roda no servidor e o front recebe apenas o resultado final.

### Decisão

A `processar-ficha-v2` busca o cliente por telefone na Etapa 6, após o parse do OCR. O resultado é persistido diretamente na ficha em três campos: `cliente_encontrado`, `cliente_sugerido_id` e `cliente_sugerido_nome`. O front lê esses campos via Supabase Realtime e exibe a confirmação ao vendedor.

`cliente_id` **não é salvo nessa etapa** — só é vinculado quando o vendedor confirma via `salvar-ficha`.

**Alternativa descartada:** query de cliente feita pelo front após receber dados do OCR. Descartada por expor lógica de negócio no cliente e reduzir o controle sobre quais dados são consultados e como.

### Consequências

**Ficou mais fácil:**
- Lógica de busca centralizada no servidor — mais fácil de auditar e modificar
- Front apenas exibe resultado — sem lógica de consulta exposta no bundle
- Resultado persiste no banco — se o front perder a conexão Realtime, pode reler os campos na próxima abertura

**Ficou mais difícil:**
- Etapa 6 da função ficou mais complexa — busca adicional ao banco antes de atualizar a ficha
- Três campos novos na tabela `fichas` para persistir o resultado temporário

**Aceito como trade-off:** complexidade adicional na função em troca de menos exposição de lógica no front.

---

## ADR-05 — Modelo de dois grupos WhatsApp (GRUPO_GERAL + GRUPO_VENDA)

**Status:** Aceita — decisão de negócio

### Contexto

Antes da implementação do app, a Pamplona Alfaiataria usava grupos de WhatsApp como sistema de registro operacional. Três grupos distintos existiam: um para aluguel, um para venda e um para ajuste.

Com a criação do app, surgiu a questão de como mapear esse fluxo. A abordagem mais simples seria manter os três grupos separados. Porém, aluguel e ajuste têm o mesmo fluxo operacional do ponto de vista dos gestores — ambos são atendimentos que não impactam o estoque de peças para venda.

**O grupo de venda tem função específica:** o time administrativo utiliza as mensagens desse grupo para dar baixa no estoque das peças vendidas. É um processo operacional que ainda não foi digitalizado no sistema.

### Decisão

Unificar aluguel e ajuste em um único `GRUPO_GERAL`. Manter `GRUPO_VENDA` separado para atender a necessidade do time administrativo de controle de estoque.

Fichas de venda são enviadas para os dois grupos simultaneamente — geral e venda.

**Alternativa descartada:** três grupos separados como existia antes. Descartada porque aluguel e ajuste não precisam de grupos distintos operacionalmente, e reduzir o número de grupos simplifica a manutenção.

**Alternativa descartada:** um grupo único para tudo. Descartada porque o time administrativo precisa de um canal isolado para o processo de baixa de estoque — misturar com aluguel e ajuste geraria ruído.

### Consequências

**Ficou mais fácil:**
- Menos secrets para configurar e manter
- Lógica de roteamento mais simples no código

**Ficou mais difícil:**
- Fichas de venda geram duas notificações — precisa garantir que ambas chegaram via `enviada_whatsapp_geral` e `enviada_whatsapp_venda`

**Contexto de negócio importante:** esta decisão existe porque **o WhatsApp ainda é o backup operacional da empresa** enquanto o time se adapta ao novo sistema. Quando o app for a fonte de verdade para o controle de estoque, `GRUPO_VENDA` pode ser revisado ou eliminado.

---

## ADR-06 — verify_jwt = false como decisão temporária

**Status:** Em revisão — correção planejada

### Contexto

As Edge Functions do Supabase têm uma configuração chamada `verify_jwt` que controla se a função exige um token JWT válido para aceitar requisições. Com `verify_jwt = true`, apenas usuários autenticados via Supabase Auth conseguem chamar a função. Com `verify_jwt = false`, qualquer requisição é aceita — mesmo sem autenticação.

Durante o desenvolvimento inicial do app, todas as funções foram configuradas com `verify_jwt = false` para simplificar os testes e acelerar o ciclo de desenvolvimento. Não era necessário lidar com tokens de autenticação a cada chamada durante a fase de construção.

### Decisão

Manter `verify_jwt = false` temporariamente durante o desenvolvimento, com ciência do risco e plano de correção antes de escalar o uso em produção.

**Alternativa descartada:** habilitar `verify_jwt = true` desde o início. Não foi descartada por razão técnica, mas por pragmatismo de desenvolvimento — adiciona fricção no ciclo de testes sem benefício real enquanto o sistema ainda está sendo construído.

### Consequências

**Ficou mais fácil:**
- Desenvolvimento e testes mais ágeis — sem necessidade de gerenciar tokens durante a construção
- Menos configuração inicial

**Risco aceito temporariamente:**
- As funções aceitam chamadas sem autenticação de qualquer origem
- Qualquer pessoa que descobrir a URL de uma função pode chamá-la diretamente
- Em produção com dados reais de clientes, isso representa um risco de segurança concreto

**Plano de correção:** habilitar `verify_jwt = true` em todas as funções antes da expansão para novas unidades. A correção é simples — alterar o valor no `supabase/config.toml` para cada entrada de função e fazer o deploy. Está registrada como pendência em `arquitetura.md` e nas specs de cada função.

> Esta não é uma decisão arquitetural permanente — é uma dívida técnica consciente com data para ser paga.
