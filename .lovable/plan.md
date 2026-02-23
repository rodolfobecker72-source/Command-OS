

# Custo Fixo e NF como configuracao geral do projeto

## O que muda

Atualmente, **Custo Fixo (%)** e **Custo NF (%)** sao configurados individualmente em cada servico. O usuario quer que esses percentuais sejam **gerais do projeto** (assim como as despesas operacionais), e somente a **margem** continue sendo por servico.

## Como vai ficar

1. **No formulario de orcamento**: Os campos "Custo Fixo (%)" e "Custo NF (%)" serao movidos para o card de "Dados do Orcamento" (ou um card proprio de configuracoes gerais), removidos de dentro de cada servico
2. **Dentro de cada servico**: Ficara apenas o campo "Margem Desejada (%)" e o resumo de custos (que usara os percentuais gerais)
3. **No calculo**: A funcao `calculateService` passara a receber os percentuais gerais como parametro em vez de usar os do servico
4. **No submit**: Os percentuais gerais serao salvos na versao do orcamento (campos `fixedCostPercentage` e `nfCostPercentage` do `BudgetVersion`), e cada servico mantara apenas `targetMargin`

## Detalhes tecnicos

### Arquivo: `src/pages/crm/NewBudget.tsx`

1. **Adicionar ao `formData`** os campos `fixedCostPercentage: 0` e `nfCostPercentage: 0`
2. **Remover** `fixedCostPercentage` e `nfCostPercentage` do estado inicial de cada servico em `addService` (zerar ou remover)
3. **Mover os inputs** de Custo Fixo e Custo NF para o card de dados gerais do orcamento (ou criar uma secao "Configuracoes de Custo" acima dos servicos)
4. **Atualizar `calculateService`** para receber `fixedCostPercentage` e `nfCostPercentage` como parametros (vindos do `formData`)
5. **Remover** os inputs de Custo Fixo e Custo NF de dentro de cada card de servico (linhas ~1044-1076), mantendo apenas Margem Desejada e Valor Final
6. **Atualizar o resumo** de cada servico para usar os percentuais gerais
7. **Atualizar `handleSubmit`** para salvar os percentuais gerais no `addBudgetVersion` e nos servicos

### Arquivos modificados
- `src/pages/crm/NewBudget.tsx` - mover campos de percentual para nivel do projeto

