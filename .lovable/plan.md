## Escopo

Migrar a integração Google Calendar do OAuth próprio (Edge Functions + `user_google_tokens`) para o **App User Connector Lovable** já configurado no workspace (cliente `lovable-command`, `connector_id: google_calendar`).

## Passos

### 1. Vincular o client ao projeto
Chamar `connector_app_user--connect_client` com `connector_id: google_calendar`. Isso injeta o secret `GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY` no projeto e habilita as chamadas via gateway (`https://connector-gateway.lovable.dev/google_calendar/...`).

### 2. Novas Edge Functions

Como o app é Vite + React (não TanStack Start), o helper `callAsAppUser` do knowledge da Lovable não se aplica diretamente. Vou implementar o equivalente em duas Edge Functions:

- **`google-calendar-connect-start`** — recebe o `user_id` autenticado, chama `POST https://connector-gateway.lovable.dev/api/v1/app-users/oauth2/authorize` com os escopos abaixo e devolve a `authorization_url` do Google + um `session_id`. O front abre em nova aba (mesmo padrão que corrigimos hoje).
- **`google-calendar-connect-status`** — dado o `session_id`, pergunta ao gateway se a autorização foi concluída e recupera a `connection_key` per-user, que fica armazenada em `user_google_tokens` (mantemos a tabela, mas passa a guardar `connection_key` em vez de `access_token`/`refresh_token`).

Escopos:
```
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
https://www.googleapis.com/auth/calendar.events
```

### 3. Reescrever a sincronização

`google-calendar-sync-activity` e `google-calendar-disconnect` passam a chamar o gateway com dois headers:
```
Authorization: Bearer ${LOVABLE_API_KEY}
X-Connection-Api-Key: ${connection_key do usuário}
```
em vez de renovar tokens manualmente. Endpoints usados continuam os mesmos:
- `POST /calendar/v3/calendars/primary/events`
- `PATCH /calendar/v3/calendars/primary/events/{id}`
- `DELETE /calendar/v3/calendars/primary/events/{id}`

Isso remove todo o código de refresh de token, que era o ponto mais frágil da implementação anterior.

### 4. Ajuste do banco

Alteração mínima em `user_google_tokens`:
- Adicionar coluna `connection_key text` (nullable).
- Manter `google_email`, `user_id`, `workspace_id`.
- Remover uso das colunas `access_token`, `refresh_token`, `expires_at`, `scope` no código (colunas continuam no banco por compatibilidade; podem ser dropadas depois).

Migration com `GRANT` + RLS já existente.

### 5. Front-end

`GoogleCalendarConnect.tsx` passa a:
1. Chamar `google-calendar-connect-start` → recebe URL do Google + `session_id`.
2. Abre a URL em nova aba (correção que já fizemos, mantida).
3. Faz polling a cada 2s em `google-calendar-connect-status` até detectar `connected` (ou timeout de 3 min).
4. Ao conectar, mostra o e-mail e permite desconectar.

### 6. Limpeza (só depois de validar)

- Deletar Edge Functions antigas: `google-calendar-oauth-start`, `google-calendar-oauth-callback`.
- Remover secrets `GOOGLE_OAUTH_CLIENT_ID` e `GOOGLE_OAUTH_CLIENT_SECRET` (agora inúteis).
- No Google Cloud Console, o client OAuth antigo pode ser desativado — o client do connector (`lovable-command`, `919967526716-…`) é quem passa a atender todos os usuários.

## Riscos / observações

- **App é Vite, não TanStack Start.** A knowledge oficial da Lovable pressupõe TanStack; vou adaptar o mesmo protocolo (`/api/v1/app-users/oauth2/authorize` + `X-Connection-Api-Key`) manualmente nas Edge Functions. Se o gateway exigir um fluxo específico que só o SDK TanStack implementa, ajusto na hora da execução.
- Usuários já conectados no fluxo antigo terão que **reconectar** — não dá para migrar tokens de um sistema para o outro.
- A URI de callback do OAuth agora é do gateway da Lovable (`https://connector-gateway.lovable.dev/api/v1/app-users/oauth2/callback`), não do Supabase. Já está configurada corretamente porque o client foi criado via `connect_client`.

## O que NÃO vou mexer

- Lógica de negócio da sincronização (o que vira evento, título, descrição, mapa em `google_calendar_sync_map`).
- UI do Perfil, botões, textos.
- Escopo da sincronização (continua só atividades de projeto, unidirecional Hero → Google).