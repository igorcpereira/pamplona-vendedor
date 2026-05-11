# Direcionamento: Perfil Administrativo e Seleção de Vendedor

**Branch:** `desenvolvimento`  
**Data:** 2026-05-11  
**Status:** Aguardando implementação

---

## Visão Geral

Duas mudanças relacionadas ao sistema de perfis:
1. Renomear a role `suporte` para `administrativo` no banco de dados
2. Adicionar funcionalidade exclusiva para o perfil `administrativo`: selecionar o vendedor ao criar ou editar fichas

---

## 1. Renomear Role `suporte` → `administrativo`

### Mudança no banco de dados

O enum `app_role` precisa ser atualizado. Em PostgreSQL, enums não permitem `RENAME VALUE` diretamente em versões antigas — a abordagem correta é:

```sql
ALTER TYPE app_role RENAME VALUE 'suporte' TO 'administrativo';
```

> Disponível a partir do PostgreSQL 10. Verificar versão do Supabase antes de aplicar.

### Impacto em código

Qualquer referência ao valor `"suporte"` no frontend e nas RLS policies precisa ser atualizada para `"administrativo"`.

**Arquivos a verificar:**
- `src/integrations/supabase/types.ts` — regenerar tipos após migration
- Qualquer `has_role(..., 'suporte')` ou comparação com `"suporte"` no código

---

## 2. Funcionalidade: Seleção de Vendedor pelo Perfil Administrativo

### Contexto
- Disponível **apenas** para usuários com role `administrativo`
- Aparece tanto na **criação** quanto na **edição** de fichas
- Permite que o administrativo lance uma ficha em nome de outro vendedor

### Comportamento esperado

#### Dropdown de seleção
- Exibido **somente** quando o usuário logado tem role `administrativo`
- Lista todos os usuários **ativos** da **mesma unidade** (`unidade_id`) do administrativo
- Exclui usuários com role `master`
- Exibe nome do vendedor no dropdown
- Campo obrigatório — o administrativo não pode salvar a ficha sem selecionar um vendedor

#### Ao salvar
- O campo `vendedor_id` da ficha recebe o `id` do vendedor selecionado (não o id do administrativo)
- A ficha aparece para o vendedor como se ele mesmo a tivesse criado

#### Ao editar ficha existente
- O dropdown é pré-populado com o vendedor atual da ficha (`vendedor_id`)
- O administrativo pode alterar o vendedor se necessário

---

## 3. Consulta de Vendedores para o Dropdown

### Lógica da query

```sql
SELECT
  p.id,
  p.nome
FROM profiles p
JOIN usuario_unidade_role uur ON uur.user_id = p.id
WHERE
  uur.unidade_id = :unidade_id_do_administrativo
  AND uur.role != 'master'
  AND p.ativo = true  -- verificar se campo existe; se não, listar todos
ORDER BY p.nome ASC;
```

> **Atenção:** Verificar se a tabela `profiles` possui campo `ativo`. Se não existir, a query filtra apenas por unidade e role != 'master'.

---

## 4. Mudanças no Banco de Dados

| Operação | Detalhe |
|----------|---------|
| `ALTER TYPE app_role` | Renomear valor `suporte` → `administrativo` |
| Verificar `profiles.ativo` | Confirmar se campo existe para filtro de usuários ativos |

Não são necessárias novas tabelas ou colunas além da renomeação do enum.

---

## 5. Arquivos que Serão Modificados (previsão)

| Arquivo | Tipo de mudança |
|---------|----------------|
| `supabase/migrations/XXXXXXXXX_administrativo.sql` | Migration com `ALTER TYPE` |
| `src/integrations/supabase/types.ts` | Regenerar tipos — `"suporte"` → `"administrativo"` |
| `src/pages/EditarFichaV3.tsx` | Adicionar dropdown de vendedor condicional por role |
| `src/hooks/useVendedoresUnidade.ts` | **Novo hook** — busca vendedores ativos da unidade (exceto masters) |
| Qualquer arquivo com `"suporte"` hardcoded | Substituir por `"administrativo"` |

---

## 6. O que NÃO muda

- Permissões de acesso a dados do perfil `administrativo` (herda as do `suporte` atual)
- Demais roles (`gestor`, `franqueado`, `vendedor`, `admin`, `master`)
- Fluxo de criação/edição de fichas para outros perfis
- RLS policies (apenas atualizar referências ao nome da role)
