

# Add "Execution Month" field to budgets

## Overview
Add a simple `execution_month` field (stored as `YYYY-MM`) to budgets, prompted on approval, displayed in budget details and CRM cards, with a filter in the Kanban view.

## Database Change
**Migration**: Add `execution_month` column to `budgets` table:
```sql
ALTER TABLE public.budgets ADD COLUMN execution_month text DEFAULT NULL;
```

## Code Changes

### 1. `src/types/crm.ts` — Budget interface
- Add `executionMonth: string | null` to the `Budget` interface
- Add `executionMonth?: string | null` to the `CRMCard` interface

### 2. `src/contexts/CRMContext.tsx`
- **`budgetFromDb`**: Map `execution_month` → `executionMonth`
- **`approveBudget`**: Accept a third parameter `executionMonth: string`, save it to DB alongside approval
- **`getCRMCards`**: Include `executionMonth` from budget in the CRMCard

### 3. `src/pages/crm/BudgetDetail.tsx` — Approval dialog
- In the approve dialog, add a month/year input (MM/YYYY format) before confirming
- Pass the selected month to `approveBudget(budgetId, version, executionMonth)`
- Display the execution month badge in the budget detail header when set

### 4. `src/pages/crm/CRMKanban.tsx` — Approval via drag
- When dragging to "aprovada", show a small dialog to collect the execution month before calling `approveBudget`

### 5. `src/components/crm/KanbanCard.tsx` — Badge
- If `card.executionMonth` exists, show a badge like "Execução: Mar/2026" using formatted month name in Portuguese

### 6. `src/pages/crm/CRMKanban.tsx` — Filter
- Add a month filter dropdown (showing months that exist in current cards) above the Kanban board
- Filter cards by `executionMonth` when selected

## Display Format
- Internal storage: `"2026-04"` (YYYY-MM)
- Display: `"Abr/2026"` using Portuguese month abbreviations
- Input: month/year selector or MM/YYYY text input

