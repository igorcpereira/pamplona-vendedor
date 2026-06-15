# Briefing — Agente Frontend

**Projeto:** App mobile Pamplona Vendedor — reconstrução do frontend do zero

**Stack:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui + Supabase JS

**Repositório:** `C:\Users\Igor\Documents\code-igor\pamplona\pamplona-vendedor`
O `src/` está vazio — começar do zero. O `package.json`, `vite.config.ts`, `tailwind.config.ts` e `tsconfig` existem e estão configurados.

---

## Contexto do negócio

App mobile usado por vendedores da Flavio Pamplona Alfaiataria para registrar fichas de atendimento (aluguel, venda, ajuste de trajes). Leia `docs/visao_geral.md` para entender o negócio antes de começar.

---

## Documentos obrigatórios — leia todos antes de escrever qualquer código

| Documento | O que contém |
|---|---|
| `docs/visao_geral.md` | O que é o app, quem usa, o que faz e o que NÃO faz |
| `docs/BRAND.md` | Design system completo: cores, tipografia, tokens CSS, componentes, logos |
| `docs/arquitetura.md` | Stack, estrutura de pastas, fluxo principal |
| `docs/fluxos.md` | Jornadas completas do vendedor — passo a passo com diagramas |
| `docs/controle_de_acesso.md` | Roles, RLS, seleção de unidade no login |
| `docs/modelo_de_dados.md` | Tabelas, campos e regras de negócio |
| `docs/configuracao.md` | Variáveis de ambiente necessárias (`.env`) |
| `docs/spec_processar-ficha-v2.md` | Contrato da edge function de OCR |
| `docs/spec_salvar-ficha.md` | Contrato da edge function de salvamento |
| `docs/spec_notificar-ficha-whatsapp.md` | Contrato do WhatsApp |
| `docs/spec_criar-cliente.md` | Contrato de criação de cliente |

---

## O que já está pronto (backend)

**Edge functions deployadas:**
- `criar-cliente` — cria ou retorna cliente por telefone
- `processar-ficha-v2` — OCR fire-and-forget, retorna `ficha_id` imediatamente

**Edge functions a implementar (não bloqueia o frontend agora):**
- `salvar-ficha` — sendo implementada em paralelo
- `notificar-ficha-whatsapp` — idem

**Banco:** Supabase. Projeto ID: `pukcbqfjzswqmjkhwzfk`. As variáveis de ambiente necessárias estão em `docs/configuracao.md`.

**Realtime:** a tabela `fichas` emite eventos quando `ocr_tentativa` e `status` mudam — o front precisa ouvir isso para atualizar a tela enquanto o OCR processa em background.

---

## Ordem de implementação sugerida

1. **Setup base** — `src/main.tsx`, `src/App.tsx`, cliente Supabase, tokens CSS do design system em `src/index.css`, tema claro/escuro
2. **Auth** — tela de login + contexto de autenticação + seleção de unidade (ver `docs/controle_de_acesso.md` — seção "Múltiplos vínculos")
3. **Layout** — `Header`, `BottomNav`, `ProtectedRoute`
4. **Criar ficha** — câmera/upload → chamada para `processar-ficha-v2` → tela de conferência com Realtime ouvindo `ocr_tentativa` e `status`
5. **Lista de fichas** — dashboard principal
6. **Detalhe da ficha** — exibição + botão de reenvio WhatsApp
7. **Clientes** — busca e detalhe

---

## Regras de design inegociáveis

- Mobile-first em tudo — nenhuma tela deve parecer "adaptada" para mobile
- Tokens do design system sempre — nunca hex direto no código (ver `docs/BRAND.md` seção 5)
- Logos: usar `public/logo_claro.png` (tema escuro). Para tema claro, recuperar `logo-jrp.png` do git (`git show HEAD~1:src/assets/logo-jrp.png > public/logo_jrp.png`). Componente `<Logo>` troca automaticamente com `useTheme()`
- Header e BottomNav com `bg-primary` (Ouro Bronze)
- `pb-20` em todas as páginas para espaço do BottomNav fixo
- Bottom sheets em vez de modais para formulários mobile
- Border radius padrão: `3px` (elegante, não arredondado demais)
- Ícones estilo line (1–1.5px), nunca solid

---

## Variáveis de ambiente

Criar `.env` na raiz com:
```
VITE_SUPABASE_URL=https://pukcbqfjzswqmjkhwzfk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key — Supabase Dashboard → Settings → API>
VITE_SUPABASE_PROJECT_ID=pukcbqfjzswqmjkhwzfk
```

---

## Estrutura de pastas esperada

```
src/
  pages/        — telas da aplicação
  components/   — componentes reutilizáveis (Header, BottomNav, Logo, etc.)
  components/ui/ — componentes shadcn/ui
  hooks/        — lógica de dados e estado (useFichas, useClientes, useAuth...)
  contexts/     — AuthContext, ThemeContext
  lib/          — utils, cliente supabase
  index.css     — tokens CSS do design system
  main.tsx
  App.tsx
```
