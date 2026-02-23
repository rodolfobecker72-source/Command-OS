

# Ajustar PDF: Unificar Custos por Servico

## O que muda

Na secao "COMPOSICAO DO INVESTIMENTO" do PDF, em vez de mostrar linhas separadas para Custo de Producao, Custo Fixo e Margem, o documento vai:

1. **Mostrar cada servico individualmente** com seu valor ja incluindo custo fixo e margem distribuidos proporcionalmente
2. **Tudo apresentado como "Custo de Producao"** - sem expor custo fixo e margem separadamente ao cliente

### Exemplo visual no PDF

```text
COMPOSICAO DO INVESTIMENTO

1. Captacao de Video                    R$ 12.500,00
2. Edicao e Pos-producao               R$  8.300,00
3. Motion Graphics                     R$  4.200,00
Despesas Operacionais                   R$  2.000,00
Nota Fiscal (13%)                       R$  3.510,00
-------------------------------------------------
INVESTIMENTO TOTAL                      R$ 30.510,00
```

Cada servico recebe proporcionalmente o custo fixo e a margem com base no seu peso no custo de producao total. Assim o cliente ve apenas o valor final de cada servico sem saber a composicao interna.

### Calculo proporcional

Para cada servico:
- `peso = custoProdServico / custoProdTotal`
- `valorServico = (custoProdServico + custoFixo * peso + margem * peso)`

Ou seja: `valorServico = custoProdServico / custoProdTotal * (custoProdTotal + custoFixo + margem)`

## Detalhes tecnicos

### Arquivo: `src/utils/pdfGenerator.ts`

Na secao "COMPOSICAO DO INVESTIMENTO" (linhas 434-500):

1. Calcular o valor proporcional de cada servico (producao + fixo + margem distribuidos)
2. Listar cada servico com nome e valor final
3. Listar Despesas Operacionais (se houver)
4. Listar NF
5. Mostrar total

Remover as linhas que exibiam separadamente: Custo de Producao, Custo Fixo, Total dos Custos, e Margem.

