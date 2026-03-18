

## Análise do Projeto Command OS

### O que existe hoje no Lovable Cloud (Supabase)

O projeto já usa Supabase integralmente como backend. Lovable Cloud **é** Supabase por baixo. A migração consiste em apontar o projeto para um Supabase externo que você controla.

**Componentes em uso:**

| Componente | Detalhes |
|---|---|
| **Auth** | signUp, signInWithPassword, signOut, resetPasswordForEmail, updateUser, admin.createUser, admin.deleteUser, admin.updateUserById, admin.listUsers |
| **Database (17 tabelas)** | profiles, workspaces, workspace_members, workspace_invites, workspace_settings, workspace_layout, clients, budgets, budget_versions, project_cards, kanban_columns, project_columns, service_categories, service_objectives, service_items, payment_terms, prospection_leads, monthly_goals, assets, hard_drives, legacy_projects, score_history, landing_leads |
| **RLS Policies** | Todas as tabelas com RLS ativo, usando funções `has_workspace_access`, `get_user_role`, `has_role` |
| **DB Functions (7)** | `handle_new_user`, `handle_signup_workspace`, `has_workspace_access`, `has_role`, `get_user_role`, `get_user_workspace`, `accept_invite`, `update_updated_at_column` |
| **DB Trigger** | `handle_new_user` on auth.users (cria profile automático) |
| **Edge Functions (3)** | `create-member`, `reset-user-password`, `update-member-profile` |
| **Storage Buckets (2)** | `avatars` (público), `logos` (público) |
| **Secrets (6)** | SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL, SUPABASE_PUBLISHABLE_KEY, LOVABLE_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY |

---

### Plano de Migração (em etapas)

#### Etapa 0 — Preparar o Supabase externo

Configuração manual no dashboard do Supabase:

1. Criar projeto no supabase.com
2. Anotar: `Project URL`, `anon key`, `service_role_key`
3. Em Auth → Settings: configurar Site URL e Redirect URLs (`https://command.hero.rec.br`, `/reset-password`)
4. Criar os storage buckets `avatars` e `logos` (ambos públicos)
5. Configurar secrets no Edge Functions: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`

#### Etapa 1 — Schema do banco (SQL)

Executar as 17 migrações em ordem no SQL Editor do Supabase externo. Isso cria:
- Enum `app_role`
- Todas as 23 tabelas
- Todas as 7 funções (handle_new_user, has_workspace_access, etc.)
- Trigger `handle_new_user` em `auth.users`
- Todas as RLS policies

**Ação manual**: Copiar e executar cada arquivo de `supabase/migrations/` em sequência no SQL Editor.

#### Etapa 2 — Edge Functions

Fazer deploy das 3 Edge Functions via CLI do Supabase:
- `create-member`
- `reset-user-password`
- `update-member-profile`

**Ação manual**: Instalar `supabase` CLI, linkar ao projeto, e executar `supabase functions deploy`.

#### Etapa 3 — Atualizar credenciais no código

Alterar o arquivo `.env` (ou variáveis de ambiente no hosting) para apontar para o novo projeto:
- `VITE_SUPABASE_URL` → nova URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` → nova anon key
- `VITE_SUPABASE_PROJECT_ID` → novo project ID

**Nenhuma mudança de código** é necessária. O `client.ts` já lê das variáveis de ambiente.

#### Etapa 4 — Migrar dados (se necessário)

Se houver dados existentes (usuários, clientes, orçamentos):
1. Exportar dados do Lovable Cloud (via Cloud UI → Database → Export)
2. Importar no novo Supabase via SQL ou CSV import
3. Para usuários Auth: usar `supabase auth admin` ou recriar contas manualmente

#### Etapa 5 — Validação

Testar em ordem:
1. Login/Signup/Reset Password
2. Criação de workspace e membros
3. CRUD de clientes
4. CRM (orçamentos, kanban, versões)
5. Prospecção
6. Metas e regras comerciais
7. Upload de avatars e logos
8. Landing page (captação de leads)

---

### Resumo: o que precisa ser feito manualmente no Supabase

| Item | Onde |
|---|---|
| Criar projeto | supabase.com |
| Executar migrações SQL (17 arquivos) | SQL Editor |
| Criar buckets `avatars` e `logos` (públicos) | Storage |
| Configurar Site URL e Redirects | Auth → URL Configuration |
| Deploy Edge Functions (3) | Supabase CLI |
| Configurar secrets das Edge Functions | Dashboard → Edge Functions → Secrets |
| Exportar/importar dados existentes | Dashboard |
| Atualizar 3 variáveis de ambiente no hosting | `.env` ou plataforma de deploy |

### O que NÃO muda

- Nenhum componente React
- Nenhuma rota
- Nenhum layout ou estilo
- A lógica de negócio do frontend permanece idêntica
- Edge Functions permanecem idênticas

O código já é 100% Supabase. A migração é essencialmente de infraestrutura, não de código.

