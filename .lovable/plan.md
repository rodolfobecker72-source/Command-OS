

# Diagnóstico e Correção: Sistema Lento e Intermitente

## Problema Real

Confirmei que as políticas RLS estão **corretas e PERMISSIVE** no banco. O problema é de **arquitetura do código**, não do banco de dados. Identifiquei três causas-raiz:

### 1. Carregamento massivo e frágil
O `CRMContext` dispara **12 queries paralelas** ao banco no mount. Qualquer erro em uma query é silenciosamente ignorado (usa `data || []`), e se o carregamento for lento, o usuário pode tentar salvar antes dos dados estarem prontos.

### 2. Funções de mutação sem `useCallback`
Nenhuma das 30+ funções de mutação (addClient, updateClient, addBudget, etc.) usa `useCallback`. Isso faz com que o contexto inteiro re-renderize em cascata a cada mudança de estado, causando lentidão.

### 3. Erros silenciosos no carregamento
O `loadAll` não verifica os `error` de cada resposta individual. Se `clientsRes.error` existir, ele simplesmente usa `[]` e continua, sem avisar o usuário.

## Plano de Correção

### Etapa 1: Corrigir o carregamento de dados (`loadAll`)
- Verificar `error` em cada resposta individual das 12 queries
- Exibir `toast.error` quando alguma query falhar, indicando qual tabela
- Adicionar retry automático (1 tentativa) para queries que falharem

### Etapa 2: Otimizar as funções com `useCallback`
- Envolver todas as funções de mutação em `useCallback` com as dependências corretas
- Isso evita re-renderizações desnecessárias de todos os componentes que consomem o contexto

### Etapa 3: Adicionar proteção contra operações durante carregamento
- Nas páginas de formulário (NewBudget, EditClient, BudgetDetail), verificar `isLoading` do CRM antes de permitir submit
- Desabilitar botões de salvar enquanto `isLoading === true`

### Etapa 4: Memoizar o `value` do Provider
- Usar `useMemo` para o objeto `value` passado ao `CRMContext.Provider`
- Evita que todos os consumers re-renderizem quando apenas uma parte do estado muda

## Arquivos a serem modificados
- `src/contexts/CRMContext.tsx` — correções principais (loadAll, useCallback, useMemo)
- `src/pages/crm/NewBudget.tsx` — desabilitar submit durante loading
- `src/pages/crm/BudgetDetail.tsx` — desabilitar ações durante loading
- `src/pages/clients/EditClient.tsx` — desabilitar submit durante loading
- `src/pages/clients/NewClient.tsx` — desabilitar submit durante loading

