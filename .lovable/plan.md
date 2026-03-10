

# Orçamento não salva: diagnóstico e correção definitiva

## Causa raiz confirmada

O banco de dados confirma que nenhum orçamento novo foi criado — o insert nunca chega ao servidor. Os logs mostram que `handleSubmit` é chamado **3 vezes simultaneamente** e o `await supabase.from('budgets').insert(...)` **nunca resolve** (não aparece nenhum POST nos requests de rede).

Isso acontece porque o Supabase JS client tenta renovar o token de autenticação antes de enviar qualquer request. Quando o refresh token está inválido (erro que apareceu nos logs anteriores: `AuthApiError: Invalid Refresh Token`), o client fica preso internamente tentando renovar, e a Promise do insert nunca resolve — sem erro, sem timeout, sem feedback.

## Correções (2 arquivos)

### 1. `src/contexts/CRMContext.tsx` — Validar sessão com timeout

Tornar `ensureWorkspace` async novamente, mas desta vez **com timeout** para que nunca fique preso. Verificar a sessão real do Supabase (não apenas o estado em memória) antes de cada mutação:

```typescript
const ensureWorkspace = async (): Promise<boolean> => {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 5000)
    );
    const sessionPromise = supabase.auth.getSession();
    const { data: { session: currentSession } } = await Promise.race([sessionPromise, timeoutPromise]);
    
    if (!currentSession) {
      toast.error('Sua sessão expirou. Faça login novamente.');
      await supabase.auth.signOut();
      window.location.href = '/login';
      return false;
    }
  } catch {
    toast.error('Erro ao verificar sessão. Faça login novamente.');
    await supabase.auth.signOut();
    window.location.href = '/login';
    return false;
  }
  if (!workspaceId) {
    toast.error('Workspace não carregado. Recarregue a página.');
    return false;
  }
  return true;
};
```

Atualizar todas as chamadas de `ensureWorkspace()` para `await ensureWorkspace()`.

### 2. `src/pages/crm/NewBudget.tsx` — Prevenir submissões múltiplas

Adicionar um estado `isSubmitting` para:
- Bloquear cliques múltiplos no botão (o submit está disparando 3x)
- Mostrar feedback visual (loading) enquanto salva
- Adicionar timeout no próprio handleSubmit como fallback

```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (isSubmitting) return;
  setIsSubmitting(true);
  try {
    // ... validação e salvamento existentes
  } catch { ... } finally {
    setIsSubmitting(false);
  }
};

// No botão:
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? 'Salvando...' : 'Salvar Orçamento'}
</Button>
```

### Resumo
- 2 arquivos: `CRMContext.tsx` (validação async com timeout) e `NewBudget.tsx` (proteção contra submit múltiplo + feedback visual)
- A verificação com timeout garante que se o client Supabase travar, o usuário recebe feedback e é redirecionado para login em vez de ficar preso

