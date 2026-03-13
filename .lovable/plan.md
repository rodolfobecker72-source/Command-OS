

# Corrigir ordenação alfabética na lista de clientes

## Problema
A ordenação é aplicada apenas no `loadAll` e `addClient` do CRMContext, mas `updateClient` e `recalculateScores` modificam o array sem re-ordenar, quebrando a ordem.

## Solução
Aplicar `.sort()` na lista filtrada diretamente no `ClientDashboard.tsx`, garantindo que a exibição esteja sempre ordenada independentemente de como o array foi modificado.

### `src/pages/clients/ClientDashboard.tsx`
- Adicionar `.sort((a, b) => a.companyName.localeCompare(b.companyName, 'pt-BR'))` ao final do `filteredClients` filter chain

