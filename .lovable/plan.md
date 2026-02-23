

# Fluxo Completo de Convites

## O que sera implementado

Quando o proprietario convidar alguem pelo email, o convidado podera criar uma conta (signup) e sera automaticamente vinculado ao workspace com o papel e permissoes definidos no convite. Alem disso, um link direto de convite tambem funcionara.

## Fluxo do usuario

1. Proprietario cria convite na pagina /usuarios (ja funciona)
2. Convidado acessa /signup ou /convite/:id
3. Ao fazer signup, o sistema verifica se ha convites pendentes para aquele email
4. Se houver, aceita o convite automaticamente (vincula ao workspace)
5. Se nao houver, segue o fluxo normal de criar workspace proprio

## Mudancas

### 1. Nova pagina: `/convite/:id`
- Pagina simples que mostra detalhes do convite (workspace, papel)
- Se o usuario ja esta logado e o email bate, aceita o convite
- Se nao esta logado, redireciona para signup com o invite_id como parametro

### 2. Atualizar Signup (`src/pages/auth/Signup.tsx`)
- Aceitar query param `?invite=<id>` 
- Se tem invite, esconder campo "Nome da Empresa" (nao precisa criar workspace)
- Apos signup, chamar `accept_invite` ao inves de `handle_signup_workspace`
- Mostrar informacao do convite (nome do workspace, papel)

### 3. Atualizar AuthContext (`src/contexts/AuthContext.tsx`)
- Apos login, verificar se ha convites pendentes para o email do usuario
- Se houver e o usuario nao tem workspace, aceitar automaticamente

### 4. Atualizar Login (`src/pages/auth/Login.tsx`)
- Aceitar query param `?invite=<id>`
- Apos login com convite pendente, aceitar automaticamente

### 5. Atualizar App.tsx (rotas)
- Adicionar rota `/convite/:id` acessivel sem autenticacao

### 6. Atualizar RLS do profiles
- Permitir que membros do mesmo workspace vejam os perfis uns dos outros (necessario para a pagina de usuarios mostrar nomes)

---

## Detalhes tecnicos

### Nova pagina `src/pages/auth/AcceptInvite.tsx`
- Busca dados do convite via `supabase.from('workspace_invites').select('*').eq('id', inviteId).is('accepted_at', null)`
- Se usuario logado: chama `supabase.rpc('accept_invite', { invite_id })` e redireciona para `/clientes`
- Se nao logado: redireciona para `/signup?invite=<id>`

### Mudancas no Signup
- Ler `searchParams.get('invite')`
- Se tem invite, buscar dados do convite para mostrar contexto
- Apos signup bem-sucedido com invite: chamar `accept_invite` ao inves de `handle_signup_workspace`
- Apos signup sem invite: manter fluxo atual (criar workspace)

### Mudancas no AuthContext
- No `loadUserData`, se nao encontrar membership, verificar convites pendentes para o email do usuario
- Se encontrar, chamar `accept_invite` e recarregar dados

### Migracoes de banco de dados
- Adicionar policy no `profiles` para membros do mesmo workspace poderem ver perfis:
```sql
CREATE POLICY "Workspace members can view profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm1
    JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
    WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.id
  )
);
```
- Adicionar policy para convidados poderem ler convites pelo ID (para a pagina de convite):
```sql
CREATE POLICY "Anyone can read invite by id"
ON public.workspace_invites FOR SELECT
USING (true);
```
(Ja existe policy de SELECT para membros, mas convidados que ainda nao sao membros precisam ler o convite)

### Arquivos modificados
- `src/pages/auth/Signup.tsx` - suporte a convites
- `src/pages/auth/Login.tsx` - suporte a convites  
- `src/contexts/AuthContext.tsx` - auto-aceitar convites no login
- `src/App.tsx` - nova rota /convite/:id
- Novo: `src/pages/auth/AcceptInvite.tsx`
- Migracao SQL para policies adicionais

