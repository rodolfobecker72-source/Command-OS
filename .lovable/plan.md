

# Plano: Corrigir salvamento silencioso no formulario de orcamento

## Problema identificado

O formulario `NewBudget.tsx` falha silenciosamente em dois pontos:

1. **Validacao sem feedback** (linha 297): `if (!validateForm()) return;` -- quando a validacao falha, nada acontece. Nao ha toast nem indicacao visual dos erros.

2. **`addBudget` retorna null sem feedback** (linha 323): `if (!newBudget) return;` -- se o `addBudget` falhar (ex: workspaceId undefined), o formulario simplesmente para sem avisar.

3. **`proposalId` pode ficar vazio**: O `formData.proposalId` e inicializado com `nextProposalId` do `useMemo`, mas como `useState` captura apenas o valor inicial, se `budgets` ainda nao carregou quando o componente montou, o `proposalId` pode ficar com valor desatualizado.

## Solucao

### Arquivo: `src/pages/crm/NewBudget.tsx`

1. Adicionar `toast.error` quando `validateForm()` falha, mostrando quais campos estao faltando
2. Adicionar `toast.error` quando `addBudget` retorna null (workspace nao carregado)
3. Adicionar `useEffect` para sincronizar `formData.proposalId` com `nextProposalId` quando budgets carregam
4. Mostrar visualmente os erros de validacao nos campos (ja existe `errors` state, mas precisa ter feedback visual)

