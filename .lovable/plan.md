
# Despesas Operacionais no Orcamento

## O que sera feito

Adicionar uma secao de **Despesas Operacionais** ao orcamento, separada dos servicos. Sao custos gerais do projeto como logistica, hospedagem, alimentacao, deslocamento, etc. Esses custos aparecerao em tres momentos:

1. **Criacao/edicao do orcamento** - secao dedicada abaixo dos servicos
2. **Exportacao PDF** - secao propria no documento
3. **Execucao do projeto** - acompanhamento de custos reais vs orcados

## Como vai funcionar

- Na tela de novo orcamento, apos os servicos, havera um card "Despesas Operacionais" com tabela de custos (mesma estrutura dos custos de servico: descricao, quantidade, valor unitario, total)
- As despesas operacionais nao terao margem, custo fixo % ou NF % aplicados - sao custos diretos
- No calculo do total do orcamento, as despesas operacionais serao somadas ao valor final
- No PDF, aparecera uma secao "Despesas Operacionais" entre os servicos e o investimento total
- Na execucao, havera uma secao separada para acompanhar os custos reais das despesas operacionais

## Detalhes tecnicos

### 1. Tipo `BudgetVersion` (src/types/crm.ts)
- Adicionar campo `operationalCosts: CostItem[]` ao `BudgetVersion`
- Adicionar campo `operationalCosts: ExecutionCostItem[]` e `extraOperationalCosts: ExecutionCostItem[]` ao `ProjectExecution`

### 2. NewBudget.tsx
- Adicionar estado `operationalCosts: CostItem[]`
- Adicionar card "Despesas Operacionais" com tabela de custos editavel (mesmo padrao dos custos de servico)
- Incluir despesas operacionais no calculo do total geral (somadas apos os servicos)
- Salvar no `addBudgetVersion` com o campo `operationalCosts`

### 3. BudgetDetail.tsx
- Exibir card "Despesas Operacionais" na aba de orcamento (entre servicos e historico de versoes)
- Na criacao de nova versao, incluir secao de despesas operacionais
- Na aba de execucao, exibir secao de despesas operacionais com custos reais vs orcados
- Suportar gastos extras nas despesas operacionais

### 4. pdfGenerator.ts
- Adicionar secao "DESPESAS OPERACIONAIS" no PDF, listando os itens e o subtotal
- Somar ao investimento total

### 5. CRMContext.tsx
- Atualizar `approveBudget` para incluir despesas operacionais na planilha de execucao
- Atualizar funcoes de custo de execucao para suportar custos operacionais

### Arquivos modificados
- `src/types/crm.ts` - novos campos nos tipos
- `src/pages/crm/NewBudget.tsx` - secao de despesas operacionais no formulario
- `src/pages/crm/BudgetDetail.tsx` - exibicao e execucao das despesas operacionais
- `src/utils/pdfGenerator.ts` - secao no PDF
- `src/contexts/CRMContext.tsx` - logica de aprovacao e execucao
