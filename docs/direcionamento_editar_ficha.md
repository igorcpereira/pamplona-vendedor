# Direcionamento: Atualizações na Página "Editar Ficha"

**Branch:** `desenvolvimento`  
**Data:** 2026-05-11  
**Status:** Aguardando implementação

---

## Visão Geral

Este documento descreve as mudanças planejadas para a página de edição de fichas (`EditarFichaV3.tsx`). As alterações cobrem remoção de campos, reformulação de seções existentes e reestruturação da área de peças avulsas.

---

## 1. Remoção do Campo de Observações do Cliente

### O que remover
- Campo de texto para `observacoes_cliente` / `descricao_cliente`
- Componente de gravação de áudio (microfone, controles de gravação)
- Campo de exibição da transcrição de áudio (`transcricao_audio`)

### Impacto nos arquivos
- `src/pages/EditarFichaV3.tsx` — remover seção de observações e lógica de áudio
- `src/components/EditFichaModal.tsx` — idem

> O `EditFichaModal` receberá **todas** as novas seções (tags padrão, detalhes do item, peças avulsas), não apenas a remoção de áudio/observações. Escopo igual ao `EditarFichaV3`.

### Observação
Os campos continuam existindo no banco (`observacoes_cliente`, `transcricao_audio`) — apenas a UI de edição é removida. Não mexer na migration.

---

## 2. Tags Padrão

### Comportamento esperado
- As tags são exibidas como botões de toggle (ativo/inativo)
- Somente as tags marcadas como **padrão** aparecem nesta seção da ficha
- O cliente pode ter outras tags além das padrão, mas essas são gerenciadas em outra parte da ferramenta (não aqui)
- Múltiplas tags podem estar ativas ao mesmo tempo

### Mudança no banco de dados

**Tabela:** `tags`  
**Campo a adicionar:** `padrao` (boolean, default `false`)

```sql
ALTER TABLE tags ADD COLUMN padrao boolean NOT NULL DEFAULT false;
```

### Mudança na UI
- Buscar apenas tags onde `padrao = true` para exibir nesta seção
- Renderizar cada tag como um botão toggle estilizado (ativo = cor da tag, inativo = outline)
- Ao salvar: operação **cirúrgica** — apenas inserir/remover registros de `relacao_cliente_tag` para tags onde `padrao = true`. Tags não-padrão do cliente **não devem ser tocadas**. Nunca fazer DELETE geral das tags do cliente.

---

## 3. Detalhes do Item — Nova Estrutura em 3 Seções

A seção de medidas/detalhes do item deve ser dividida em 3 subseções com botões de seleção rápida. Esses valores precisam ser salvos no banco.

### 3.1 Paletó / Calça

#### Cor (seleção única — radio)
Opções: `Azul` | `Preto` | `Cinza` | `Outros`

#### Lanifício (seleção única — radio)
Opções: `Reda` | `Paramount` | `Canonico` | `Pietro di Mosso`

### 3.2 Camisa

#### Fios (seleção única — radio)
Opções: `140` | `120` | `100`

#### Cor (seleção única — radio)
Opções: `Branco` | `Outros`

### 3.3 Sapato

#### Tipo (seleção única — radio)
Opções: `Casual` | `Social`

---

### Mudança no banco de dados

**Tabela:** `fichas`  
**Campos a adicionar:**

```sql
ALTER TABLE fichas
  ADD COLUMN paleto_cor text
    CHECK (paleto_cor IN ('Azul', 'Preto', 'Cinza', 'Outros')),
  ADD COLUMN paleto_lanificio text
    CHECK (paleto_lanificio IN ('Reda', 'Paramount', 'Canonico', 'Pietro di Mosso')),
  ADD COLUMN camisa_fios text
    CHECK (camisa_fios IN ('140', '120', '100')),
  ADD COLUMN camisa_cor text
    CHECK (camisa_cor IN ('Branco', 'Outros')),
  ADD COLUMN sapato_tipo text
    CHECK (sapato_tipo IN ('Casual', 'Social'));
```

CHECK constraints garantem que apenas os valores válidos sejam gravados, independente da origem (UI ou insert direto).

### Mudança na UI
- Botões com seleção exclusiva por seção (comportamento de radio group)
- Botão selecionado com estilo ativo (filled); demais com estilo outline
- Ao clicar no botão já selecionado, desselecionar (valor volta a null/vazio)
- Salvar os valores junto ao submit da ficha

---

## 4. Peças Avulsas — Reestruturação Completa

### Estado atual
- Modal com campo de texto `descricao` e campo `valor`
- Cada item é uma linha na tabela `vendas_avulsas`

### Novo comportamento esperado
- Remover o campo `descricao` livre
- A seção de peças avulsas passa a exibir uma lista fixa de itens pré-definidos
- Cada item tem um contador com botões `+` e `-`
- Contadores começam sempre em `0`
- Cada item tem um **valor unitário** configurável
- O total do pedido (soma de todos os itens) é calculado e exibido em tempo real

### Itens fixos

| Item       | Quantidade | Valor Unitário (editável) | Subtotal (leitura) |
|------------|------------|---------------------------|--------------------|
| Camiseta   | `- 0 +`    | R$ ___                    | R$ 0,00            |
| Gravata    | `- 0 +`    | R$ ___                    | R$ 0,00            |
| Sapato     | `- 0 +`    | R$ ___                    | R$ 0,00            |
| Meia       | `- 0 +`    | R$ ___                    | R$ 0,00            |
| Cinto      | `- 0 +`    | R$ ___                    | R$ 0,00            |
| **Total**  |            |                           | **R$ 0,00**        |

