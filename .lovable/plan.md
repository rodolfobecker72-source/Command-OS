

## Add Score page to sidebar navigation

Add a new menu item "Score" to the "Configurações" group in the sidebar, pointing to `/configuracoes/score`.

### Changes

**`src/components/layout/Sidebar.tsx`**
- Add a new item to the `Configurações` group in `navGroups`:
  ```
  { name: 'Score', href: '/configuracoes/score', icon: TrendingUp, pageKey: 'score' }
  ```
  (Use a distinct icon — e.g. `Award` from lucide-react — to differentiate from Dashboard's `TrendingUp`.)

