

# Corrigir Bug de Contagem Dupla nas Despesas Operacionais do PDF

## Problema

No arquivo `pdfGenerator.ts`, o total das despesas operacionais esta sendo calculado **duas vezes**:

1. Linhas 358-359: calcula `operationalTotal` somando todos os itens
2. Linha 407: dentro do loop de renderizacao, soma novamente cada item ao `operationalTotal`

Isso faz com que o valor das despesas operacionais na "Composicao do Investimento" apareca com o **dobro** do valor real.

## Correcao

Remover a linha 407 (`operationalTotal += cost.value;`) dentro do `forEach` de renderizacao, ja que o total ja foi calculado antes do loop.

## Arquivo modificado

- `src/utils/pdfGenerator.ts` - remover a linha duplicada de acumulacao do total

