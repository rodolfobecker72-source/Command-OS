

# Plano: Fluxo de Caixa + Centros de Custo/Receita

## Resumo

Adicionar ao módulo Financeiro:
- Nova aba **Fluxo de Caixa** (primeiro item) para lançamento de receitas e despesas vinculadas a contas financeiras
- Nova aba **Configurações** (último item) para gerenciar centros de receita externa e centros de custo

## Novas tabelas no banco de dados

### 1. `revenue_centers` — Centros de receita externa
- `id`, `workspace_id`, `name`, `is_active`, `created_at`

### 2. `cost_centers` — Centros de custo
- `id`, `workspace_id`, `name`, `is_active`, `created_at`

### 3. `cashflow_entries` — Lançamentos de fluxo de caixa
- `id`, `workspace_id`
- `type` — `receita` ou `despesa`
- `description` — descrição do lançamento
- `value` — valor (sempre positivo)
- `date` — data do lançamento
- `account_id` — referência à conta financeira
- `budget_id` — (nullable) vínculo com projeto aprovado (para receitas de projeto)
- `revenue_center_id` — (nullable) vínculo com centro de receita (para receitas externas)
- `cost_center_id` — (nullable) vínculo com centro de custo (para despesas não-projeto)
- `notes`, `created_at`, `updated_at`

RLS em todas as tabelas com `has_workspace_access`.

## Alterações na interface (`FinancialPage.tsx`)

### Aba "Fluxo de Caixa" (primeira posição)
- Filtro por mês e por conta financeira
- Tabela com colunas: Data, Tipo (badge receita/despesa), Descrição, Projeto ou Centro, Conta, Valor
- Resumo no topo: Total Receitas, Total Despesas, Saldo do período
- Botão "Novo Lançamento" abre dialog com:
  - Tipo (Receita / Despesa)
  - Descrição, Valor, Data
  - Conta financeira (select das contas cadastradas)
  - Se receita: opção de vincular a Projeto ou Centro de Receita
  - Se despesa: opção de vincular a Centro de Custo
  - Observações

### Aba "Configurações" (última posição)
- Duas seções lado a lado ou empilhadas:
  - **Centros de Receita**: CRUD simples (nome, ativo/inativo)
  - **Centros de Custo**: CRUD simples (nome, ativo/inativo)

### Ordem final das abas
1. Fluxo de Caixa
2. Projetos do Mês
3. Painel Anual
4. Contas Financeiras
5. Configurações

## Detalhes técnicos

- Migration SQL cria as 3 tabelas com RLS policies
- Queries usam `supabase.from('cashflow_entries')` com joins em `financial_accounts`, `revenue_centers`, `cost_centers` e `budgets`
- Para receitas de projeto, o select de projetos lista budgets aprovados do workspace
- Todos os lançamentos são manuais (não automáticos) — o usuário lança receita/despesa quando desejar

