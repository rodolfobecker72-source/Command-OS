

## Adicionar link do Google Drive no card do projeto

### O que será feito

Adicionar um campo `drive_url` na tabela `budgets` e exibir um botão de Google Drive ao lado do identificador da proposta no BudgetDetail. O link pode ser adicionado na criação ou editado depois.

### Alterações

| Arquivo/Recurso | Alteração |
|---|---|
| **Migration** | `ALTER TABLE budgets ADD COLUMN drive_url text DEFAULT '';` |
| `src/types/crm.ts` | Adicionar `driveUrl: string` na interface `Budget` |
| `src/contexts/CRMContext.tsx` | Mapear `driveUrl` ↔ `drive_url` no `updateBudget` e no fetch |
| `src/pages/crm/BudgetDetail.tsx` | Ao lado do identificador da proposta, adicionar input para colar link + botão com ícone do Drive que abre em nova aba. Editável inline (sempre, não só no modo edição) |
| `src/pages/crm/NewBudget.tsx` | Campo opcional para Google Drive URL na criação |

### Comportamento

- Ao lado do proposal ID, um botão/ícone de link externo aparece se `driveUrl` estiver preenchido
- Se vazio, mostra um botão "+" para adicionar o link
- Clique no botão abre o link em nova aba
- Inline edit: ao clicar no ícone de edição, abre input para colar/editar o link com botão salvar

