

# Plano: Diagnosticar e corrigir cadastro de cliente

## Investigacao

O fluxo `handleSubmit` em `NewClient.tsx` depende de:
1. Validacao do formulario (campos obrigatorios)
2. `addClient()` do CRMContext, que depende de `workspaceId`

Possiveis causas silenciosas:
- `workspaceId` estar `null` no momento do clique (addClient retorna `null`, mas o toast "Erro ao salvar" deveria aparecer)
- Validacao falhando sem o usuario perceber o toast
- Algum erro de JS impedindo o submit

## Solucao

### Arquivo: `src/pages/clients/NewClient.tsx`

Adicionar logs de debug no `handleSubmit` para rastrear exatamente onde para:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log('[NewClient] handleSubmit disparado');
  console.log('[NewClient] formData:', formData);

  if (!validateForm()) {
    console.log('[NewClient] validação falhou:', errors);
    toast.error('Preencha todos os campos obrigatórios');
    return;
  }

  console.log('[NewClient] validação OK, chamando addClient...');
  
  try {
    const result = await addClient({...});
    console.log('[NewClient] resultado addClient:', result);
    
    if (result) {
      toast.success('Cliente cadastrado com sucesso!');
      navigate('/clientes');
    } else {
      console.error('[NewClient] addClient retornou null');
      toast.error('Erro ao salvar cliente. Tente novamente.');
    }
  } catch (e: any) {
    console.error('[NewClient] erro:', e);
    toast.error('Erro inesperado: ' + e.message);
  }
};
```

Isso vai revelar exatamente onde o fluxo esta parando (validacao, workspaceId null, erro de DB, etc).

