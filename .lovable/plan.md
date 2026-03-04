

# Plano: Corrigir versao do orcamento nao sendo criada

## Problema raiz

Bug classico de **stale closure** no React.

1. `handleSubmit` chama `addBudget()` que insere o budget no DB e chama `setBudgets(prev => [...prev, newBudget])` 
2. Logo em seguida, `handleSubmit` chama `addBudgetVersion(newBudget.id, ...)`
3. Dentro de `addBudgetVersion` (linha 680): `const budget = budgets.find(b => b.id === budgetId)`
4. **O state `budgets` ainda nao foi atualizado** porque `setBudgets` e assincrono no React. O `budgets` no closure ainda e o array antigo (sem o novo budget).
5. `budget` e `undefined`, e a funcao retorna silenciosamente na linha 681: `if (!budget) return;`

Resultado: o budget e salvo no DB, mas a versao (composicao de custos) nunca e criada.

## Solucao

### Arquivo: `src/contexts/CRMContext.tsx`

Modificar `addBudgetVersion` para nao depender de encontrar o budget no state local. Em vez de buscar `budget.currentVersion`, aceitar o `currentVersion` diretamente do budget que acabou de ser retornado, ou buscar no state de forma funcional.

Abordagem mais simples: na linha 680-682, se o budget nao for encontrado no state local, usar `currentVersion = 0` como fallback (ja que o budget acabou de ser criado com `current_version: 0`). Ou melhor: consultar o DB diretamente para obter o `current_version`.

**Solucao escolhida**: Remover a dependencia do state local. Se o budget nao for encontrado em `budgets`, buscar o `current_version` diretamente do banco de dados antes de inserir a versao.

```typescript
const addBudgetVersion = async (budgetId, versionData) => {
  if (!workspaceId) return;
  
  let currentVersion: number;
  const budget = budgets.find(b => b.id === budgetId);
  if (budget) {
    currentVersion = budget.currentVersion;
  } else {
    // Budget recem-criado, state ainda nao atualizou - buscar do DB
    const { data: budgetData } = await supabase
      .from('budgets').select('current_version')
      .eq('id', budgetId).single();
    currentVersion = budgetData?.current_version ?? 0;
  }
  
  const newVersionNum = currentVersion + 1;
  // ... resto da logica igual ...
};
```

Isso resolve o problema sem alterar a API publica da funcao.

