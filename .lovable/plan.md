

## Diagnóstico: Orçamento não salva ao clicar em "Salvar Orçamento"

### Causa raiz

Os logs do console mostram o erro:

```
AuthApiError: Invalid Refresh Token: Refresh Token Not Found
```

A sessão de autenticação expirou ou o token de refresh foi invalidado. Quando o `handleSubmit` tenta executar `addBudget`, a chamada ao banco falha porque o usuário não está mais autenticado. O `ensureWorkspace` (que verifica a sessão) pode não estar detectando isso corretamente, resultando em uma falha silenciosa.

### Solução imediata

**Faça logout e login novamente no preview.** A sessão atual está com o token expirado, por isso nenhuma operação de escrita funciona.

### Correção no código para evitar falhas silenciosas

**Arquivo: `src/contexts/CRMContext.tsx` (e similar em outros contextos)**

Melhorar o `ensureWorkspace` para detectar tokens expirados e redirecionar automaticamente para o login, em vez de falhar silenciosamente:

1. Dentro de `ensureWorkspace`, verificar se `supabase.auth.getSession()` retorna uma sessão válida
2. Se a sessão for nula ou o token estiver expirado, mostrar um toast informativo ("Sua sessão expirou, faça login novamente") e redirecionar para `/login`
3. Isso impede que o usuário fique clicando em "Salvar" sem entender por que nada acontece

### Resumo
- 1 arquivo modificado: `CRMContext.tsx` — melhorar detecção de sessão expirada no `ensureWorkspace`
- O problema atual se resolve fazendo login novamente

