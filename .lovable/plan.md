
# Sincronização com Google Calendar (per-user)

Cada usuário conecta sua própria conta Google. O sistema envia automaticamente as **atividades de projeto atribuídas a ele** (com `due_date`) para o Google Calendar pessoal. Sentido único: **Sistema → Google**.

## Etapa 1 — Você cria as credenciais no Google Cloud Console

Te guio passo a passo (faça antes da implementação):

1. Acesse https://console.cloud.google.com → crie um projeto (ex: "Hero Command").
2. Menu **APIs e Serviços → Biblioteca** → busque **Google Calendar API** → **Ativar**.
3. **APIs e Serviços → Tela de consentimento OAuth**:
   - Tipo: **Externo**
   - Nome do app, e-mail de suporte, e-mail do desenvolvedor
   - Domínios autorizados: `lovable.app` e `hero.rec.br`
   - Escopos: adicione `.../auth/calendar.events` (só eventos, não lê calendários inteiros)
   - Usuários de teste: adicione e-mails dos primeiros usuários (enquanto estiver em modo de teste)
4. **APIs e Serviços → Credenciais → Criar credenciais → ID do cliente OAuth**:
   - Tipo: **Aplicativo da Web**
   - **URIs de redirecionamento autorizados**: vou te dar a URL exata depois de criar a Edge Function (será algo como `https://itglphakocafsmzsdyfo.supabase.co/functions/v1/google-calendar-oauth-callback`)
5. Copie **Client ID** e **Client Secret** — você adiciona como secrets quando eu pedir.

## Etapa 2 — Banco

Nova tabela `user_google_tokens`:
- `user_id`, `workspace_id`
- `access_token`, `refresh_token`, `expires_at`
- `google_email`, `connected_at`
- RLS: cada usuário só vê/edita o próprio registro

Nova tabela `google_calendar_sync_map` (rastreia o que já foi enviado):
- `activity_id` (do sistema) → `google_event_id`
- `user_id`, `last_synced_at`

## Etapa 3 — Edge Functions

1. **`google-calendar-oauth-start`**: gera URL de autorização do Google e redireciona o usuário.
2. **`google-calendar-oauth-callback`**: recebe o `code`, troca por tokens, salva em `user_google_tokens`.
3. **`google-calendar-sync-activity`**: dado um `activity_id`, faz upsert do evento no Google Calendar do responsável (cria se não existir, atualiza se já existir, deleta se a atividade for removida). Renova `access_token` via `refresh_token` quando expirado.

## Etapa 4 — UI

- **Perfil do usuário** (ProfileEditDialog): seção "Google Calendar" com:
  - Botão **"Conectar Google Calendar"** (se não conectado)
  - E-mail conectado + botão **"Desconectar"** (se conectado)
- **ProjectActivitiesDialog**: ao criar/editar/excluir uma atividade com `due_date` e `assignee`, chama `google-calendar-sync-activity` em background (silencioso, com toast só em erro).

## Etapa 5 — O que vai pro Google

Por atividade enviada:
- **Título**: `[Projeto X] Nome da atividade`
- **Data**: `due_date` (evento de dia inteiro)
- **Descrição**: link de volta para o projeto no sistema + descrição da tarefa
- **Calendário**: `primary` do usuário

## Decisões técnicas

- Sentido único Sistema→Google (sem polling, sem webhooks, simples e seguro).
- Sem sync de execução de orçamentos, leads ou notas (apenas atividades, conforme pedido).
- Atividades **existentes** não são enviadas em massa — só novas/editadas a partir da conexão. (Posso adicionar botão "Sincronizar tudo agora" depois, se quiser.)
- Em modo de teste do Google Cloud, só funciona para e-mails na lista de teste. Para liberar para qualquer usuário, precisa enviar o app para verificação do Google (processo separado, pode levar dias). Recomendo começar em teste com sua equipe.

## Próximos passos

Quando você terminar a Etapa 1, me avise que parto para banco + edge functions, te passo a **URI de redirecionamento exata** para colar no Google Console, e depois te peço os secrets `GOOGLE_OAUTH_CLIENT_ID` e `GOOGLE_OAUTH_CLIENT_SECRET`.
