

# Corrigir acesso a proposta no CRM

## Problema identificado

Quando voce clica em um card do CRM para ver o orcamento, a pagina mostra "Orcamento nao encontrado" porque os dados ainda estao sendo carregados do banco de dados. O componente `BudgetDetail` verifica se o budget existe antes dos dados terminarem de carregar, e como a lista comeca vazia, ele assume que o orcamento nao existe.

## Solucao

Adicionar um estado de carregamento (`budgetsLoading`) no contexto do CRM e exibir um indicador de loading na pagina de detalhe do orcamento enquanto os dados estao sendo buscados.

## Detalhes tecnicos

### 1. CRMContext.tsx
- Adicionar estado `budgetsLoading` (similar ao `clientsLoading` que ja existe para clientes)
- Inicializar como `true` e setar para `false` apos `loadAllData` completar
- Expor `budgetsLoading` na interface do contexto

### 2. BudgetDetail.tsx
- Importar `budgetsLoading` do contexto
- Antes de mostrar "Orcamento nao encontrado", verificar se `budgetsLoading` e `true`
- Se estiver carregando, mostrar um spinner de loading
- So mostrar "nao encontrado" quando `budgetsLoading === false` e `!budget`

### 3. CRMKanban.tsx (opcional)
- Adicionar loading state similar para o board do Kanban, evitando flash de conteudo vazio

### Mudancas em arquivos

| Arquivo | Mudanca |
|---|---|
| `src/contexts/CRMContext.tsx` | Adicionar `budgetsLoading` ao estado e interface |
| `src/pages/crm/BudgetDetail.tsx` | Adicionar tela de loading antes do check de "nao encontrado" |
| `src/pages/crm/CRMKanban.tsx` | Adicionar loading state para o kanban board |

