

# Fix: Recriar todas as políticas RLS como PERMISSIVE

## Problema

Todas as 60+ políticas RLS em todas as tabelas ainda estão como `RESTRICTIVE`. No PostgreSQL, quando só existem políticas restritivas sem uma política permissiva base, **todas as operações são bloqueadas por padrão**. Isso explica por que nenhum dado salva (clientes, orçamentos, leads, etc.).

## Solução

Executar uma migration SQL que:
1. Remove (DROP) todas as políticas existentes em todas as tabelas
2. Recria cada uma como `PERMISSIVE` (que é o padrão do PostgreSQL)

## Tabelas afetadas (17 tabelas)

clients, budgets, budget_versions, prospection_leads, assets, hard_drives, legacy_projects, kanban_columns, project_cards, project_columns, score_history, service_categories, service_objectives, workspace_invites, workspace_members, workspaces, profiles

## SQL (resumo do padrão por tabela)

```sql
-- Para cada tabela operacional (clients, budgets, etc.):
DROP POLICY IF EXISTS "..." ON public.<table>;
CREATE POLICY "..." ON public.<table>
  FOR <SELECT|INSERT|UPDATE|DELETE>
  TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
  -- ou WITH CHECK para INSERT
```

Políticas especiais mantidas para:
- `profiles`: acesso próprio + peers do workspace
- `workspace_members`: owner/admin para mutações, self-insert como owner
- `workspace_invites`: owner/admin para mutações
- `workspaces`: criação pelo próprio usuário

Nenhuma alteração de código é necessária -- apenas a correção das políticas no banco.

