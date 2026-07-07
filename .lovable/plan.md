## Objetivo
Fazer o sistema refletir automaticamente qualquer alteração de dados (feita por você ou por outro usuário) sem precisar recarregar a página, em todas as áreas: CRM, Prospecção, Projetos, Clientes, Financeiro e Calendários. As atualizações acontecem silenciosamente.

## Como funciona (visão do usuário)
- Você adiciona um link numa atividade → o atalho na listagem de projetos aparece na hora.
- Um colega move um card no Kanban do CRM ou muda um lead de status → sua tela reflete a mudança em segundos.
- Um lançamento novo no financeiro aparece automaticamente no dashboard.
- Sem toasts, sem popups, sem "clique para atualizar" — a tela apenas se mantém viva.

## Escopo das tabelas
Habilitar realtime e assinar mudanças (INSERT / UPDATE / DELETE) nas tabelas:

- **CRM**: `budgets`, `budget_versions`, `kanban_columns`, `service_categories`, `service_items`, `service_objectives`, `payment_terms`
- **Prospecção**: `prospection_leads`
- **Projetos**: `project_cards`, `project_activities`, `project_columns`, `legacy_projects`
- **Clientes**: `clients`, `score_history`
- **Financeiro**: `cashflow_entries`, `financial_accounts`, `credit_cards`, `cost_centers`, `revenue_centers`, `assets`, `hard_drives`
- **Calendários / Operação**: `appointments`, `calendar_notes`, `monthly_goals`
- **Workspace / Config** (para refletir mudanças de permissão, layout, metas): `workspace_members`, `workspace_settings`, `workspace_layout`, `workspace_contract_template`

## Estratégia técnica
1. **Migration** única que roda `ALTER PUBLICATION supabase_realtime ADD TABLE …` para cada tabela acima, e `ALTER TABLE … REPLICA IDENTITY FULL` (necessário para receber payload completo em UPDATE/DELETE, respeitando RLS existente).
2. **Hook genérico** `useRealtimeSync(tables, onChange)` em `src/hooks/useRealtimeSync.ts`:
   - Cria um único `supabase.channel` por consumidor.
   - Escuta `postgres_changes` filtrado por `workspace_id = <workspace atual>` quando a tabela tiver essa coluna.
   - Chama um callback leve (normalmente um "refetch" do contexto) com debounce (~300ms) para agrupar bursts.
   - Cleanup com `supabase.removeChannel` no unmount.
3. **Integração nos contextos existentes** (fonte única de verdade já centralizada):
   - `CRMContext` → refetch de budgets, versions, colunas, categorias, items, terms.
   - `ProspectionContext` → refetch de leads.
   - Novo hook local em `ProjectManagementPage` → refetch de cards + activities + columns (resolve exatamente o caso do link na atividade que não atualiza o atalho).
   - `FinancialPage` / `PatrimonioPage` → refetch das listas exibidas.
   - `useAppointments` → refetch de appointments.
   - `MyCalendarPage`, `TeamCalendarPage`, `CalendarPage` → assinar `appointments`, `project_activities`, `prospection_leads` (para "próxima ação").
   - `WelcomePage` / `HomePage` → assinar `prospection_leads`, `project_activities`, `monthly_goals` para manter avisos e métricas em dia.
   - `Sidebar` / `PageGuard` → assinar `workspace_members` para refletir mudanças de permissão sem novo login.
4. **RLS** permanece inalterada — realtime só entrega ao usuário linhas que ele já pode ler.
5. **Sem toasts**: o refetch atualiza o estado do contexto e o React re-renderiza. Onde há edição em andamento (dialogs abertos, formulários), o refetch atualiza a lista de fundo mas não fecha o dialog.

## Detalhes técnicos
- Um único canal por página/contexto (evita custo de reconexões).
- `REPLICA IDENTITY FULL` só em tabelas com RLS por `workspace_id` para que o filtro no cliente funcione com o `OLD` record em DELETE.
- Debounce evita tempestade de refetches quando um usuário salva 10 atividades em sequência.
- Nada muda em UI/estilo; é puramente de dados.

## Fora de escopo
- Colaboração ao vivo em campos de formulário (cursores, edição simultânea).
- Notificações/toasts de "fulano alterou X" — você pediu silencioso.
- Histórico de auditoria de alterações.

## Entregáveis
- 1 migration habilitando realtime nas tabelas listadas.
- `src/hooks/useRealtimeSync.ts` (novo).
- Edições nos contextos e páginas listados acima para plugar o hook a funções de refetch já existentes.