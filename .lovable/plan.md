

# Plano de Implementacao - Correcoes da Auditoria

## Escopo

Implementar 4 correcoes identificadas na auditoria (exceto remocao do signup publico, que sera mantido).

---

## 1. Criar Edge Function `delete-member`

Nova funcao em `supabase/functions/delete-member/index.ts` que:
- Verifica autenticacao do caller
- Verifica que o caller e `owner` do workspace
- Verifica que o membro alvo pertence ao mesmo workspace e NAO e `owner`
- Deleta o registro de `workspace_members`
- Deleta o usuario do Auth via `admin.deleteUser()`
- Segue o mesmo padrao do `create-member` (CORS, service role key, etc.)

Adicionar ao `supabase/config.toml`:
```toml
[functions.delete-member]
verify_jwt = false
```

## 2. Atualizar `UsersPage.tsx` - `handleConfirmRemove`

Substituir a delecao direta via client (`supabase.from('workspace_members').delete()`) por uma chamada a nova Edge Function `delete-member`, passando o `user_id` do membro. Isso garante que o usuario tambem seja removido do Auth.

## 3. Atualizar `src/config/pages.ts` - restrictedFrom em `usuarios`

Adicionar `restrictedFrom: ['admin', 'vendedor', 'visualizador']` na entrada da pagina `usuarios`. Isso:
- Bloqueia o acesso via `PageGuard`
- Remove automaticamente o link da sidebar para roles nao-owner

## 4. Alinhar RLS de `workspace_members`

Atualizar as policies de INSERT, UPDATE e DELETE em `workspace_members` para permitir apenas `owner` (remover `admin` dessas policies). Isso alinha com as Edge Functions que ja restringem ao owner. A policy `workspace_members_insert_admin` sera removida, e as policies de UPDATE e DELETE serao atualizadas.

Migracao SQL:
- DROP policy `workspace_members_insert_admin`
- ALTER policies `workspace_members_delete` e `workspace_members_update` para checar apenas `owner`

---

## Resumo de arquivos

| Arquivo | Acao |
|---|---|
| `supabase/functions/delete-member/index.ts` | Criar |
| `supabase/config.toml` | Adicionar config |
| `src/pages/users/UsersPage.tsx` | Editar handleConfirmRemove |
| `src/config/pages.ts` | Adicionar restrictedFrom |
| Migracao SQL (RLS) | Alinhar policies ao owner |

