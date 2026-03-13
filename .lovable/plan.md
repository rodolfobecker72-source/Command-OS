

# Reorganização do Resumo Financeiro por Aba

## Mudanças

### 1. Valores Reais — mover para ANTES de "Gestão do Projeto" (não mais dentro de "Finalizado")
- Remover o bloco "Valores Reais" de dentro do `isFinalized` (linhas 1927-1980)
- Inserir um novo bloco **antes** de "Gestão do Projeto" (antes da linha 1834), visível sempre na aba execução
- Background verde sutil (`bg-green-50 dark:bg-green-950/20 border-green-200`)
- Ordem dos campos: **Imposto NF Real** (editável) → **Custo Real** (calculado) → **Margem Real**

### 2. Sidebar "Resumo Financeiro" — dinâmico por aba
- O card lateral (linhas 2112-2164) deve mudar conforme `activeTab`:
  - **Aba "budget"**: mostrar dados da última versão ou versão aprovada (Valor Final, Custo Total, Margem) — comportamento atual
  - **Aba "execution"**: mostrar dados reais (Custo Real, Imposto NF Real, Margem Real)

### Arquivo a modificar
- `src/pages/crm/BudgetDetail.tsx`
  - Mover bloco "Valores Reais" para antes de "Gestão do Projeto" com bg verde
  - Reordenar campos: Imposto NF Real → Custo Real → Margem Real
  - Sidebar: condicionar conteúdo do card "Resumo Financeiro" ao `activeTab`

