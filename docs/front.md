# Frontend — App Mobile Pamplona Alfaiataria

> Documentação técnica da implementação atual do frontend. Para diretrizes visuais e identidade de marca, consulte `BRAND.md`.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 18 + TypeScript |
| Bundler | Vite |
| Roteamento | React Router v6 |
| Estilização | Tailwind CSS + CSS Variables |
| Componentes | shadcn/ui (Radix UI primitives) |
| Formulários/dados | React Query (`@tanstack/react-query`) |
| Backend | Supabase (auth, banco, storage, realtime, edge functions) |
| Notificações | Sonner (`toast`) |
| Ícones | Lucide React |

---

## Esquema de cores

O sistema usa CSS variables em HSL, definidas em `src/index.css` e consumidas via Tailwind. Nunca usar hex direto no código — sempre referenciar os tokens.

### Modo claro (`:root`)

| Token | HSL | Hex aprox. | Uso |
|---|---|---|---|
| `--background` | 36 20% 95% | `#F5F2EB` | Fundo das páginas — bege linho |
| `--foreground` | 223 39% 7% | `#0B0F19` | Texto principal — azul quase preto |
| `--card` | 0 0% 100% | `#FFFFFF` | Fundo de cards |
| `--card-foreground` | 223 39% 7% | `#0B0F19` | Texto sobre cards |
| `--primary` | 40 47% 56% | `#C5A059` | Ouro Bronze — header, bottom nav, botão CTA, ring de foco |
| `--primary-foreground` | 223 39% 7% | `#0B0F19` | Texto sobre fundo primário |
| `--secondary` | 25 33% 18% | `#3D2B1F` | Marrom Nogueira — botão secundário |
| `--secondary-foreground` | 36 20% 95% | `#F5F2EB` | Texto sobre fundo secundário |
| `--muted` | 36 15% 90% | `#EAE6DF` | Fundo de áreas neutras |
| `--muted-foreground` | 215 16% 47% | `#6B7585` | Cinza Alfaiate — textos secundários, placeholders |
| `--destructive` | 0 50% 36% | `#8B2E2E` | Vermelho Vinho — erros, exclusão |
| `--success` | 142 33% 27% | `#2E5C3E` | Verde Musgo — confirmações |
| `--warning` | 32 54% 45% | `#B07D35` | Ouro Envelhecido — avisos |
| `--border` | 36 15% 85% | `#DDD8D0` | Bordas e separadores |
| `--input` | 36 15% 85% | `#DDD8D0` | Borda de inputs |
| `--ring` | 40 47% 56% | `#C5A059` | Anel de foco — dourado |
| `--radius` | — | `3px` | Border radius base |

### Modo escuro (`.dark`)

| Token | HSL | Hex aprox. | Uso |
|---|---|---|---|
| `--background` | 223 39% 7% | `#0B0F19` | Azul Meia-Noite — fundo principal |
| `--foreground` | 36 15% 88% | `#E6E2DD` | Bege Pedra Rústica — texto principal |
| `--card` | 222 47% 11% | `#111827` | Cards levemente mais claros que o fundo |
| `--primary` | 40 47% 56% | `#C5A059` | Ouro Bronze (idêntico ao claro) |
| `--muted` | 223 47% 15% | `#161D2E` | Fundo de áreas neutras |
| `--muted-foreground` | 215 20% 65% | `#8FA0B8` | Textos secundários |
| `--border` | 223 47% 15% | `#161D2E` | Bordas quase invisíveis |

> `--primary` é idêntico nos dois modos — o Ouro Bronze é a âncora visual constante independente do tema.

---

## Tipografia

Configurada em `tailwind.config.ts`.

| Família | Fonte | Uso |
|---|---|---|
| `font-sans` | Inter | Corpo, labels, inputs, botões, navegação — tudo exceto títulos |
| `font-display` | Cinzel | H1–H6 automaticamente via `@layer base`. Títulos de seção, nomes de destaque |
| `font-mono` | Menlo / Consolas / SFMono | Valores numéricos, tempos de processamento |

**Regra global em `src/index.css`:**
```css
h1, h2, h3, h4, h5, h6 {
  font-family: Cinzel; /* font-display */
  font-weight: 500;
  letter-spacing: wider;
}
body {
  font-family: Inter; /* font-sans */
}
```

### Escala em uso

