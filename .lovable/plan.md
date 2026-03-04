

# Plano: Migrar localStorage para o banco de dados atual

## Resumo

O `CRMContext.tsx` e o `ProspectionContext.tsx` usam 100% localStorage via service files. As tabelas ja existem no banco com RLS configurado. O plano e substituir todas as leituras e escritas por operacoes diretas no banco via Supabase SDK.

## Abordagem

Refatorar **entidade por entidade** dentro do mesmo CRMContext, substituindo cada `useState(() => localStorage...)` por carregamento assincrono e cada mutacao por operacao no banco. Trabalhar em **3 blocos** para manter o tamanho das mudancas gerenciavel:

### Bloco 1: CRMContext - Carregamento + Clients + Settings

**Carregamento assincrono:**
- Adicionar `isLoading` ao contexto
- Usar `useAuth()` para obter `workspace` (workspace_id)
- Criar `useEffect` que carrega todas as entidades do banco em paralelo quando workspace_id estiver disponivel
- Mapear snake_case do banco para camelCase do TypeScript com funcoes helper

**Clients** (read/write):
- `addClient` -> `supabase.from('clients').insert()` + atualizar estado local
- `updateClient` -> `supabase.from('clients').update()`
- `deleteClient` -> `supabase.from('clients').delete()`

**Settings** (kanban_columns, service_categories, service_objectives, project_columns):
- CRUD direto no banco para cada entidade
- Se tabela vazia no banco, inserir defaults na primeira carga

### Bloco 2: CRMContext - Budgets + Versions + Execution + Project Cards

**Budgets:**
- Carregar budgets + budget_versions separadamente, montar array `versions` em cada budget
- `addBudget` -> insert em `budgets` + `budget_versions`
- `addBudgetVersion` -> insert em `budget_versions` + update `current_version`
- `approveBudget` -> update budget + insert `project_cards`
- Execution updates -> update coluna JSONB `execution` no budget

**Project Cards:**
- CRUD direto na tabela `project_cards`

### Bloco 3: Assets + Hard Drives + Legacy Projects + Score History + Prospection

**Assets, Hard Drives, Legacy Projects, Score History:**
- CRUD direto nas respectivas tabelas

**ProspectionContext:**
- Mesma abordagem: carregar do banco, mutacoes diretas no banco

**Limpeza:**
- Remover/esvaziar os service files de localStorage

## Detalhes tecnicos

- Workspace ID vem de `useAuth().workspace?.id`
- Funcoes helper `toSnakeCase()` / `toCamelCase()` para mapeamento de campos
- Cada mutacao: try/catch com `toast.error()` para feedback
- Apos insert/update com sucesso, atualizar estado local com dados retornados (sem refetch completo)
- Budget versions carregadas via query separada agrupadas por budget_id

## Arquivos modificados

- `src/contexts/CRMContext.tsx` - refatoracao principal
- `src/contexts/ProspectionContext.tsx` - migrar para banco
- `src/services/*.ts` - remover conteudo localStorage

## Arquivos nao modificados

- Schema do banco (tabelas ja existem)
- RLS policies (ja configuradas)
- `src/integrations/supabase/client.ts` (nunca editar)

