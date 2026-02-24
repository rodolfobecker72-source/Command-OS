
# Identificador manual na proposta

## O que muda

Atualmente o `proposalId` e gerado automaticamente (sequencial a partir de 800). A mudanca permite que o usuario digite manualmente o identificador ao criar o orcamento. Esse identificador sera usado na nomenclatura como **"ID - Nome do Projeto"** em todo o sistema.

## Alteracoes

### 1. Formulario de novo orcamento (`src/pages/crm/NewBudget.tsx`)
- Adicionar campo de texto "Identificador da Proposta" no formulario, ao lado do nome do projeto
- O campo sera obrigatorio (validacao)
- Placeholder: ex. "850"

### 2. Contexto CRM (`src/contexts/CRMContext.tsx`)
- Remover a funcao `generateNextProposalId()`
- Alterar `addBudget` para receber `proposalId` como parte dos dados do formulario (remover do `Omit`)
- O `proposalId` vira diretamente do input do usuario

### 3. Tipo Budget (`src/types/crm.ts`)
- Atualizar o comentario de `proposalId` de "Auto-generated" para "User-defined identifier"

### 4. Exibicao no Kanban e demais telas
- O padrao de exibicao ja usa `proposalId - projectName` em varios lugares (Kanban cards, PDF, detalhes). Nenhuma alteracao necessaria nesses pontos, pois o campo `proposalId` continuara existindo, apenas sera preenchido manualmente.

### 5. Pagina de detalhes / edicao (`src/pages/crm/BudgetDetail.tsx`)
- Permitir editar o identificador caso o usuario precise corrigir
