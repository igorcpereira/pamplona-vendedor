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