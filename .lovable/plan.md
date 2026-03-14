

## Plano: Remover NF do cálculo de subtotal por serviço

### Problema
A função `calculateServiceTotals` inclui o imposto NF no `finalValue` (subtotal) de cada serviço. O subtotal deveria ser apenas **Custo de Produção / (1 - Margem%)**, sem NF. O NF já aparece corretamente na "Composição do Investimento".

### Alterações

**1. `src/types/crm.ts` — função `calculateServiceTotals`**
- Remover `nfCost` do cálculo de `totalCost` e `finalValue`
- Novo cálculo: `finalValue = productionCost / (1 - margin/100)`

**2. `src/pages/crm/BudgetDetail.tsx` — Composição do Investimento (~linha 880)**
- O `nfValue` já é calculado com base em `currentVersionData.fullPrice`, então permanece correto
- Os subtotais por serviço passarão a ser menores (sem NF), mas o investimento total continua o mesmo pois usa `currentVersionData.fullPrice`

**3. Verificar `src/pages/crm/NewBudget.tsx` e `src/contexts/CRMContext.tsx`**
- Garantir que o cálculo global do projeto (fullPrice) continue usando NF no nível do projeto, não por serviço

### Resultado
- Subtotal de cada serviço = Custo de Produção + Margem (sem NF)
- NF aparece apenas na Composição do Investimento como item separado

