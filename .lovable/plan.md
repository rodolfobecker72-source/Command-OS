

# Reformular Composicao do Orcamento

## Nova Formula

A composicao do orcamento passa a seguir esta logica:

```text
Custo de Producao          = soma dos custos de todos os servicos
Custo Fixo da Produtora    = X% sobre o Custo de Producao
Despesas Operacionais      = soma das despesas operacionais
---------------------------------------------------------
Total dos Custos           = Custo de Producao + Custo Fixo + Despesas Operacionais

Margem Desejada (%)        = definida pelo usuario (agora geral do projeto)
Valor da Margem            = Total dos Custos * (Margem / (100 - Margem - NF))
                             (derivado da formula abaixo)

Valor Total do Projeto     = (Total dos Custos) / (1 - Margem/100 - NF/100)

Onde NF% incide sobre o Valor Total do Projeto:
NF = Valor Total * NF%
```

A formula fechada fica:
**Valor Total = Total dos Custos / (1 - Margem%/100 - NF%/100)**

Assim, o valor total ja inclui a margem e o NF calculado sobre si mesmo.

## O que muda na interface

### Dentro de cada servico
- **Remove**: Margem Desejada e Valor Final (que estavam por servico)
- **Mantem**: Apenas os custos de producao do servico e o resumo (Custo de Producao do servico, Custo Fixo proporcional, Total)

### Secao de totais (card escuro no final)
- **Custo de Producao total** (soma de todos os servicos)
- **Custo Fixo** (X% do custo de producao)
- **Despesas Operacionais** (soma)
- **Total dos Custos**
- **Margem Desejada** (input % - agora unico, geral)
- **NF** (X% sobre o valor total)
- **Valor Total do Projeto**

### Campo de NF% no formulario
- O input de NF% continua na secao de configuracoes gerais do orcamento (junto com Custo Fixo%)

## Detalhes tecnicos

### Arquivo: `src/pages/crm/NewBudget.tsx`

1. **Mover `targetMargin` para `formData`**: Adicionar `targetMargin: 0` ao estado `formData` (remover do `ServiceItem`)

2. **Reformular `calculateService`**: Retornar apenas `productionCost` e `fixedCost` por servico (sem NF e sem margem por servico)

3. **Reformular `totals` (useMemo)**: Nova logica:
   - `productionCost` = soma dos custos de producao de todos os servicos
   - `fixedCost` = productionCost * fixedCostPercentage / 100
   - `operationalCosts` = soma das despesas operacionais
   - `totalCosts` = productionCost + fixedCost + operationalCosts
   - `totalProjectValue` = totalCosts / (1 - targetMargin/100 - nfCostPercentage/100)
   - `nfValue` = totalProjectValue * nfCostPercentage / 100
   - `marginValue` = totalProjectValue - totalCosts - nfValue

4. **UI dos cards de servico**: Remover bloco "Margin and Final Value" (linhas 1117-1147). Remover "Custo NF" do resumo do servico. Manter apenas: Custo de Producao, Custo Fixo, Total.

5. **UI do Grand Total**: Reformular o card escuro final para mostrar a composicao completa com input de Margem Desejada e os valores calculados.

6. **handleSubmit**: Salvar `targetMargin` no nivel da versao do orcamento (campo `margin` do `BudgetVersion`), nao mais por servico.

### Arquivo: `src/utils/pdfGenerator.ts`
- Ajustar a composicao do investimento no PDF para refletir a nova formula (Custo de Producao + Custo Fixo + Despesas + Margem + NF = Total).

