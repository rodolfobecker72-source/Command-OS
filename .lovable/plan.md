## Objetivo
Permitir que owners/admins definam uma nova senha manualmente para qualquer membro da workspace, direto da tela **Gestão de Usuários**.

## Contexto
- A Edge Function `reset-user-password` já existe e já aceita chamada autenticada de `owner`/`admin` (valida via `get_user_role` + `getClaims`), buscando o usuário por e-mail e trocando a senha via service role.
- Hoje ela não é chamada por nenhuma UI — falta apenas o botão.
- A página `src/pages/users/UsersPage.tsx` já lista os membros e tem ações de editar/excluir por linha.

## Mudanças

### 1. `src/pages/users/UsersPage.tsx`
- Adicionar ação **"Redefinir senha"** (ícone `KeyRound`) em cada linha da lista de membros, ao lado dos botões de editar/excluir.
- Ao clicar, abrir um `Dialog` com:
  - Nome + e-mail do membro (apenas leitura, para confirmação).
  - Campo `PasswordInput` "Nova senha" (mín. 6 caracteres, mesma validação usada no cadastro).
  - Campo "Confirmar nova senha" (precisa bater).
  - Botões **Cancelar** / **Salvar nova senha**.
- Ao confirmar, chamar `supabase.functions.invoke('reset-user-password', { body: { email, new_password } })` — o header `Authorization` é enviado automaticamente pelo client autenticado; a Edge Function já valida a role.
- Feedback: `toast` de sucesso ("Senha redefinida para {email}") ou erro; fechar dialog e limpar campos.
- Restrição de exibição: só mostrar o botão se o usuário atual for `owner` ou `admin` (usar o mesmo check já usado para editar/excluir na página).

### 2. Sem mudanças de backend
- Edge Function `reset-user-password` já está pronta e correta.
- Sem migrations, sem novos secrets.

## Observações de segurança
- Nenhuma senha é lida/exibida — apenas gravação.
- Autorização é feita server-side (Edge Function checa role via `get_user_role`), não confiando só no client.
- Validação client-side (mín. 6, confirmação) espelha a do cadastro.