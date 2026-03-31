# Design System & Identidade Visual SaaS Alfaiataria Alto Padrão

Este documento define as diretrizes visuais e componentes base para o sistema SaaS voltado para alfaiataria de luxo e atendimento exclusivo. A identidade visual é inspirada na elegância do ambiente físico tons escuros, madeira, couro e pedras rústicas.

---

## 1. Sistema de Cores (Paleta Base)

A paleta transmite sobriedade, confiança e exclusividade, com forte contraste entre os fundos escuros e os destaques metalizadosamadeirados.

 #0B0F19 - Azul Meia-Noite (Quase Preto) Cor base do sistema. Usada para o fundo principal do app (Dark Mode default) e painéis laterais.
 #3D2B1F - Marrom Nogueira Tons quentes e ricos para backgrounds secundários, separadores ou cards em destaque.
 #C5A059 - Ouro Bronze  Latão A cor de destaque (Primária). Usada exclusivamente para chamar a atenção botões principais (Call to Action), ícones ativos e links de destaque.
 #E6E2DD - Bege Pedra Rústica Cor principal para textos primários e ícones sobre fundos escuros, garantindo excelente legibilidade sem o contraste agressivo do branco puro.
 #8A8A8A - Cinza Alfaiate Para textos secundários, placeholders em formulários e legendas.

---

## 2. Tipografia

A composição tipográfica mescla o clássico e luxuoso (High-End) com a funcionalidade de um software moderno (SaaS).

### Títulos e Destaques (Display)
Para atender à estética garrafal e fina, passando imponência e elegância.
 Fonte `Cinzel` ou `Playfair Display` (Google Fonts).
 Uso H1, H2, Nomes de Clientes VIP, Títulos de seções principais.
 Peso Regular ou Medium (evitar bold excessivo para manter o traço fino).

### Corpo do Texto e UI (Sans-serif)
Para legibilidade extrema em telas pequenas, tabelas de medidas e formulários longos.
 Fonte `Inter` ou `Montserrat` (Google Fonts).
 Uso Body, parágrafos, inputs, botões, legendas.
 Peso Light, Regular e Medium.

---

## 3. Componentes Base (UI Kit)

Os elementos interativos devem parecer sofisticados, com bordas sutilmente arredondadas (2px a 4px) para manter a elegância, fugindo do aspecto arredondado demais de apps casuais.

 Botões
   Primário Fundo `Ouro Bronze`, texto `Azul Meia-Noite` (Negrito). Sem bordas.
   Secundário Fundo transparente, borda fina `Ouro Bronze` ou `Marrom Nogueira`, texto `Bege Pedra Rústica`.
   Ghost (Terciário) Apenas texto sublinhado para ações menos importantes (ex Cancelar).
 Inputs de Formulário (Medidas e Cadastros)  Fundo levemente mais claro que o fundo principal (ex `#151B2B`), sem bordas laterais e superiores, apenas com uma linha inferior (Underline) elegante em `Marrom Nogueira`, que fica `Ouro Bronze` quando em foco.
 Cards (Clientes e Pedidos)
   Fundo em `Marrom Nogueira` escurecido ou textura lisa e opaca. Sombras profundas e suaves para criar hierarquia visual.
 Ícones  Estilo Line (linhas finas de 1px a 1.5px). Evitar ícones preenchidos (solid).

---

## 4. Padrões de Layout Mobile-First

Focado em ergonomia para o alfaiate ou vendedor usar o sistema enquanto atende o cliente na loja.

 Grid Sistema de múltiplos de 8px (espaçamentos de 8, 16, 24, 32 pixels).
 Navegação Principal Bottom Navigation Bar (Barra inferior) fixada, contendo 4 abas essenciais (ex Dashboard, Clientes, Agenda, ProvasMedidas).
 Página de Perfil do Cliente Cabeçalho imponente com o nome do cliente (na tipografia Display) e cards de acesso rápido ao histórico de medidas e tecidos favoritos.
 Inserção de Dados (Modais) Substituição de pop-ups intrusivos por Bottom Sheets (gavetas que sobem da parte inferior da tela) para cadastrar novas medidas com uma mão só, de forma ágil e sem sair do contexto da tela anterior.

