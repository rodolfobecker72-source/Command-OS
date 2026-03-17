

## Correção do redirecionamento pós-login

### Problema

No `Login.tsx` linha 28, após login bem-sucedido o `navigate` aponta para `/clientes`. Deveria apontar para `/crm/dashboard`.

### Alteração

**Arquivo:** `src/pages/auth/Login.tsx` — linha 28

Trocar:
```ts
navigate('/clientes');
```
Por:
```ts
navigate('/crm/dashboard');
```

Apenas essa linha. Nenhuma outra alteração necessária.

