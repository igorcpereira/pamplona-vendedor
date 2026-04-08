# Controle de Acesso — App Mobile Pamplona Alfaiataria

> As políticas de acesso são implementadas via RLS (Row Level Security) no Supabase. Este documento explica as regras em português — o SQL completo está nas migrations em `supabase/migrations/`.

---

## Roles

O sistema possui dois enums de role no banco — uma inconsistência a ser resolvida:

| Enum | Onde | Valores |
|---|---|---|
| `app_role` | `user_roles.role` | `admin`, `master`, `franqueado`, `gestor`, `vendedor` |
| `user_role` | `profiles.role` | `Gestor`, `Franqueado`, `Vendedor` |

> ⚠️ As políticas RLS usam exclusivamente `user_roles` via função `has_role()`. A coluna `profiles.role` não é usada nas políticas e provavelmente é redundante. Ver pendências.

---

## Hierarquia

```
admin
  └── master
        └── franqueado
              └── gestor
                    └── vendedor
```

Cada nível pode criar e gerenciar perfis dos níveis abaixo, e possui todas as permissões dos níveis inferiores.

| Role | Perfil |
|---|---|
| `admin` | TI / suporte. Nível máximo — único que pode criar usuários `master` |
| `master` | Dono da franquia. Acesso a todas as unidades. Não pode criar outros `master` |
| `franqueado` | Dono de uma unidade específica. Pode vender e ter clientes próprios |
| `gestor` | Gerente de unidade. Possui quase os mesmos poderes do `franqueado` |
| `vendedor` | Atendimento no balcão. Acesso restrito à própria unidade |

---

## Matriz de permissões

| Role | Fichas | Clientes | Unidades | Perfis |
|---|---|---|---|---|
| `vendedor` | Vê e edita da própria unidade | Vê e edita da própria unidade | Não acessa | Só o próprio |
| `gestor` | Vê e edita da própria unidade | Vê e edita da própria unidade | Vê a própria | Vê da própria unidade |
| `franqueado` | Vê e edita da própria unidade | Vê e edita da própria unidade | Vê a própria | Vê da própria unidade |
| `master` | Tudo | Tudo | Tudo | Tudo — exceto criar `master` |
| `admin` | Tudo | Tudo | Tudo | Tudo — incluindo criar `master` |

---

## Lógica de unidades — o padrão "Todas"

Um usuário com `unidade_id` apontando para a unidade de nome **"Todas"** enxerga dados de todas as unidades simultaneamente. Esse padrão é usado para `master` e `admin`, que precisam de visibilidade global.

> Quem não conhece essa convenção vai estranhar a lógica nas políticas RLS. Qualquer usuário com essa `unidade_id` tem escopo global automaticamente.

---

## Múltiplos vínculos e unidade ativa na sessão

Um usuário pode estar vinculado a **mais de uma unidade com roles diferentes**. Exemplo: gestor em Maringá e vendedor em Londrina.

**Como funciona:**
- Ao logar, o usuário **seleciona em qual unidade está trabalhando** naquele momento
- A **role que vale durante a sessão é a da unidade ativa** — não a role mais alta globalmente
- Isso se aplica a todos os níveis, inclusive `master` — mesmo com acesso global, ele seleciona uma unidade para operar
- Toda RLS, visibilidade de dados e permissões são determinadas pela **unidade ativa na sessão**

**Exemplo prático:**

| Usuário | Vínculo 1 | Vínculo 2 | Unidade ativa | Role efetiva |
|---|---|---|---|---|
| João | Gestor — Maringá | Vendedor — Londrina | Londrina | Vendedor |
| João | Gestor — Maringá | Vendedor — Londrina | Maringá | Gestor |

> ⚠️ O modelo atual de `profiles` suporta apenas uma `unidade_id` por usuário. Para suportar múltiplos vínculos, será necessário criar uma tabela de vínculo `usuario_unidade_role` e implementar o conceito de unidade ativa na sessão. Isso impacta `profiles`, `user_roles` e todas as políticas RLS.

---

## Funções auxiliares (SECURITY DEFINER)

