

# Diagnosis: Infinite Loading on Navigation

## Root Cause

The `onAuthStateChange` listener in `AuthContext.tsx` (line 122) fires on **every** auth event, including `TOKEN_REFRESHED` which happens automatically every ~60 minutes (or more frequently under certain conditions). Each time it fires:

1. **AuthContext** sets `isLoading = true` (line 131)
2. **CRMContext** has `authLoading` in its `useEffect` dependency array (line 418) → re-runs `loadAll()` → sets its own `isLoading = true` → fires 12 parallel DB queries
3. **ProspectionContext** same pattern (line 104) → re-runs its own load
4. **ProtectedRoute** sees `authLoading = true` → renders spinner instead of `<Outlet />`
5. When `loadAll` finishes, `isLoading` resets — but the page has already unmounted and remounted, potentially triggering the cycle again

The `authLoading` dependency in both CRM and Prospection contexts means **any toggle of auth loading state causes a full data reload**, even when the workspace hasn't changed.

## Secondary Issue

When navigating between pages, the `ProtectedRoute` component checks `isLoading` from AuthContext. If a token refresh happens mid-navigation, the route shows a spinner and unmounts the current page. When loading finishes, the page remounts and triggers its own data loading effects.

## Fix Plan (3 files)

### 1. `src/contexts/AuthContext.tsx`
- Only set `isLoading = true` for `SIGNED_IN` and `SIGNED_OUT` events, NOT for `TOKEN_REFRESHED` or `USER_UPDATED`
- This prevents token refreshes from cascading into full app reloads

### 2. `src/contexts/CRMContext.tsx`
- Remove `authLoading` from the `loadAll` useEffect dependency array
- The effect already depends on `workspaceId` which is `undefined` until auth loads — so `authLoading` is redundant and harmful
- Keep the `if (!workspaceId) { if (!authLoading) setIsLoading(false); }` guard but read `authLoading` from a ref instead

### 3. `src/contexts/ProspectionContext.tsx`
- Same fix: remove `authLoading` from the useEffect dependency array
- Use ref for the early-exit guard

This eliminates the cascade where token refreshes trigger full data reloads across the entire app.

