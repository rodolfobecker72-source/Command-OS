

# Resumo Financeiro Diferenciado por Área

## O que mudar

O resumo financeiro no topo da aba "Execução" precisa ser reorganizado:

### 1. Seção "Valores Orçados" (amarela) — manter sempre visível
- Já está correto: mostra Investimento Total, Custo Total Orçado, Margem Projetada com base na versão aprovada
- Sem alterações necessárias

### 2. Seção "Valores Reais" — mostrar apenas quando o projeto estiver finalizado
- Remover o bloco "Valores Reais" (linhas 1462-1515) da posição atual (topo da execução)
- Mover para **depois** da seção "Finalizar Execução", exibindo **somente quando `budget.execution.isFinalized === true`**
- Quando finalizado, exibir o resumo completo: Custo Real, Imposto NF Real (editável), Margem Real
- Enquanto não finalizado, o usuário preenche os valores reais nas planilhas de cada serviço normalmente, mas o resumo consolidado só aparece no final

### Arquivo a modificar
- `src/pages/crm/BudgetDetail.tsx`
  - Remover bloco "Valores Reais" das linhas 1462-1515
  - Adicionar esse mesmo bloco dentro da seção de finalização (após linha 1964), visível apenas quando `isFinalized === true`

