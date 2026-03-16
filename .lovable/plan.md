

# Script SQL Consolidado -- Migração Completa Command OS

## Objetivo

Gerar um arquivo `docs/migration-full-consolidated.sql` contendo um script unico e pronto para colar no SQL Editor de um novo projeto Supabase limpo. O script replica 100% do estado atual do banco.

## Estrutura do Script

O script sera organizado em blocos sequenciais com comentarios claros:

```text
1. ENUM app_role
2. FUNCOES AUXILIARES (security definer) -- criadas antes das tabelas pois as RLS dependem delas
3. TABELAS (na ordem correta de dependencias):
   - profiles
   - workspaces
   - workspace_members
   - workspace_invites
   - workspace_settings (UNIQUE workspace_id)
   - workspace_layout (UNIQUE workspace_id)
   - clients
   - budgets (depende de workspaces)
   - budget_versions (depende de budgets + workspaces)
   - prospection_leads
   - kanban_columns
   - project_columns
   - project_cards (depende de budgets)
   - service_categories
   - service_objectives
   - service_items
   - payment_terms
   - score_history (depende de clients)
   - assets
   - hard_drives
   - legacy_projects
   - monthly_goals (UNIQUE workspace_id + month)
   - landing_leads (sem workspace_id -- publica)
4. RLS POLICIES (todas PERMISSIVE, estado final)
5. TRIGGER handle_new_user (on auth.users)
6. TRIGGER update_updated_at (workspace_layout)
7. FUNCOES DE NEGOCIO (handle_signup_workspace, accept_invite)
8. FUNCAO update_updated_at_column
9. INDICES
10. STORAGE BUCKETS (avatars, logos) + policies
11. CHECKLIST DE VALIDACAO (como comentarios SQL)
```

## Tabelas reconstruidas a partir do schema atual

As tabelas que nao tinham CREATE TABLE nos migration files serao reconstruidas com base no schema real extraido do banco (types.ts + contexto fornecido). Sao elas:

- **clients**: id, workspace_id, company_name, cnpj, responsible_person, email, phone, lead_origin, sector, score, created_at, updated_at
- **budgets**: id, workspace_id, client_id, proposal_id, project_name, project_description, service_type, objective, description, payment_terms, location, status, includes_tax, includes_logistics, includes_accommodation, includes_meals, includes_raw_material, includes_technical_visit, has_execution_date, execution_start_date, execution_end_date, execution_month, current_version, approved_version, approval_date, final_value, execution (jsonb), contract_url, nf_url, created_at, updated_at
- **budget_versions**: id, workspace_id, budget_id (FK budgets), version, services (jsonb), operational_costs (jsonb), costs (jsonb), production_cost, fixed_cost_percentage, nf_cost_percentage, total_cost, full_price, discount4_price, discount5_price, margin, is_rejected, reason, rejection_reason, created_at
- **prospection_leads**: id, workspace_id, company_name, contact_name, contact_role, phone, email, city, origin, segment, acquisition_type, estimated_potential, temperature, funnel_status, prospection_responsible, closing_responsible, last_contact_date, next_action, next_action_date, priority, strategic_notes, created_at, updated_at
- **kanban_columns**: id, workspace_id, key, label, color, order, is_default
- **project_columns**: id, workspace_id, key, label, color, order, is_default
- **project_cards**: id, workspace_id, budget_id (FK budgets), proposal_id, project_name, client_name, client_id, objective, status, service_types (jsonb), progress, tasks (jsonb), links (jsonb), comments (jsonb), material_link, notes, start_date, end_date, created_at, updated_at
- **service_categories**: id, workspace_id, key, label, order, is_default
- **service_objectives**: id, workspace_id, key, label, category_key, order
- **score_history**: id, workspace_id, client_id (FK clients), score, previous_score, reason, created_at
- **assets**: id, workspace_id, name, description, serial_number, hero_asset_number, photo, reference_link, assigned_to, value, created_at, updated_at
- **hard_drives**: id, workspace_id, label, capacity_gb, projects (jsonb), created_at
- **legacy_projects**: id, workspace_id, project_number, client_id, client_name, size_gb, created_at

## Politicas RLS (estado final)

Todas as policies usam os nomes finais (ex: `clients_select`, `budgets_insert`) e sao PERMISSIVE. Tabelas com logica especial:

- **workspace_members**: 2 policies INSERT (admin + owner self-insert), DELETE/UPDATE restrito a owner/admin
- **workspace_invites**: write ops restritas a owner/admin
- **monthly_goals**: write ops restritas a owner
- **profiles**: SELECT own + SELECT peers (via workspace_members join)
- **landing_leads**: INSERT para anon+authenticated, SELECT para authenticated
- **score_history**: sem UPDATE policy (intencional)

## Storage

Buckets `avatars` e `logos` com policies para upload, update, delete e leitura publica.

## Entregavel

Um unico arquivo `docs/migration-full-consolidated.sql` pronto para copiar e colar.

