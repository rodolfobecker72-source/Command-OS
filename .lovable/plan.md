

# Migrar dados do localStorage para o banco de dados

## Visao geral

Atualmente todos os dados operacionais (Clientes, Orcamentos, Prospeccao, Equipamentos, Configuracoes) estao em localStorage. Isso significa que os dados sao perdidos ao limpar o cache e nao sao compartilhados entre membros da equipe.

A migracao sera feita em **fases**, priorizando os modulos mais criticos primeiro. Cada registro sera vinculado ao `workspace_id` do proprietario para garantir isolamento total entre organizacoes.

---

## Fase 1 - Clientes ✅ CONCLUÍDA

Tabela `clients` criada com RLS por workspace_id. Services e contexts atualizados para usar Supabase.

## Fase 2 - Prospeccao ✅ CONCLUÍDA

Tabela `prospection_leads` criada com RLS por workspace_id. Services e contexts atualizados para usar Supabase.

## Fase 2 - Prospeccao

Tabela `prospection_leads` com todos os campos do tipo `ProspectionLead`, mais workspace_id.

- RLS por workspace_id
- Atualizar `prospectionService.ts` e `ProspectionContext.tsx`

## Fase 3 - Orcamentos (Budgets)

Esta e a entidade mais complexa. Sera dividida em:

- Tabela `budgets` com dados principais (project_name, client_id, status, etc.)
- Tabela `budget_versions` com os dados de cada versao (custos como JSONB para manter flexibilidade)
- Tabela `budget_executions` para dados de execucao (JSONB para custos detalhados)

Todos com workspace_id e RLS.

## Fase 4 - Configuracoes e Dados Secundarios

- Tabela `kanban_columns` (colunas do Kanban por workspace)
- Tabela `service_categories` (categorias de servico por workspace)
- Tabela `service_objectives` (objetivos por categoria/workspace)
- Tabela `assets` (patrimonio por workspace)
- Tabela `hard_drives` (HDs e alocacoes como JSONB, por workspace)
- Tabela `legacy_projects` (projetos legado por workspace)
- Tabela `project_columns` (colunas de gestao de projetos por workspace)
- Tabela `project_cards` (cards de projetos por workspace)

---

## Detalhes tecnicos

### Estrutura das tabelas principais

Todas as tabelas terao:
- `id` UUID primary key
- `workspace_id` UUID NOT NULL referenciando workspaces(id)
- `created_at` / `updated_at` timestamps
- RLS habilitado com politica usando `has_workspace_access(auth.uid(), workspace_id)`

### Campos JSONB

Para manter flexibilidade em estruturas aninhadas complexas (custos, tarefas, links), usaremos colunas JSONB. Isso evita criar dezenas de tabelas para sub-entidades como `CostItem`, `ExecutionCostItem`, `ProjectTask`, etc.

### Mudancas no codigo

1. **Services** (`clientService.ts`, `budgetService.ts`, etc.): reescritos para usar `supabase.from('tabela')` em vez de `localStorage`
2. **Contexts** (`CRMContext.tsx`, `ProspectionContext.tsx`): refatorados para usar React Query com Supabase, com loading states
3. **AuthContext**: fornecera o `workspace_id` do usuario logado para todas as queries

### Sequencia de implementacao

Dado o tamanho da migracao, a implementacao sera feita fase por fase:
1. Criar todas as tabelas e RLS via migracao SQL
2. Atualizar os services e contexts fase por fase
3. Remover referencias a localStorage conforme cada modulo for migrado

### Observacao importante

Dados existentes em localStorage nao serao migrados automaticamente. Apos a migracao, os dados deverao ser re-inseridos pelo sistema.