---

## 5. Tokens CSS Implementados

Os tokens abaixo estão definidos em `src/index.css` e integrados ao Tailwind via `tailwind.config.ts`. Toda estilização deve referenciar estes tokens — nunca usar hex diretamente no código.

### Modo Claro (`:root`)

| Token | HSL | Hex aprox. | Uso |
|---|---|---|---|
| `--background` | 36 20% 95% | #F5F2EB | Fundo das páginas |
| `--foreground` | 223 39% 7% | #0B0F19 | Texto principal |
| `--card` | 0 0% 100% | #FFFFFF | Fundo de cards |
| `--primary` | 40 47% 56% | #C5A059 | Ouro Bronze — header, bottom nav, botão CTA |
| `--primary-foreground` | 223 39% 7% | #0B0F19 | Texto sobre fundo primário |
| `--secondary` | 25 33% 18% | #3D2B1F | Marrom Nogueira — botão secundário |
| `--secondary-foreground` | 36 20% 95% | #F5F2EB | Texto sobre fundo secundário |
| `--muted` | 36 15% 90% | #EAE6DF | Fundo de áreas neutras |
| `--muted-foreground` | 215 16% 47% | #6B7585 | Cinza Alfaiate — textos secundários |
| `--destructive` | 0 50% 36% | #8B2E2E | Vermelho Vinho — erros |
| `--success` | 142 33% 27% | #2E5C3E | Verde Musgo — sucesso |
| `--warning` | 32 54% 45% | #B07D35 | Ouro Envelhecido — avisos |
| `--border` | 36 15% 85% | #DDD8D0 | Bordas e separadores |
| `--ring` | 40 47% 56% | #C5A059 | Foco em inputs (anel dourado) |
| `--radius` | — | 3px | Border radius padrão |

### Modo Escuro (`.dark`)

| Token | HSL | Hex aprox. | Uso |
|---|---|---|---|
| `--background` | 223 39% 7% | #0B0F19 | Azul Meia-Noite — fundo principal |
| `--foreground` | 36 15% 88% | #E6E2DD | Bege Pedra Rústica — texto principal |
| `--card` | 222 47% 11% | #111827 | Cards levemente destacados do fundo |
| `--primary` | 40 47% 56% | #C5A059 | Ouro Bronze (igual no dark) |
| `--muted` | 223 47% 15% | #161D2E | Fundo de áreas neutras escuras |
| `--muted-foreground` | 215 20% 65% | #8FA0B8 | Textos secundários |
| `--destructive` | 0 45% 40% | #8B3333 | Vermelho Vinho adaptado |
| `--success` | 142 25% 35% | #3A6B4A | Verde Musgo adaptado |
| `--warning` | 32 45% 50% | #C08B3E | Ouro Envelhecido adaptado |
| `--border` | 223 47% 15% | #161D2E | Bordas quase invisíveis |

### Aliases da marca (classes Tailwind)

| Classe | Equivale a | Uso |
|---|---|---|
| `bg-brand-ouro` | `bg-primary` | Destaque dourado |
| `bg-brand-nogueira` | `bg-secondary` | Fundo quente |
| `text-brand-pedra` | `text-foreground` | Texto bege rústico |
| `bg-brand-meianoite` | `bg-background` (dark) | Fundo escuro |

---

## 6. Logos

### Variações disponíveis

| Arquivo | Descrição | Quando usar |
|---|---|---|
| `src/assets/logo-jrp.png` | Logo escura (símbolo escuro) | Tema claro — fundo bege/branco |
| `src/assets/logo-claro.png` | Logo dourada (`#C5A059`) | Tema escuro — fundo Azul Meia-Noite |

### Como usar no código

O componente `<Logo>` em `src/components/Logo.tsx` troca automaticamente entre as duas versões com base no `useTheme()`.

