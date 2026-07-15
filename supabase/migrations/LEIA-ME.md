# Migrations movidas para o repositório `pamplona-db`

Este front (**pamplona-vendedor**) e o **pamplona-crm** compartilham o **mesmo banco Supabase**
(`pukcbqfjzswqmjkhwzfk`). As migrations foram unificadas num único repositório para acabar com o
drift que havia entre as duas pastas.

➡️ **Fonte de verdade do schema:** o repositório **`pamplona-db`** (pasta irmã):
- `schema/` — baseline (snapshot completo da produção);
- `supabase/migrations/` — migrations incrementais.

**Não adicione migrations aqui.** Toda mudança de schema/RLS/função vai no `pamplona-db`.
O histórico antigo continua acessível no git deste repositório.
