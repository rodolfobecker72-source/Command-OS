

## Fix: ErrorBoundary not resetting on navigation

### Root cause

The `ErrorBoundary` class component catches an error and sets `hasError: true`. When the user clicks a different page in the sidebar, React Router updates the URL, but the `ErrorBoundary` never resets `hasError` back to `false` — so it keeps showing the error fallback (or blank content) instead of rendering the new page.

### Solution

Give the `ErrorBoundary` a `key` prop based on the current route (`location.pathname`). When the route changes, React unmounts and remounts the `ErrorBoundary`, automatically clearing the error state.

### Changes

**`src/components/layout/AppLayout.tsx`**
- Import `useLocation` from `react-router-dom`
- Pass `key={location.pathname}` to `<ErrorBoundary>`

```tsx
const location = useLocation();
// ...
<ErrorBoundary key={location.pathname}>
  <Outlet context={{ onOpenMobileMenu: () => setMobileOpen(true) }} />
</ErrorBoundary>
```

One file, one small change.