| Contexto | Classes |
|---|---|
| Título principal de página | `text-2xl font-bold` (Cinzel) |
| Título de card/seção | `text-lg font-semibold` (Cinzel) |
| Corpo padrão | `text-sm` (Inter) |
| Texto secundário / metadata | `text-xs text-muted-foreground` (Inter) |
| Label de navegação | `text-xs font-medium` (Inter) |
| Título no header | `text-lg font-semibold` (Inter — exceção, não usa display) |

---

## Layout geral

O app é **mobile-first** e pensado para uso com uma mão. Toda a estrutura segue o padrão:

```
┌─────────────────────────────┐
│  Header (sticky, 56px)      │  bg-primary
├─────────────────────────────┤
│                             │
│  Conteúdo principal         │  bg-background
│  px-4 py-6 max-w-md mx-auto │
│  pb-20 (espaço bottom nav)  │
│                             │
│  [Logo marca d'água: z-0]   │  opacity-5, fixed, pointer-events-none
│                             │
├─────────────────────────────┤
│  Bottom Nav (fixed, ~64px)  │  bg-primary, z-[60]
└─────────────────────────────┘
```

### Padrões de espaçamento

| Elemento | Classes |
|---|---|
| Padding lateral | `px-4` |
| Padding superior do conteúdo | `py-6` |
| Largura máxima (formulários e listas) | `max-w-md mx-auto` |
| Espaço para bottom nav | `pb-20` |
| Espaço interno de cards | `p-5` (padrão) ou `p-8` (login/perfil) |
| Gap entre seções | `space-y-6` |

### Marca d'água de fundo

Presente em **todas** as páginas:
```tsx
<div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
  <Logo className="w-96 h-96 object-contain" />
</div>
// Conteúdo sempre em: relative z-10
```

---

## Componentes estruturais

### Header (`src/components/Header.tsx`)

- **Fundo:** `bg-primary` (Ouro Bronze)
- **Posição:** `sticky top-0 z-50`
- **Altura:** ~56px (`py-3` + conteúdo)
- **Layout:** título + seletor de unidade à esquerda · toggle de tema + menu de usuário à direita

**Seletor de unidade:**
Aparece apenas quando `vinculos.length > 1`. Exibe o nome da unidade ativa com ícone `Building2` e `ChevronDown`. Ao clicar, dropdown lista todas as unidades do usuário com a role em cada uma. A unidade ativa fica em `font-medium`. Troca via `selectUnidade()` do `AuthContext`.

**Menu de usuário:**
Dropdown com nome + email + link para `/perfil` + logout.

**Toggle de tema:**
Ícone `Sun`/`Moon` que alterna entre light e dark via `useTheme()`.

### Bottom Nav (`src/components/BottomNav.tsx`)

- **Fundo:** `bg-primary`, `z-[60]` (acima de dialogs)
- **4 itens:** Início (`/`) · Clientes (`/clientes`) · Fichas (`/pre-cadastro`) · Novo (`/novo`)
- **Item ativo:** `bg-primary-foreground/20 border border-primary-foreground/30`
- **Item inativo:** `text-primary-foreground/70`
- **Badge de pendentes:** variante `destructive`, `h-5 w-5`, posicionado `-top-2 -right-2` no ícone de Fichas

### Cards

Padrão shadcn/ui `<Card>`. Variações em uso:

| Variação | Classes adicionais | Uso |
|---|---|---|
| Card padrão | `bg-card rounded-lg shadow-sm` | Seções de formulário, listas |
| Card de alerta | `bg-destructive/10 border-destructive/20` | Fichas pendentes no Dashboard |
| Card de item de lista | `p-4 cursor-pointer hover:bg-muted/50` | Itens clicáveis em listas |

### Inputs

Padrão shadcn/ui `<Input>`. Estilo: borda `--input` (bege/azul conforme tema), foco com ring dourado (`--ring`). Sempre acompanhados de `<Label>` com `htmlFor` correspondente.

### Botões

| Variante | Quando usar |
|---|---|
| `default` | Ação principal (salvar, confirmar, enviar) — fundo Ouro Bronze |
| `secondary` | Ação secundária — fundo Marrom Nogueira |
| `outline` | Ação terciária, cancelamentos formais |
| `ghost` | Ações em menus, ícones no header |
| `destructive` | Exclusão, ações irreversíveis |
| `link` | Links contextuais inline |

Tamanhos: `default` (h-10), `sm` (h-9), `lg` (h-11), `icon` (h-10 w-10).

### Notificações

Via Sonner (`toast`). Padrão:
```tsx
toast.success('Mensagem de sucesso');
toast.error('Mensagem de erro');
```

---

## Tema (light/dark)

