# Roadmap — App Mobile Pamplona Alfaiataria

> Este documento é uma fotografia do estado atual e da direção do sistema — não um compromisso de datas ou estimativas. É o documento mais dinâmico da documentação e deve ser atualizado a cada ciclo de desenvolvimento.

| Seção | O que significa |
|---|---|
| **Em implementação** | Spec escrita, decisões tomadas, pode codar |
| **Planejado** | Decisão tomada, aguarda dependências ou estabilização |
| **Futuro** | Direção definida, precisa de spec antes de codar |

---

## Em produção hoje

| Funcionalidade | Estado |
|---|---|
| Criação de ficha via OCR | ✅ Produção — via `processar-ficha` (v1, n8n) |
| Notificação WhatsApp | ✅ Produção — acionada manualmente pelo vendedor |
| Transcrição de áudio | ✅ Produção — via n8n |
| Visualização de fichas e clientes | ✅ Produção |
| OCR direto via OpenAI | 🧪 Teste — `processar-ficha-v2` na página `TesteEnvio` |

---

## Em implementação — specs prontas

Tudo nesta seção tem spec escrita e pode ser implementado. O trabalho de design e decisão já foi feito.

**Fluxo principal de fichas:**
- Estabilizar `processar-ficha-v2` e promover para o fluxo principal — substituindo a v1 e eliminando dependência do n8n no OCR
- Reprocessamento de ficha com erro via nova foto — já incorporado na spec de `processar-ficha-v2` (`ficha_id` opcional no input)
- Implementar `criar-cliente` — pré-requisito direto de `salvar-ficha`
- Implementar `salvar-ficha` — confirmação de ficha, vínculo de cliente, salvamento de tags e disparo automático do WhatsApp

**Controle de acesso:**
- Múltiplos vínculos usuário-unidade-role — nova tabela `usuario_unidade_role`, adicionar `master`/`admin` ao enum, atualizar funções RLS e tela de seleção de unidade no login

**Atualização do WhatsApp:**
- Atualizar `notificar-ficha-whatsapp` — novo modelo de dois grupos (`GRUPO_GERAL` + `GRUPO_VENDA`), bucket privado e URL assinada
- Migration de bucket — converter fichas existentes de URL pública completa para path relativo antes do deploy da notificação atualizada

> Specs: `spec_processar-ficha-v2.md`, `spec_salvar-ficha.md`, `spec_criar-cliente.md`, `spec_notificar-ficha-whatsapp.md`

---

## Planejado — backlog técnico e melhorias

Itens com decisão tomada mas que dependem dos itens anteriores estarem estáveis.

**Melhorias no fluxo de OCR:**
- Retry com `ocr_tentativa` e sinalização ao front via Supabase Realtime — já especificado, aguarda estabilização da v2
- Migrar `transcrever-audio` para OpenAI Whisper direto — eliminando última dependência do n8n

**Segurança:**
- Habilitar `verify_jwt = true` em todas as Edge Functions — ver `decisoes-arquiteturais.md` ADR-06

**Limpeza de legado:**
- Remover `processar-ficha` (v1) e tabela `webhooks`
- Decidir destino de `log_processo_ficha` — a v2 ainda escreve nela para rastreabilidade do OCR; remoção depende de decisão sobre se esse log tem valor operacional a longo prazo
- Remover colunas obsoletas — `vendedor_responsavel`, `tags_url_audio`, `nome_vendedor`
- Consolidar os dois sistemas de roles — `profiles.role` vs `user_roles.role`

---

## Futuro — sem spec ainda

Direções planejadas que ainda precisam de discussão e especificação antes de entrar em desenvolvimento.

**Controle de acesso:**
- Interface de administração para gestão de usuários e roles — hoje só é possível via Supabase Dashboard

**Comissões:**
- Aba de acompanhamento de comissões no app mobile — vendedor visualiza a própria comissão calculada
- Configuração de fórmula de cálculo de comissão pelo gestor — escopo de outra parte do sistema

**Operacional:**
- Digitalizar controle de estoque de peças vendidas — eliminaria a dependência do `GRUPO_VENDA` no WhatsApp

**Gestão de tags de clientes:**
- `popular-tags-clientes` e `sugerir-tags-texto` — funções para vincular e sugerir tags fora do fluxo de criação de ficha. Escopo de outra parte do app, a especificar em ciclo separado.

**CRM:**
- Reformulação do CRM existente e construção de funcionalidades sobre a base de dados estruturada pelo app mobile — escopo a definir em ciclo separado