### Decisões confirmadas
1. **Valor unitário:** editável pelo próprio vendedor diretamente na tela, campo de input numérico por item
2. **Total:** campo somente leitura, calculado em tempo real (soma de `quantidade × valor_unitario` de todos os itens)
3. **Estrutura:** nova tabela `itens_avulsos_ficha` (Opção B confirmada)

### Comportamento da UI
- Contador começa em `0`; botão `-` desabilitado quando quantidade = 0
- Valor unitário começa vazio; vendedor preenche manualmente
- Subtotal por linha = `quantidade × valor_unitario` (atualiza em tempo real)
- Total geral = soma de todos os subtotais (atualiza em tempo real)
- Ao salvar a ficha, persiste todos os itens (mesmo os com quantidade 0, para preservar os valores unitários preenchidos)

### Atribuição do vendedor_id nos itens avulsos

O `vendedor_id` gravado em `itens_avulsos_ficha` segue a seguinte regra:

| Quem está editando | vendedor_id gravado nos itens |
|--------------------|-------------------------------|
| `vendedor` logado | `auth.uid()` — o próprio vendedor que está atendendo |
| `administrativo` | vendedor selecionado em dropdown **próprio da seção de avulsos** |
| `gestor` / `franqueado` | `auth.uid()` — quem está editando |

**Motivação:** um cliente pode vir para uma prova e ser atendido por um vendedor diferente do que criou a ficha. Os itens avulsos comprados nessa visita pertencem ao vendedor que está atendendo, não ao da ficha. Mesmo modelo das `provas`.

**Dropdown de vendedor na seção de avulsos (somente para `administrativo`):**
- Dropdown independente do dropdown de vendedor da ficha — as duas seleções não estão vinculadas
- Mesma fonte de dados: vendedores ativos da mesma unidade, excluindo `master`
- Obrigatório antes de salvar itens com quantidade > 0
- Pré-populado com o vendedor da ficha como sugestão inicial, mas editável

### Comportamento por vendedor (modelo confirmado)

| Situação | Resultado |
|----------|-----------|
| Vendedor B abre a ficha e adiciona itens | Cria registros com `vendedor_id = B` |
| Vendedor C abre a mesma ficha e adiciona itens | Cria registros com `vendedor_id = C` — independentes dos de B |
| Vendedor B abre a ficha novamente | Vê seus itens anteriores pré-preenchidos — salvar faz upsert nos seus próprios registros |
| Administrativo registra avulsos para Vendedor D | Cria registros com `vendedor_id = D` (selecionado no dropdown) |

Cada vendedor tem seu próprio conjunto de itens por ficha. Entradas de vendedores diferentes **nunca se sobrescrevem**.

### Mudança no banco de dados

**Nova tabela `itens_avulsos_ficha`:**

```sql
CREATE TABLE itens_avulsos_ficha (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id uuid NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
  vendedor_id uuid NOT NULL REFERENCES auth.users(id),
  unidade_id integer NOT NULL REFERENCES unidades(id),
  tipo_item text NOT NULL
    CHECK (tipo_item IN ('camiseta', 'gravata', 'sapato', 'meia', 'cinto')),
  quantidade integer NOT NULL DEFAULT 0,
  valor_unitario numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Garante um registro por tipo por vendedor por ficha (upsert seguro)
  UNIQUE (ficha_id, tipo_item, vendedor_id)
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_itens_avulsos_updated_at
BEFORE UPDATE ON itens_avulsos_ficha
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

**Regra de negócio:** cada `(ficha_id, tipo_item, vendedor_id)` é único — mesmo vendedor fazendo upsert, vendedores diferentes criando entradas independentes. `CHECK` no `tipo_item` garante integridade dos dados no banco.

RLS: visibilidade por unidade (`can_access_unidade`), mesmo padrão de `fichas` e `clientes`.

---

## 5. Resumo das Mudanças no Banco de Dados

| Tabela               | Operação | Detalhe |
|----------------------|----------|---------|
| `tags`               | ALTER    | Adicionar `padrao boolean DEFAULT false` |
| `fichas`             | ALTER    | Adicionar `paleto_cor`, `paleto_lanificio`, `camisa_fios`, `camisa_cor`, `sapato_tipo` |
| `itens_avulsos_ficha`| CREATE   | Nova tabela para peças avulsas estruturadas (ver Opção B acima) |

---

## 6. Arquivos que Serão Modificados (previsão)

| Arquivo | Tipo de mudança |
|---------|----------------|
| `src/pages/EditarFichaV3.tsx` | Remoção de observações/áudio, nova UI de tags, nova UI de detalhes, nova UI de avulsos |
| `src/components/EditFichaModal.tsx` | Remoção de observações/áudio |
| `src/hooks/useVendasAvulsasFicha.ts` | Manter intacto (tabela `vendas_avulsas` não muda) |
| `src/hooks/useItensAvulsosFicha.ts` | **Novo hook** — CRUD para `itens_avulsos_ficha` |
| `supabase/migrations/XXXXXXXXX_editar_ficha_v2.sql` | Nova migration com todas as alterações de banco |
| `src/integrations/supabase/types.ts` | Regenerar tipos após migration |

---

## 7. O que NÃO muda

- Campos de medidas (`paleto`, `calca`, `camisa`, `sapato`) — continuam como estão
- Fluxo de provas (`useProvasFicha`, seção de provas)
- Dados de clientes e busca de cliente
- Campos de valores principais (`valor`, `garantia`, `pago`)
- RLS policies existentes
- Lógica de OCR e processamento de imagem
