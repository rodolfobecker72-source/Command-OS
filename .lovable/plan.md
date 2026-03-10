

# Fix: Loading State Race Condition

## Root Cause

After login, there's a race condition between navigation and data loading:

1. `signInWithPassword` resolves → Login page navigates to `/crm`
2. `onAuthStateChange` fires, starts `loadUserData` but **`isLoading` stays `false`**
3. CRMContext sees `authLoading=false` + `workspaceId=null` → sets own `isLoading=false` with empty data
4. When workspace finally loads, CRM runs `loadAll()` but **doesn't reset `isLoading=true`** — page shows empty state during fetch

## Changes (2 files)

### 1. `src/contexts/AuthContext.tsx` — line 130

Add `setIsLoading(true)` before `loadUserData` in `onAuthStateChange`:

```typescript
if (newSession?.user) {
  setIsLoading(true);  // <-- ADD THIS
  await loadUserData(newSession.user.id);
  setIsLoading(false);
```

### 2. `src/contexts/CRMContext.tsx` — inside `loadAll` (around line 295)

Add `setIsLoading(true)` at the start of `loadAll()`:

```typescript
const loadAll = async () => {
  setIsLoading(true);  // <-- ADD THIS
  try {
    // ... existing code
```

These two one-line additions fix the race condition completely. The CRMContext will show a loading spinner while auth data is being fetched, and again while CRM data is being loaded.

