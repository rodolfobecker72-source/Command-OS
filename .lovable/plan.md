

# Diagnosis: Infinite Loading on Navigation — Root Cause

## Why Previous Fixes Did Not Work

The previous fixes addressed `TOKEN_REFRESHED` and `authLoading` dependency loops. But the actual root cause is different.

## Root Cause: Duplicate `SIGNED_IN` Events

**File:** `src/contexts/AuthContext.tsx` lines 118-160

Supabase JS v2 fires `SIGNED_IN` via `onAuthStateChange` **after** `getSession()` returns. The current code:

```text
1. getSession() resolves → initialLoad = false → loads user data → isLoading = false ✓
2. onAuthStateChange fires SIGNED_IN (delayed, after getSession)
3. initialLoad is already false → enters SIGNED_IN branch
4. Sets isLoading = TRUE → ProtectedRoute shows spinner → ALL pages unmount
5. Calls loadUserData again → sets isLoading = false → pages remount
```

This is the first load. Now when the user navigates:
- Supabase can fire `SIGNED_IN` again (tab focus, session restore, visibility change)
- Each time → `isLoading = true` → full spinner → unmount → remount
- If it happens during a CRM data load, both spinners stack

## Secondary Cause: CRM `authLoading` Stale Read

**File:** `src/contexts/CRMContext.tsx` line 302

```typescript
if (!workspaceId) {
  if (!authLoading) setIsLoading(false);  // authLoading is stale — NOT in deps array
  return;
}
```

`authLoading` is read but NOT in the dependency array `[workspaceId]`. So this closure captures whatever `authLoading` was when the effect last ran. If it was `true`, CRM stays in `isLoading=true` forever.

## Tertiary Cause: UsersPage Reloads on Workspace Reference Change

**File:** `src/pages/users/UsersPage.tsx` line 124

```typescript
useEffect(() => { loadMembers(); }, [workspace]);
```

The `workspace` object reference changes every time AuthContext re-renders (it's not memoized). So any auth event → new workspace reference → UsersPage reloads members.

## Files Involved

| File | Issue |
|------|-------|
| `AuthContext.tsx` | Duplicate SIGNED_IN handling sets isLoading=true again |
| `CRMContext.tsx` | Stale `authLoading` closure in guard; `isLoading` init as `true` |
| `ProspectionContext.tsx` | `isLoading` init as `true` before workspace is known |
| `ProtectedRoute.tsx` | Shows spinner on ANY auth isLoading=true, no timeout/safeguard |
| `UsersPage.tsx` | Reloads on workspace reference change |

## Fix Plan (5 files)

### 1. `AuthContext.tsx` — Prevent duplicate SIGNED_IN processing
- Add a `hasLoadedRef` that tracks whether user data was already loaded
- On `SIGNED_IN`: if data already loaded (profile + workspace exist), skip reload entirely — just update session/user
- Never set `isLoading(true)` if already loaded
- This eliminates the cascade that unmounts all pages

### 2. `CRMContext.tsx` — Fix stale closure + init state
- Change `isLoading` initial state from `true` to `false` (no data to show = empty, not loading)
- Use `authLoadingRef` to read current `authLoading` without adding it to deps
- Add a `loadedRef` to prevent re-running `loadAll` if workspace hasn't changed
- Add 15s safety timeout on `loadAll` to guarantee `isLoading=false`

### 3. `ProspectionContext.tsx` — Same init fix
- Change `isLoading` initial state from `true` to `false`

### 4. `ProtectedRoute.tsx` — Add safety timeout
- Add a 10-second timeout: if `isLoading` is true for >10s, force render children instead of spinner
- Log warning when timeout triggers

### 5. `UsersPage.tsx` — Stabilize dependency
- Change `useEffect` dependency from `workspace` (object) to `workspace?.id` (stable string)

