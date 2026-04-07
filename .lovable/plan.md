

# Plano: Área Administrativa (Financeiro + Patrimonio)

## O que será construído

1. **Novo grupo "Administrativo" no menu lateral** com duas páginas:
   - **Financeiro** — painel completo de controle financeiro
   - **Patrimônio** — página "Em construção" (placeholder)

2. **Página Financeiro** com 4 seções:
   - **Relação de Projetos do Mês**: Seletor de mês, lista dos projetos aprovados com `execution_month` correspondente. Cada linha mostra: ID proposta, nome do projeto, cliente, serviços, valor por serviço, custo real (da execução no CRM), valor NF, margem. Clique abre a aba de Execução do projeto no CRM.
   - **Painel Financeiro Anual**: Visão do ano com gráficos — faturamento mensal, custo real mensal, margem real mensal, comparativo metas vs realizado.
   - **Contas Financeiras**: CRUD para cadastrar contas (ex: Banco do Brasil, Caixa, PagSeguro). Cada conta tem nome, tipo (corrente/poupança/carteira digital), banco, agência, número.
   - **Acesso à Execução**: Link direto para a aba de execução de cada projeto aprovado.

3. **Permissões**: Páginas restritas de `vendedor`, `visualizador` e `time_hero`.

## Estrutura do Banco de Dados

Novas tabelas via migration:

```text
financial_accounts
├── id (uuid, PK)
├── workspace_id (uuid, NOT NULL)
├── name (text)           -- "Banco do Brasil", "PagSeguro"
├── type (text)           -- "corrente", "poupanca", "carteira_digital", "outro"
├── bank (text)           -- Nome do banco
├── agency (text)         -- Agência
├── account_number (text) -- Número da conta
├── is_active (boolean, default true)
├── created_at, updated_at
```

RLS: mesmas políticas padrão com `has_workspace_access`.

## Arquivos a criar/editar

| Arquivo | Ação |
|---------|------|
| `src/config/pages.ts` | Adicionar entries `financeiro` e `patrimonio` no grupo "Administrativo" |
| `src/components/layout/Sidebar.tsx` | Adicionar grupo "Administrativo" com ícone e itens |
| `src/pages/admin/FinancialPage.tsx` | Página principal do financeiro (seletor de mês, tabela de projetos, painel anual, contas) |
| `src/pages/admin/PatrimonioPage.tsx` | Placeholder "Em construção" |
| `src/App.tsx` | Adicionar rotas `/financeiro` e `/patrimonio` com PageGuard |
| Migration SQL | Criar tabela `financial_accounts` |

## Detalhes Técnicos

- **Dados dos projetos do mês**: Query em `budgets` filtrando `status = 'aprovada'` e `execution_month = 'YYYY-MM'` selecionado, join com `budget_versions` (versão aprovada) e dados de `execution` (JSONB no budget) para custos reais.
- **Painel anual**: Agrupa budgets aprovados por `execution_month` para calcular totais mensais de faturamento, custo e margem.
- **Contas financeiras**: CRUD simples usando Supabase client, preparando estrutura para futuro vínculo de recebimentos/pagamentos.

