

# Correção: Execução não salva valores reais e custos extras

## Problema Identificado

Duas causas-raiz:

### 1. Políticas RLS ainda RESTRICTIVE
As políticas de todas as tabelas (incluindo `budgets`) continuam como **RESTRICTIVE** (`Permissive: No`). Isso bloqueia as operações de UPDATE no campo `execution` (JSONB). A migração anterior pode não ter sido aplicada corretamente.

### 2. `persistExecution` engole erros silenciosamente
A função que salva a execução no banco faz `catch (e) { console.error(...) }` — o usuário nunca é notificado quando o salvamento falha.

## Plano de Correção

### Etapa 1: Migração — Recriar políticas como PERMISSIVE
Dropar e recriar todas as políticas RLS das tabelas principais (budgets, budget_versions, clients, etc.) usando o tipo padrão PERMISSIVE (sem especificar `AS RESTRICTIVE`).

### Etapa 2: Adicionar feedback de erro no `persistExecution`
Em `src/contexts/CRMContext.tsx`, modificar `persistExecution` para:
- Verificar o `error` retornado pelo Supabase
- Exibir `toast.error` quando falhar
- Fazer o mesmo para `updateExecutionCost`, `addExtraCost`, `removeExtraCost`

### Arquivos a modificar
- Nova migração SQL (políticas RLS PERMISSIVE)
- `src/contexts/CRMContext.tsx` — feedback de erro em `persistExecution`

