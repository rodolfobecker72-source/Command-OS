

# Migrar Fases 3 e 4 - Orcamentos, Configuracoes e Dados Secundarios

## Visao geral

Migrar todos os dados restantes do localStorage para o banco de dados, completando a migracao iniciada nas Fases 1 e 2.

---

## Fase 3 - Orcamentos (Budgets)

### Tabelas a criar

**budgets** - Dados principais do orcamento
- id, workspace_id, proposal_id, project_name, project_description, client_id, service_type, objective, description, payment_terms, includes_tax, includes_logistics, includes_accommodation, includes_meals, includes_raw_material, has_execution_date, execution_start_date, execution_end_date, location, status, current_version, approved_version, approval_date, final_value, contract_url, nf_url, execution (JSONB - contem ProjectExecution inteiro), created_at, updated_at

**budget_versions** - Versoes de cada orcamento
- id, workspace_id, budget_id (FK -> budgets), version, services (JSONB), operational_costs (JSONB), costs (JSONB), production_cost, fixed_cost_percentage, nf_cost_percentage, total_cost, full_price, discount4_price, discount5_price, margin, reason, is_rejected, rejection_reason, created_at

**Decisao de design**: O campo `execution` sera JSONB na tabela `budgets` em vez de tabela separada, pois e 1:1 com o budget e contem estruturas aninhadas complexas (services com costs, extra costs, delivery links). Isso simplifica bastante o codigo.

### Mudancas no codigo
- Reescrever `budgetService.ts` para usar Supabase
- Atualizar `CRMContext.tsx`: todas as funcoes de budget (addBudget, updateBudget, deleteBudget, addBudgetVersion, etc.) passam a ser async com chamadas ao Supabase
- Score history tambem sera salvo em tabela `score_history`

---

## Fase 4 - Configuracoes e Dados Secundarios

### Tabelas a criar

**kanban_columns** - Colunas do Kanban por workspace
- id, workspace_id, key, label, color, "order", is_default

**service_categories** - Categorias de servico por workspace
- id, workspace_id, key, label, "order", is_default

**service_objectives** - Objetivos por categoria/workspace
- id, workspace_id, category_key, key, label, "order"

**assets** - Patrimonio por workspace
- id, workspace_id, name, description, value, serial_number, hero_asset_number, photo, reference_link, assigned_to, created_at, updated_at

**hard_drives** - HDs com alocacoes como JSONB
- id, workspace_id, label, capacity_gb, projects (JSONB), created_at

**legacy_projects** - Projetos legado por workspace
- id, workspace_id, project_number, client_id, client_name, size_gb, created_at

**project_columns** - Colunas de gestao de projetos
- id, workspace_id, key, label, color, "order", is_default

**project_cards** - Cards de projetos
- id, workspace_id, budget_id, proposal_id, project_name, client_name, client_id, service_types (JSONB), objective, status, progress, tasks (JSONB), links (JSONB), comments (JSONB), material_link, start_date, end_date, notes, created_at, updated_at

**score_history** - Historico de scores
- id, workspace_id, client_id, score, previous_score, reason, created_at

### Mudancas no codigo
- Reescrever `settingsService.ts`, `assetService.ts`, `storageService.ts` para usar Supabase
- Atualizar `CRMContext.tsx`: remover todos os useEffect de localStorage, todas as funcoes passam a ser async
- Seed de dados default: quando um workspace nao tiver kanban_columns, service_categories, service_objectives ou project_columns, inserir os defaults automaticamente

---

## RLS (todas as tabelas)

Todas usarao o mesmo padrao:
- SELECT/INSERT/UPDATE/DELETE com `has_workspace_access(auth.uid(), workspace_id)`

## Triggers

Todas as tabelas com `updated_at` terao trigger `update_updated_at_column`.

## Sequencia de implementacao

1. Criar todas as tabelas via migracao SQL (uma unica migracao)
2. Atualizar `budgetService.ts` para Supabase
3. Atualizar `settingsService.ts`, `assetService.ts`, `storageService.ts` para Supabase
4. Refatorar `CRMContext.tsx` para usar os novos services async
5. Remover todas as referencias a localStorage

## Detalhes tecnicos

- Campos JSONB serao usados para: execution (budget), services/costs (budget_versions), projects (hard_drives), tasks/links/comments (project_cards), service_types (project_cards)
- O campo `order` sera escapado com aspas duplas no SQL pois e palavra reservada
- Dados default (kanban columns, service categories, objectives, project columns) serao inseridos na primeira carga quando o workspace nao tiver registros