```tsx
// Correto — sempre usar o componente
import Logo from "@/components/Logo";
<Logo className="w-24 h-24 object-contain" />

// Errado — nunca importar os arquivos diretamente nas páginas
import logoJRP from "@/assets/logo-jrp.png";
```

### Regras de uso

- Sempre preservar proporções (`object-contain`) — nunca distorcer
- Como marca d'água de fundo: `opacity-5`, `fixed inset-0`, `pointer-events-none`, `z-0`
- No card de login e perfil: `w-24 h-24` ou `w-96 h-96` conforme o contexto
- Mínimo de 16px de espaço ao redor em qualquer uso
- Não aplicar filtros CSS de cor — a troca de arquivo pelo tema já garante o contraste correto

---

## 7. Componentes Base e Layout Mobile

### Botões (`src/components/ui/button.tsx`)

| Variante | Aparência | Quando usar |
|---|---|---|
| `default` | Fundo Ouro Bronze, texto escuro | Ação principal da tela (salvar, confirmar, enviar) |
| `secondary` | Fundo Marrom Nogueira, texto bege | Ação secundária |
| `outline` | Borda sutil, fundo transparente | Ação terciária, cancelamentos formais |
| `ghost` | Sem borda, hover suave | Ações em menus, listas, ícones |
| `destructive` | Vermelho Vinho | Exclusão, ações irreversíveis |
| `success` | Verde Musgo | Confirmação, ações positivas |
| `link` | Texto dourado com sublinhado | Links contextuais inline |

**Tamanhos disponíveis:**
- `default` — `h-10 px-4 py-2` (uso geral)
- `sm` — `h-9 px-3` (ações secundárias em espaços compactos)
- `lg` — `h-11 px-8` (CTAs destacados)
- `icon` — `h-10 w-10` (botões apenas com ícone)

### Header (`src/components/Header.tsx`)

- **Fundo:** `bg-primary` (Ouro Bronze)
- **Altura:** ~56px (`py-3` + conteúdo)
- **Posição:** `sticky top-0 z-50`
- **Estrutura:** título da loja à esquerda · toggle de tema + avatar à direita
- **Ícones:** `w-5 h-5`, cor `text-primary-foreground`
- **Botões de ícone:** `w-10 h-10 rounded-full hover:bg-primary-foreground/10`

### Bottom Navigation (`src/components/BottomNav.tsx`)

- **Fundo:** `bg-primary` (Ouro Bronze)
- **Posição:** `fixed bottom-0 left-0 right-0 z-[60]`
- **Item ativo:** `bg-primary-foreground/20 border border-primary-foreground/30 text-primary-foreground`
- **Item inativo:** `text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10`
- **Ícone:** `w-6 h-6`
- **Label:** `text-xs font-medium`
- **Badge de pendentes:** variante `destructive`, `h-5 w-5`, posição `-top-2 -right-2`

### Padrões de Layout das Páginas

| Padrão | Classes Tailwind |
|---|---|
| Padding lateral | `px-4` |
| Padding superior | `py-6` |
| Largura máxima (formulários) | `max-w-md mx-auto` |
| Espaço para bottom nav | `pb-20` |
| Card padrão | `bg-card rounded-lg shadow-sm p-5` ou `p-8` |
| Logo de fundo (marca d'água) | `fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0` |
| Conteúdo sobre a marca d'água | `relative z-10` |

### Tipografia em uso

| Elemento | Fonte | Classes Tailwind |
|---|---|---|
| Título do header | Inter (sans) | `text-lg font-semibold` |
| Títulos de seção h2/h3 | Cinzel (display) | `font-display font-medium tracking-wide` |
| Body e labels | Inter (sans) | `text-sm` (padrão) |
| Textos secundários | Inter (sans) | `text-xs text-muted-foreground` |
| Labels de navegação | Inter (sans) | `text-xs font-medium` |
| Valores numéricos / tempo | Mono | `font-mono` |