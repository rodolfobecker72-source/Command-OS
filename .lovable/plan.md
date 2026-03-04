

# Plano: Corrigir carregamento inicial do sistema

## Problema
Race condition no `AuthContext.tsx`: quando o usuario faz login ou acessa o sistema, o fluxo de autenticacao dispara duas cargas paralelas de dados do usuario (`onAuthStateChange` + `getSession`), e os contextos `CRMContext` e `ProspectionContext` tentam carregar antes do `workspace` estar disponivel.

O fluxo atual:
1. `onAuthStateChange` dispara → seta session/user → chama `loadUserData` via `setTimeout`
2. `getSession` tambem dispara → chama `loadUserData` novamente
3. Enquanto isso, CRMContext ve `workspaceId = undefined` → seta `isLoading = false` com dados vazios
4. Quando workspace finalmente carrega, o useEffect re-executa, mas a tela ja renderizou vazia

Isso explica por que atualizar a pagina resolve: na segunda vez, a sessao ja esta no localStorage e o workspace carrega mais rapido.

## Solucao

### 1. AuthContext.tsx - Eliminar carga duplicada
- Remover a chamada `loadUserData` de dentro do `onAuthStateChange` 
- Manter apenas a carga no `getSession` inicial
- No `onAuthStateChange`, apenas atualizar session/user e re-carregar dados quando o evento for `SIGNED_IN` ou `TOKEN_REFRESHED` (nao duplicar com getSession)
- Remover o `setTimeout` que causa timing issues

### 2. CRMContext.tsx - Nao finalizar loading prematuramente
- Quando `workspaceId` e `undefined`, manter `isLoading = true` (nao setar false)
- So setar `isLoading = false` apos os dados terem sido efetivamente carregados ou quando confirmado que nao ha sessao

### 3. ProspectionContext.tsx - Mesma correcao
- Mesmo ajuste: nao setar `isLoading = false` quando workspace ainda nao carregou

## Arquivos
- `src/contexts/AuthContext.tsx` - corrigir race condition na carga de dados
- `src/contexts/CRMContext.tsx` - ajustar logica de isLoading
- `src/contexts/ProspectionContext.tsx` - ajustar logica de isLoading

