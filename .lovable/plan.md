

## Remover arquivos de serviço legados (localStorage)

Esses 6 arquivos usam `localStorage` e não são mais importados por nenhum componente ativo — todo o CRUD agora passa pelo banco de dados via contexts.

### Arquivos a deletar:
1. `src/services/clientService.ts`
2. `src/services/budgetService.ts`
3. `src/services/assetService.ts`
4. `src/services/storageService.ts`
5. `src/services/prospectionService.ts`
6. `src/services/settingsService.ts`

Nenhuma outra alteração necessária — esses arquivos são código morto.

