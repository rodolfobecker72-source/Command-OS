

# Plano: Fluxo de Reset de Senha + Acesso Imediato

## Problema
O usuário esqueceu a senha de rodolfofernandes@hotmail.com e não existe fluxo de recuperação no sistema.

## Solução em 2 partes

### Parte 1: Acesso imediato
Criar uma Edge Function `reset-user-password` que permite ao owner redefinir a senha de qualquer membro do workspace. Após implementar, chamar a função para resetar a senha desse usuário.

### Parte 2: Fluxo "Esqueci minha senha" na UI
1. Adicionar link "Esqueci minha senha" na tela de Login
2. Criar página `/forgot-password` — formulário com campo de email que chama `supabase.auth.resetPasswordForEmail()`
3. Criar página `/reset-password` — formulário para definir nova senha, chama `supabase.auth.updateUser({ password })`
4. Adicionar rotas no `App.tsx`

## Arquivos

- `supabase/functions/reset-user-password/index.ts` — nova Edge Function
- `src/pages/auth/ForgotPassword.tsx` — nova página
- `src/pages/auth/ResetPassword.tsx` — nova página
- `src/pages/auth/Login.tsx` — adicionar link "Esqueci minha senha"
- `src/App.tsx` — adicionar rotas

