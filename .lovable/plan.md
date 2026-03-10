

# Diagnóstico definitivo: "Workspace não carregado"

## Causa raiz real

A mensagem "Workspace não carregado" confirma que `workspaceId` é `null` no momento do salvamento. Isso acontece porque `loadUserData` no `AuthContext` **ignora erros silenciosamente** — se qualquer query falhar (por timeout, token expirado temporariamente, ou erro de rede), as variáveis `workspace` e `membership` ficam `null` permanentemente, sem retry.

O banco está correto (o usuário tem workspace e membership). O problema é 100% no lado do cliente.

## Correções (2 arquivos)

### 1. `src/contexts/AuthContext.tsx` — Retry e logging no carregamento de dados

- Adicionar **log de erro detalhado** quando `workspace_members` ou `workspaces` retorna erro
- Adicionar **retry automático** (até 3 tentativas com delay) no `loadUserData` para recuperar de falhas temporárias de rede/token
- Verificar o `error` retornado pelas queries (atualmente é ignorado — só `data` é destructured)

### 2. `src/contexts/CRMContext.tsx` — Fallback de workspace no ensureWorkspace

- Tornar `ensureWorkspace` **async** e retornar o `workspaceId` diretamente
- Se `workspaceId` (do estado) for null mas `session` existir, fazer uma query direta ao `workspace_members` como fallback
- Usar o `workspaceId` **retornado** pela função em todas as mutações (em vez do valor do closure)
- **Remover o `withTimeout`** — ele estava mascarando o problema real e causando falsos positivos

Fluxo do novo `ensureWorkspace`:
```text
ensureWorkspace()
  ├─ session null? → redirect /login, return null
  ├─ workspaceId exists? → return workspaceId  
  └─ workspaceId null? → query workspace_members
       ├─ found? → return workspace_id
       └─ not found? → toast error, return null
```

Todas as funções de mutação (`addBudget`, `addClient`, `addBudgetVersion`, etc.) passam a usar:
```typescript
const wsId = await ensureWorkspace();
if (!wsId) return null;
// usa wsId no insert em vez de workspaceId!
```

### Resumo
- **AuthContext**: retry + error checking no carregamento de workspace (resolve a causa raiz)
- **CRMContext**: fallback query no ensureWorkspace (resolve o sintoma — garante que mesmo que o load falhe, a mutação ainda funciona)
- Remove `withTimeout` que estava causando complexidade desnecessária

