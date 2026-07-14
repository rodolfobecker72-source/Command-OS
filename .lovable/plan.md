SITUAÇÃO ATUAL

A integração com Google Calendar já está implementada no código e as Edge Functions estão implantadas:

- `google-calendar-oauth-start` — gera URL de consentimento OAuth.
- `google-calendar-oauth-callback` — troca o `code` por tokens e salva em `user_google_tokens`.
- `google-calendar-sync-activity` — cria/atualiza/remove eventos no Google Calendar dos responsáveis a partir das atividades de projeto.
- `google-calendar-disconnect` — revoga o token e remove a conexão.
- A tela **Perfil → Google Calendar** permite conectar/desconectar a conta.

Porém, a chamada de teste à Edge Function retornou:

```text
500 — {"error":"GOOGLE_OAUTH_CLIENT_ID não configurado"}
```

E o projeto não possui os secrets `GOOGLE_OAUTH_CLIENT_ID` nem `GOOGLE_OAUTH_CLIENT_SECRET`. Ou seja: o fluxo está pronto, mas ainda não funciona porque faltam as credenciais do Google OAuth.

O QUE SERÁ FEITO

1. Obter credenciais OAuth do Google
   - Acessar Google Cloud Console → APIs & Services → Credentials.
   - Criar (ou usar) um OAuth 2.0 Web client.
   - Adicionar a URI de redirecionamento autorizada:
     ```text
     https://itglphakocafsmzsdyfo.supabase.co/functions/v1/google-calendar-oauth-callback
     ```
   - Copiar `Client ID` e `Client Secret`.

2. Configurar secrets no projeto
   - Adicionar `GOOGLE_OAUTH_CLIENT_ID` com o Client ID.
   - Adicionar `GOOGLE_OAUTH_CLIENT_SECRET` com o Client Secret.
   - Reimplantar as Edge Functions para que elas recebam as novas variáveis.

3. Validar a integração
   - Testar `google-calendar-oauth-start` para confirmar que a URL de consentimento é gerada sem erro.
   - Testar `google-calendar-sync-activity` com uma atividade de projeto que tenha data e responsável conectado.

4. Documentar limitações atuais para o usuário
   - A sincronização é unidirecional: Hero → Google Calendar.
   - Sincroniza apenas atividades de projeto (`project_activities`) que tenham `due_date` e responsáveis conectados.
   - Não sincroniza compromissos do Meu Calendário, datas de execução de orçamentos nem eventos do Google de volta para o Hero.

PRÉ-REQUISITO DO USUÁRIO

- Disponibilizar o `Client ID` e o `Client Secret` do Google OAuth (ou acesso ao Google Cloud Console para criá-los).
- Confirmar se o domínio de publicação `https://command.hero.rec.br` deve aparecer na tela de consentimento e na origem do evento (já está hardcoded no `source.url` da função de sync).

ESCOPO FORA DESTE PLANO

- Sincronizar compromissos do Meu Calendário.
- Sincronização bidirecional.
- Alterar o escopo de permissões do Google (será mantido `calendar.events` + `userinfo.email`).