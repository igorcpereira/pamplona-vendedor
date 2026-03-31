# Índice de Documentação — Pamplona Vendedor

Este arquivo é o ponto de partida da documentação do projeto.
Cada item abaixo representa um documento a ser criado.

---

## O que precisa ser documentado

### 1. Visão Geral do Produto
> *O que é, para quem é, qual problema resolve, como se relaciona com o CRM.*
- Propósito do app (vendedor em campo, uso mobile)
- Relação com o `pamplona-crm` (mesmo Supabase, públicos diferentes)
- Contexto do negócio (alfaiataria, aluguel/venda/ajuste de trajes)

### 2. Arquitetura do Sistema
> *Como as peças se conectam.*
- Stack: React + Vite + Supabase (Auth, DB, Storage, Edge Functions)
- Estrutura de pastas do projeto
- Diagrama de fluxo principal (foto → OCR → ficha → WhatsApp)
- Integrações externas: OpenAI (OCR), Evolution API (WhatsApp)

### 3. Modelo de Dados
> *As tabelas principais e como se relacionam.*
- `fichas`, `clientes`, `profiles`, `user_roles`, `unidades`
- `webhooks`, `log_processo_ficha`
- Regras de negócio refletidas no banco (RLS, enums)

### 4. Controle de Acesso (Roles & RLS)
> *Quem pode ver e fazer o quê.*
- Roles: `vendedor`, `gestor`, `franqueado`, `master`, `admin`, `suporte`
- Lógica de unidades (`Maringá`, `Londrina`, `Todas`)
- Políticas RLS por tabela

### 5. Edge Functions
> *O que cada função faz, quando é chamada e o que precisa para funcionar.*
- `processar-ficha` — fluxo legado (via n8n)
- `processar-ficha-v2` — fluxo novo (OpenAI direto)
- `reprocessar-ficha` — reprocessamento de fichas com erro
- `transcrever-audio` / `transcrever-audio-v2` — transcrição de áudio
- `notificar-ficha-whatsapp` — envio para grupos via Evolution API
- `popular-tags-clientes` / `sugerir-tags-texto` — tags de clientes

### 6. Fluxos Principais
> *Passo a passo das operações do dia a dia.*
- Fluxo de criação de ficha (foto → processamento → conferência → salvar)
- Fluxo de reprocessamento de ficha com erro
- Fluxo de notificação WhatsApp ao salvar
- Fluxo de busca e visualização de clientes

### 7. Secrets & Variáveis de Ambiente
> *O que precisa estar configurado para o sistema funcionar.*
- Secrets do Supabase Edge Functions
- Variáveis do frontend (`.env`)
- Como configurar em um novo ambiente

### 8. Identidade Visual & Design System
> *Guia de referência para manter consistência visual no app.*
- Paleta de cores (primária, secundária, estados de erro/sucesso)
- Tipografia (fontes, tamanhos, pesos)
- Marca e logos (JRP, uso correto, variações)
- Componentes base (botões, cards, badges, dialogs)
- Padrões de layout mobile (bottom nav, header, padding, safe areas)
- Tema claro/escuro

### 9. Decisões Técnicas (ADRs)
> *Por que escolhemos cada abordagem — útil para não repetir discussões.*
- Por que migramos do n8n para Edge Functions
- Por que usamos fire-and-forget + `EdgeRuntime.waitUntil()`
- Por que o `url_bucket` armazena URL pública completa

### 10. Roadmap
> *O que está planejado, o que está em teste, o que está em produção.*
- Funcionalidades em produção
- Funcionalidades em teste (v2)
- Próximos passos

---

## Como usar este índice

1. Crie um arquivo `.md` para cada item acima dentro de `docs/`
2. Conforme o documento for escrito, substitua o item por um link: `[Visão Geral](./visao-geral.md)`
3. Documentos marcados com `*` podem ser aproveitados no `pamplona-crm`

---

## Prioridade sugerida

| Prioridade | Documento |
|---|---|
| 🔴 Alta | Visão Geral, Fluxos Principais, Edge Functions |
| 🟡 Média | Modelo de Dados, Controle de Acesso, Identidade Visual, Secrets |
| 🟢 Baixa | Arquitetura, ADRs, Roadmap |