Gerenciado por `src/hooks/useTheme.ts` e `src/contexts/ThemeContext.tsx`. Persiste no `localStorage`. A classe `.dark` é aplicada no `<html>`.

O componente `<Logo>` em `src/components/Logo.tsx` troca automaticamente entre `logo-jrp.png` (tema claro) e `logo-claro.png` (tema escuro) com base no `useTheme()`.

---

## Páginas

| Rota | Arquivo | Descrição |
|---|---|---|
| `/auth` | `Auth.tsx` | Login e cadastro. Card centralizado, logo, form email+senha |
| `/` | `Dashboard.tsx` | Boas-vindas com nome do usuário. Alerta de fichas pendentes clicável |
| `/novo` | `NewRegistration.tsx` | Upload de foto da ficha. Câmera ou galeria. Realtime de processamento |
| `/pre-cadastro` | `PreCadastro.tsx` | Lista de fichas com filtro por status (tabs) e busca. Realtime |
| `/editar-ficha/:id` | `EditarFicha.tsx` | Edição manual dos campos de uma ficha |
| `/clientes` | `Clients.tsx` | Lista de clientes com busca server-side e paginação por scroll infinito |
| `/cliente/:id` | `ClienteDetalhes.tsx` | Perfil do cliente — histórico de fichas, LTV, tags |
| `/perfil` | `Profile.tsx` | Edição de nome, foto (upload para storage `avatars`) e senha |
| `*` | `NotFound.tsx` | 404 |

### Estrutura-padrão de página

```tsx
<div className="min-h-screen bg-background pb-20 relative">
  {/* Marca d'água */}
  <div className="fixed inset-0 ... opacity-5 z-0">
    <Logo className="w-96 h-96 object-contain" />
  </div>

  <Header title="..." />

  <main className="px-4 py-6 max-w-md mx-auto space-y-6 relative z-10">
    {/* conteúdo */}
  </main>

  <BottomNav />
</div>
```

Páginas de fluxo secundário (Perfil, Editar Ficha) trocam o `<Header>` pelo padrão com botão voltar (`<ArrowLeft>`) e omitem o `<BottomNav>`.

---

## Autenticação e contexto global

`src/contexts/AuthContext.tsx` é o contexto central. Carrega no login:

| Dado | De onde vem | Uso |
|---|---|---|
| `user` | `supabase.auth` | ID, email |
| `profile` | tabela `profiles` | nome, avatar, `unidade_id` ativa |
| `vinculos` | tabela `usuario_unidade_role` + join `unidades` | todos os vínculos unidade+role do usuário |
| `activeUnidade` | derivado de `vinculos` + `localStorage` | unidade e role ativos na sessão |

`selectUnidade(id)` atualiza `profiles.unidade_id` no banco (para o RLS funcionar) e persiste no `localStorage` como `active_unidade_${userId}`.

---

## Realtime

Usado em `PreCadastro.tsx` e `NewRegistration.tsx` para acompanhar o processamento de fichas via `supabase.channel()`. Escuta mudanças na coluna `status` e `ocr_tentativa` da tabela `fichas`.

---

## Estrutura de arquivos relevante

```
src/
├── assets/
│   ├── logo-jrp.png          # Logo escura (tema claro)
│   └── logo-claro.png        # Logo dourada (tema escuro)
├── components/
│   ├── Header.tsx             # Header sticky com seletor de unidade
│   ├── BottomNav.tsx          # Navegação inferior fixa
│   ├── Logo.tsx               # Logo responsiva ao tema
│   ├── FichaAtendimento.tsx   # Componente de visualização de ficha OCR
│   ├── AudioRecorder.tsx      # Gravação de áudio para transcrição
│   ├── EditFichaModal.tsx     # Modal de edição de ficha
│   └── ui/                   # Componentes shadcn/ui (não editar manualmente)
├── contexts/
│   ├── AuthContext.tsx        # Sessão, perfil, vínculos, unidade ativa
│   └── ThemeContext.tsx       # Light/dark mode
├── hooks/
│   ├── useFichas.ts           # Fichas da unidade ativa (React Query)
│   ├── useClientes.ts         # Clientes com paginação infinita (React Query)
│   └── useVendedores.ts       # Vendedores da unidade ativa (React Query)
├── integrations/supabase/
│   ├── client.ts              # Cliente Supabase
│   └── types.ts               # Tipos gerados do banco
├── pages/                     # Uma página por rota
└── index.css                  # CSS variables (tokens de cor e radius)
```
