
# Ajustes: Rota Inicial e Numeracao Sequencial de Propostas

## 1. Rota inicial: CRM

Atualmente o sistema redireciona `/` para `/clientes`. Sera alterado para redirecionar para `/crm`, fazendo o CRM ser a pagina inicial apos o login.

## 2. Numeracao sequencial persistente (comecando em 800)

Atualmente o contador `projectIdCounter` em `src/types/crm.ts` e uma variavel em memoria que reseta para 800 a cada reload da pagina, gerando IDs duplicados.

A correcao sera:
- Ao gerar um novo `proposalId`, verificar todos os orcamentos existentes no localStorage para encontrar o maior numero ja utilizado
- O proximo numero sera `max + 1`, com minimo de 800
- Isso garante que nunca havera repeticao, mesmo apos reload

## Detalhes tecnicos

### Arquivo: `src/App.tsx`
- Alterar linha 46: `Navigate to="/clientes"` para `Navigate to="/crm"`

### Arquivo: `src/types/crm.ts`
- Remover a variavel `projectIdCounter` e a funcao `generateProposalId` (a logica vai para o contexto que tem acesso aos budgets)

### Arquivo: `src/contexts/CRMContext.tsx`
- Criar funcao local `generateNextProposalId` que:
  1. Le todos os budgets existentes
  2. Extrai o maior `proposalId` numerico
  3. Retorna `max(maiorId + 1, 800)` formatado com `padStart(3, '0')`
- Usar essa funcao no `addBudget` em vez da importada
