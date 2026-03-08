

# Diagnóstico: Botão "Salvar Orçamento" não funciona

## Problema identificado

Após análise do código, há duas causas prováveis:

1. **Botão desabilitado**: O botão "Salvar Orçamento" fica com `disabled={crmLoading}` e mostra "Carregando..." enquanto os dados do CRM carregam. Se houver qualquer atraso ou erro silencioso no carregamento, o botão fica permanentemente desabilitado.

2. **Validação falhando silenciosamente**: A validação exige nome do projeto, cliente selecionado e pelo menos um serviço adicionado. Se faltar algo, aparece um toast que pode passar despercebido.

## Plano de correção

### Arquivo: `src/pages/crm/NewBudget.tsx`

1. **Adicionar console.log no handleSubmit** para confirmar se a função é chamada ao clicar
2. **Melhorar feedback visual** quando a validação falha — destacar os campos com erro (border vermelha) e fazer scroll até o primeiro erro
3. **Remover o `disabled={crmLoading}`** no botão de salvar — em vez disso, fazer o check no `handleSubmit` e mostrar mensagem clara se dados ainda não carregaram
4. **Adicionar console.log** no início do `handleSubmit` para debug: `console.log('handleSubmit chamado', { crmLoading, formData })`

### Detalhes técnicos
- Trocar `disabled={crmLoading}` por lógica dentro do `handleSubmit` que verifica se o workspace está pronto
- Nos campos com erro, adicionar classe `border-destructive` condicionalmente
- Usar `scrollIntoView` no primeiro campo com erro para guiar o usuário