São o coração do sistema de acesso. Executam com permissão de superusuário, bypassando RLS — por isso devem ser usadas com cuidado.

| Função | O que faz |
|---|---|
| `has_role(user_id, role)` | Verifica se o usuário possui a role informada em `user_roles` |
| `get_user_unidade(user_id)` | Retorna o `unidade_id` do usuário em `profiles` |
| `get_user_role(user_id)` | Retorna a role mais elevada do usuário com base na ordem: `gestor` > `franqueado` > `vendedor`. ⚠️ `master` e `admin` não estão no `CASE` — retornam `NULL` para esses usuários. Ver pendências. |

---

## RLS por tabela

### `fichas`
Vendedor, gestor e franqueado veem e editam apenas fichas da própria unidade. Master e admin têm acesso irrestrito.

> ⚠️ Hoje o vendedor enxerga todas as fichas da unidade. A intenção é que isso seja configurável por unidade — registrado como pendência abaixo.

### `clientes`
Mesma lógica de `fichas` — acesso restrito à unidade do usuário para os níveis inferiores, irrestrito para master e admin.

### `unidades`
Gestor e franqueado visualizam apenas a própria unidade. Master e admin visualizam e gerenciam todas.

### `profiles`
Cada usuário acessa apenas o próprio perfil. Gestor visualiza perfis da própria unidade. Franqueado visualiza perfis da própria unidade.

> ⚠️ As políticas RLS de `profiles` para `master` e `admin` não estão explicitamente implementadas. A cobertura atual pode ocorrer indiretamente pelo padrão "Todas", mas não foi confirmada. Implementação explícita está pendente.

### `tags` e `relacao_cliente_tag`
⚠️ Sem filtro por unidade atualmente — qualquer usuário autenticado vê todas as tags de todas as unidades. Ver pendências.

### `log_processo_ficha`
INSERT e UPDATE abertos para qualquer usuário autenticado. Leitura restrita a `gestor`, `master` e `admin`.

### `campanhas`
Tabela existente no banco com políticas RLS próprias. Fora do escopo atual do app mobile — reservada para uso futuro pelo CRM.

---

## Como atribuir uma role a um usuário

Não existe interface no app para isso. A atribuição é feita diretamente no banco via Supabase Dashboard ou SQL com service role key — nem o `admin` consegue fazer isso pelo app atualmente:

```sql
-- Atribuir role a um usuário
INSERT INTO user_roles (user_id, role)
VALUES ('<uuid do usuário>', 'vendedor');
```

> ⚠️ Enquanto a duplicidade não for resolvida, `profiles.role` deve ser mantida em sincronia manualmente com `user_roles.role`.
> ⚠️ Se houver planos de criar uma interface de administração para gestão de roles, será necessário criar políticas de INSERT/UPDATE em `user_roles`.

---

## Pendências

| Pendência | Impacto |
|---|---|
| Dois sistemas de roles (`profiles.role` vs `user_roles.role`) | Duplicidade de fonte de verdade — consolidar em `user_roles` |
| `get_user_role` não trata `master` e `admin` | Retorna `NULL` para esses usuários — pode quebrar políticas RLS que dependem da função |
| RLS de `profiles` para `master` e `admin` não está explícita | Cobertura atual pode ser indireta pelo padrão "Todas" — precisa ser confirmada e implementada explicitamente |
| Interface para atribuição de roles | Hoje só é possível via Dashboard/SQL — se houver UI de administração, precisará de políticas novas em `user_roles` |
| Visibilidade de fichas do vendedor configurável por unidade | Hoje é sempre toda a unidade — precisa ser parametrizável |
| `tags` e `relacao_cliente_tag` sem filtro por unidade | Qualquer autenticado vê todas as tags de todas as unidades |
| `log_processo_ficha` com INSERT/UPDATE aberto | Risco de escrita indevida por qualquer autenticado |
| Suporte a múltiplos vínculos usuário-unidade-role | Criar tabela `usuario_unidade_role` e implementar unidade ativa na sessão — impacta `profiles`, `user_roles` e todas as políticas RLS |
