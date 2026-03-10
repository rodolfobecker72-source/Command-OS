

# Fix: Infinite Loading Loop from Score Recalculation

## Root Cause

`CRMContext.tsx` line 557:
```typescript
}, [budgets, workspaceId, isLoading, clients]);
//                                    ^^^^^^^ THIS
```

The `useEffect` depends on `clients`, but inside it calls `setClients` (line 545-548). After the 500ms debounce fires and updates client scores, `clients` reference changes, which re-triggers the effect, which recalculates again, creating an infinite loop.

Timeline:
1. Budgets load → effect fires (debounced 500ms)
2. Scores recalculated → `setClients` called with new scores
3. `clients` reference changes → effect fires again
4. After 500ms, scores match → no update → loop stops... temporarily
5. Any state change that causes re-render restarts the cycle

Over time this builds up and the loading state gets stuck in a perpetual cycle.

## Fix (1 file, 1 change)

### `src/contexts/CRMContext.tsx`

**Remove `clients` from the dependency array** and use a `useRef` for clients inside the score calculation instead:

1. Add a `clientsRef` that tracks the current clients value
2. Use `clientsRef.current` inside the effect to read client scores without depending on `clients`
3. Change dependency array to `[budgets, workspaceId, isLoading]` only

This breaks the circular dependency while still reading the latest client data.

