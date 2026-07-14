## Migrar Google Calendar para App User Connector

Substituir todo o OAuth próprio (client ID/secret, edge functions de callback, tabela `user_google_tokens`) pelo **App User Connector do Google Calendar** gerenciado pela Lovable. Cada usuário só clica em "Conectar Google Calendar", autoriza e pronto — sem tela de "app não verificado", sem cadastrar testadores, sem Google Cloud Console.

### O que muda para o usuário final
- Popup de consentimento oficial do Google (via gateway Lovable)
- Sem erro `access_denied` mesmo com contas que não são "test users"
- Refresh de token automático (não precisa reconectar)

### Passos

**1. Registrar o App User Connector**
- Rodar `connector_app_user--connect_client` com `connector_id: "google_calendar"`. Abre um formulário onde o admin cola Client ID/Secret de um Google OAuth Web Client (pode reaproveitar o atual). O único redirect URI a cadastrar no Google agora é `https://connector-gateway.lovable.dev/api/v1/app-users/oauth2/callback`.

**2. Nova edge function `google-calendar-connect-init`**
- Recebe o usuário autenticado, chama `connectAppUser` com escopos `userinfo.email`, `userinfo.profile`, `calendar.readonly` (ou `calendar` se precisar escrever), retorna a URL de consentimento para abrir no popup.

**3. Nova edge function `google-calendar-api` (proxy autenticado)**
- Substitui chamadas diretas ao Google. Usa `callAsAppUser` do helper `appUserConnector.ts` para chamar `/calendar/v3/...` via gateway. Cobre listar calendários, listar/criar/atualizar eventos — o que `google_calendar_sync_map` já usa hoje.

**4. Refactor do front-end (`GoogleCalendarConnect.tsx`)**
- Trocar o fluxo `google-calendar-oauth-start` → popup → callback pelo novo `google-calendar-connect-init`.
- Status "conectado" passa a vir de `hasAppUserConnection('google_calendar')` em vez da tabela `user_google_tokens`.
- Manter polling de 2s para detectar a conexão após o popup fechar.

**5. Migrar chamadas existentes ao Calendar**
- Todo código que hoje lê `user_google_tokens` + chama Google direto → passa a invocar `google-calendar-api`. A tabela `google_calendar_sync_map` (mapeamento evento CRM ↔ evento Google) continua igual.

**6. Limpar o legado**
- Remover edge functions `google-calendar-oauth-start` e `google-calendar-oauth-callback`.
- Remover secrets `GOOGLE_OAUTH_CLIENT_ID` e `GOOGLE_OAUTH_CLIENT_SECRET` (não são mais usados no app; ficam só dentro do connector).
- Migration para dropar `user_google_tokens` (só depois de confirmar que ninguém mais lê dela).

### Detalhes técnicos
- Helper `supabase/functions/_shared/appUserConnector.ts` conforme o padrão `tanstack-app-user-connector`, adaptado para Deno/Supabase Edge Functions.
- Chave `GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY` é injetada automaticamente pelo `connect_client`.
- Storage da conexão fica no connector gateway — não precisa de tabela nova no banco.

### Pré-requisito
Você (admin do workspace) precisa completar o formulário do passo 1 colando Client ID/Secret. Pode ser o mesmo par que já usa hoje.

**Quer que eu prossiga?**
