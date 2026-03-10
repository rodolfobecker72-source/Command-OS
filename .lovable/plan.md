

# Audit Report: Command CRM — Stability Issues

## Critical Issues Found

### 1. Execution functions do NOT await database persistence (CRITICAL)
**Files:** `CRMContext.tsx` lines 930-1067
**Impact:** Data loss — the most likely cause of intermittent save failures

Functions `updateExecution`, `updateExecutionCost`, `addExtraCost`, `removeExtraCost`, `finalizeExecution`, `addDeliveryLink`, `removeDeliveryLink` all call `persistExecution()` **without `await`**. They are synchronous functions (not async) that fire-and-forget the DB write. If the network is slow or fails, the user sees success in the UI but data is silently lost.

```text
// Current pattern (BROKEN):
const updateExecution = (budgetId, updates) => {  // NOT async
  setBudgets(prev => prev.map(budget => {
    ...
    persistExecution(budgetId, updatedExecution);  // NOT awaited
    return { ...budget, execution: updatedExecution };
  }));
};
```

**Fix:** Make all execution functions `async`, move `persistExecution` call outside `setBudgets`, and `await` it. Add error rollback.

---

### 2. Score recalculation useEffect has race conditions (HIGH)
**File:** `CRMContext.tsx` lines 489-518

This `useEffect` runs on every `budgets` change and fires multiple parallel `async` operations inside a `forEach` without concurrency control. Issues:
- Multiple rapid budget changes trigger overlapping score updates
- `setClients` called from within async forEach — stale closures
- Empty `catch {}` silently swallows score_history insert errors
- Missing `workspace_id` filter on the `.eq('id', clientId)` update call — could update wrong workspace's client (though RLS protects)

**Fix:** Debounce score recalculation, use `Promise.all`, handle errors properly.

---

### 3. `ensureWorkspace` references stale closure of `session`
**File:** `CRMContext.tsx` line 410-446

`ensureWorkspace` is NOT wrapped in `useCallback` and captures `session` and `workspaceId` from closure. But since it's defined inside the component body without deps tracking, the closure captures the values at render time. When called from functions in `useMemo` (line 1295), it may reference stale session/workspace values.

**Fix:** Wrap `ensureWorkspace` in `useCallback` with proper deps, or use refs for session/workspaceId.

---

### 4. `reorderKanbanColumns` uses sequential awaits in a loop (MEDIUM)
**File:** `CRMContext.tsx` lines 564-572

Updates columns one-by-one with individual DB calls. If any fails mid-loop, state and DB are out of sync.

**Fix:** Use `Promise.all` for batch update, rollback state on error.

---

### 5. `deleteBudget` doesn't filter versions by workspace (LOW)
**File:** `CRMContext.tsx` line 746

```typescript
await supabase.from('budget_versions').delete().eq('budget_id', id);
```

Missing `workspace_id` filter. RLS protects against cross-workspace deletion, but the delete could silently fail if RLS blocks it, and no error check on this first delete.

**Fix:** Add `.eq('workspace_id', wsId)` and check error.

---

### 6. `deleteProjectColumn` mutates sort on original array (LOW)
**File:** `CRMContext.tsx` line 1253

```typescript
const firstCol = projectColumns.sort((a, b) => a.order - b.order)[0];
```

`Array.sort()` mutates in place. This silently reorders the state array without triggering a re-render.

**Fix:** Use `[...projectColumns].sort(...)`.

---

### 7. `getClientScoreHistory` filter logic is fragile (LOW)
**File:** `CRMContext.tsx` line 484

```typescript
return scoreHistory.filter(e => e.id.startsWith(`${clientId}_`) || (e as any).clientId === clientId)
```

Score history entries use `gen_random_uuid()` IDs from the DB, so `e.id.startsWith(clientId_)` will never match. The `(e as any).clientId` cast suggests the `clientId` field is missing from the `ScoreHistoryEntry` type. The actual DB column `client_id` is never mapped in `scoreHistoryFromDb`.

**Fix:** Add `clientId` to `scoreHistoryFromDb` mapping and filter by it.

---

### 8. ProspectionContext doesn't set `isLoading=true` on data load (LOW)
**File:** `ProspectionContext.tsx` line 92

The `load` function doesn't call `setIsLoading(true)` before fetching, so on workspace changes the UI may briefly show stale data.

---

## Summary of Changes Required

| # | Severity | Issue | Files |
|---|----------|-------|-------|
| 1 | CRITICAL | Execution functions fire-and-forget DB writes | CRMContext.tsx |
| 2 | HIGH | Score recalculation race condition + silent errors | CRMContext.tsx |
| 3 | HIGH | `ensureWorkspace` stale closure | CRMContext.tsx |
| 4 | MEDIUM | Sequential column reorder, no rollback | CRMContext.tsx |
| 5 | LOW | Missing workspace filter on version delete | CRMContext.tsx |
| 6 | LOW | Mutating sort on state array | CRMContext.tsx |
| 7 | LOW | Broken score history client filter | CRMContext.tsx |
| 8 | LOW | Missing loading state in ProspectionContext | ProspectionContext.tsx |

## Implementation Plan

All fixes are concentrated in **2 files**: `CRMContext.tsx` and `ProspectionContext.tsx`.

1. **Make all execution functions async** and await `persistExecution` — add try/catch with rollback of local state on failure
2. **Debounce score recalculation** with a `useRef` timeout, use `Promise.all`, add proper error handling, fix the `catch {}`
3. **Convert `ensureWorkspace` to use refs** for `session` and `workspaceId` to avoid stale closures
4. **Batch `reorderKanbanColumns`** with `Promise.all` and rollback on error
5. **Add workspace filter and error check** to `deleteBudget` version cleanup
6. **Fix mutating sort** with spread operator
7. **Add `clientId` to `scoreHistoryFromDb`** and fix the filter
8. **Add `setIsLoading(true)`** in ProspectionContext load function

