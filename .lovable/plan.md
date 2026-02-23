

# Ajustar Nova Versao para Formula Global (igual ao cadastro)

## Problema

O dialog de "Nova Versao" em `BudgetDetail.tsx` ainda usa a formula antiga: cada servico tem seu proprio Custo Fixo %, NF % e Margem %. O cadastro (`NewBudget.tsx`) ja foi atualizado para usar a formula global:

```text
Valor Total = (Custo Producao + Custo Fixo + Despesas Operacionais) / (1 - Margem%/100 - NF%/100)
```

## O que muda

### 1. Novos estados para percentuais globais

Adicionar estados no componente `BudgetDetail.tsx`:
- `newVersionFixedCostPct` (default: valor da versao atual ou 20)
- `newVersionNfPct` (default: valor da versao atual ou 13)
- `newVersionTargetMargin` (default: valor da versao atual ou 0)

Inicializar esses valores no `initNewVersionServices()` a partir da versao corrente.

### 2. Remover campos por servico

Nos cards de servico dentro do dialog de nova versao:
- **Remover**: inputs de Custo Fixo %, NF % e Margem % por servico (linhas 959-999)
- **Remover**: "Valor Final" e "Margem" do resumo do servico (linhas 1091-1105)
- **Manter**: apenas Custo de Producao no resumo do servico

### 3. Reformular `newVersionTotals`

Nova logica (identica ao `NewBudget`):
- `productionCost` = soma dos custos de producao de todos os servicos
- `fixedCost` = productionCost * fixedCostPct / 100
- `operationalTotal` = soma das despesas operacionais
- `totalCosts` = productionCost + fixedCost + operationalTotal
- `totalProjectValue` = totalCosts / (1 - margin/100 - nf/100)
- `nfValue` = totalProjectValue * nf / 100
- `marginValue` = totalProjectValue - totalCosts - nfValue

### 4. Secao de Composicao do Investimento

Substituir o card escuro de resumo (linhas 1225-1243) por uma secao completa com:
- Inputs para Custo Fixo %, NF % e Margem Desejada %
- Breakdown: Custo de Producao, Custo Fixo, Despesas Operacionais, Total dos Custos, Margem, NF, Valor Total

### 5. Ajustar `handleCreateNewVersion`

Salvar os valores globais na versao:
- `fixedCostPercentage`: do estado global
- `nfCostPercentage`: do estado global
- `margin`: margem global
- `fullPrice`: valor total do projeto calculado
- `productionCost` e `totalCost` com os valores corretos

## Detalhes tecnicos

### Arquivo: `src/pages/crm/BudgetDetail.tsx`

1. Adicionar 3 novos `useState` para os percentuais globais da nova versao
2. Atualizar `initNewVersionServices` para inicializar os percentuais da versao atual
3. Remover grid de percentuais (Custo Fixo / NF / Margem) dos cards de servico
4. Simplificar resumo do servico para mostrar apenas Custo de Producao
5. Reformular `newVersionTotals` com a formula global
6. Substituir card escuro de totais por composicao detalhada com inputs
7. Atualizar `handleCreateNewVersion` para usar valores globais

