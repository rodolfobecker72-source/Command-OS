

# Plano: Corrigir submit silencioso no formulario de orcamento

## Problema

O `handleSubmit` em `NewBudget.tsx` e uma funcao async sem `try/catch` global. Se qualquer erro ocorrer durante `addBudget` ou `addBudgetVersion`, a excecao vira uma Promise rejection nao tratada e o usuario nao ve nenhum feedback.

Alem disso, o `addBudget` no `CRMContext.tsx` (linha 625) ja tem seu proprio try/catch que retorna `null` em caso de erro, mas tambem mostra um toast de erro proprio. Porem, se a excecao acontecer ANTES de chegar la (ex: erro de tipo, campo undefined), nada e capturado.

## Solucao

### Arquivo: `src/pages/crm/NewBudget.tsx`

1. Envolver todo o corpo do `handleSubmit` (linhas 298-366) em um bloco `try/catch`, com `toast.error` no catch mostrando a mensagem de erro
2. Adicionar `console.log` temporarios para debug caso o problema persista

Mudanca especifica:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const validationErrors = validateForm();
  if (validationErrors) {
    const errorMessages = Object.values(validationErrors);
    toast.error('Preencha os campos obrigatórios', {
      description: errorMessages.join(', '),
    });
    return;
  }

  try {
    // ... todo o codigo existente de addBudget e addBudgetVersion ...
    
    toast.success('Orçamento criado com sucesso!');
    navigate('/crm');
  } catch (error: any) {
    console.error('Erro ao salvar orçamento:', error);
    toast.error('Erro ao salvar orçamento: ' + (error.message || 'Erro desconhecido'));
  }
};
```

Isso garante que QUALQUER erro sera capturado e exibido ao usuario.

