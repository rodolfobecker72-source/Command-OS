

## Diagnóstico: Salvamento de orçamento não funciona

### Problema identificado

Analisei os dois fluxos de salvamento de orçamento:

**1. Criação de novo orçamento (`NewBudget.tsx`):**
- A função `handleSubmit` (linha 302) verifica `if (crmLoading)` e retorna com um toast de erro se os dados ainda estiverem carregando. Se o carregamento for lento ou houver race condition, o botão "parece" não funcionar.
- Mesmo que o loading tenha terminado, se a validação falhar (projeto sem nome, sem cliente, ou sem serviços), ela mostra um toast — mas se o toast não estiver visível (problema de z-index ou timing), parece que nada acontece.

**2. Edição de orçamento existente (`BudgetDetail.tsx`):**
- A função `handleSaveEdit` (linha 196) chama `updateBudget` diretamente, mas **não é async** e **não usa await**. Se `updateBudget` falhar, o erro é capturado internamente e mostra um toast, mas a experiência é confusa porque o `setIsEditing(false)` e `toast.success` na linha 203-204 executam imediatamente **antes** de o update terminar, dando falso feedback de sucesso mesmo se a operação falhar.

### Correções

**Arquivo: `src/pages/crm/NewBudget.tsx`**
- Remover o bloqueio `if (crmLoading)` do `handleSubmit` — o botão já funciona sem `disabled`, e se o workspace não estiver pronto o `ensureWorkspace` no contexto já cuida disso com toast de erro
- Adicionar mais logs de debug para rastreamento

**Arquivo: `src/pages/crm/BudgetDetail.tsx`**
- Tornar `handleSaveEdit` `async` e usar `await` no `updateBudget`
- Mover o `setIsEditing(false)` e `toast.success` para **depois** do await, garantindo que o feedback só apareça se o salvamento realmente funcionar
- Adicionar try/catch para tratar erros e dar feedback adequado

### Resumo das mudanças
- 2 arquivos modificados: `NewBudget.tsx` e `BudgetDetail.tsx`
- Remoção do bloqueio por `crmLoading` na criação
- Correção do fluxo async no salvamento de edição

