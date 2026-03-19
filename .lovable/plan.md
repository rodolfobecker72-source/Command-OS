

## Diagnóstico: Páginas em branco ao navegar pelo menu

### Causa raiz identificada

O projeto **não possui Error Boundary**. Quando qualquer componente de página lança um erro de renderização (ex: dados undefined, propriedade de null, etc.), o React desmonta toda a árvore de componentes e a tela fica branca. Ao recarregar, os dados são carregados novamente do zero e funciona.

Além disso, há um risco no `PageGuard`: se durante uma re-renderização o `membership` do AuthContext for momentaneamente `null` (ex: durante refresh de token), `hasPageAccess()` retorna `false` e o usuário é redirecionado para `/` (MaintenancePage), que aparece como "tela branca" para quem não espera.

### Plano de correção

**1. Criar um componente ErrorBoundary** (`src/components/ErrorBoundary.tsx`)
- Captura erros de renderização nos componentes filhos
- Exibe uma mensagem amigável com botão "Recarregar" em vez de tela branca
- Loga o erro no console para debugging

**2. Envolver as rotas protegidas com o ErrorBoundary** (`src/App.tsx`)
- Colocar o ErrorBoundary dentro do `AppLayout`, envolvendo o `Outlet`
- Assim, erros em páginas individuais não derrubam toda a aplicação

**3. Corrigir o PageGuard para não redirecionar durante carregamento** (`src/components/auth/PageGuard.tsx`)
- Adicionar verificação de `isLoading` do AuthContext
- Se ainda estiver carregando, mostrar loading em vez de redirecionar para `/`
- Isso evita redirecionamentos falsos durante refresh de token

### Arquivos modificados

| Arquivo | Alteração |
|---|---|
| `src/components/ErrorBoundary.tsx` | Novo componente ErrorBoundary com UI de fallback |
| `src/components/layout/AppLayout.tsx` | Envolver `Outlet` com ErrorBoundary |
| `src/components/auth/PageGuard.tsx` | Verificar `isLoading` antes de redirecionar |

