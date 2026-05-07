## Plano

### 1) Renomear "Fornecedor" → "Equipe" na execução
Em `src/pages/crm/BudgetDetail.tsx`:
- Trocar todos os 4 cabeçalhos `Fornecedor` por `Equipe` (linhas 2523, 2606, 2759 e o painel de adicionar gasto extra ~3283).
- Trocar placeholders `"Quem executou"` por `"Selecione quem executou"`.

### 2) Substituir Input de texto por um seletor de Equipe + opção Freela
Criar um novo componente `src/components/crm/TeamMemberSelect.tsx`:
- Carrega membros do workspace via `workspace_members` + `profiles` (mesmo padrão usado em `UsersPage.tsx`).
- Renderiza um `Select` com:
  - Lista de usuários cadastrados (nome).
  - Item especial **"Freela"** que, ao selecionar, abre um pequeno `Input` inline ao lado para digitar o nome do freela.
- Valor armazenado no campo `cost.supplier` (string) seguindo um formato simples:
  - Membro: `"Nome do membro"` (mesma string do nome) — assim o financeiro continua funcionando.
  - Freela: `"Freela: Nome digitado"`.
- Substituir os 4 `<Input>` de fornecedor (custos principais, gastos extras, custos operacionais e o dialog de adicionar custo extra ~linha 3287) por esse novo componente.

### 3) Área "Meu Financeiro" para usuários (não-owner)
Header (`src/components/layout/Header.tsx`):
- No `DropdownMenu` do avatar, adicionar item **"Meu Financeiro"** (ícone `Wallet`) visível quando `role !== 'owner'`. Navega para `/meu-financeiro`.

Nova página `src/pages/MyFinancePage.tsx`:
- Cabeçalho padrão (Header) + layout responsivo.
- Carrega todos os `budgets` aprovados do workspace, percorre `execution.services[].costs`, `execution.extraCosts` e `operationalCosts/extraOperationalCosts`, filtrando entradas onde `cost.supplier === profile.name` (ou começando com este nome).
- Agrupa por **mês** (a partir de `executionMonth` do orçamento) e lista:
  - Mês | Projeto (proposalId + cliente) | Descrição do serviço | Valor (real) | Status (`paymentStatus` com badge) | Data de pagamento.
- Totais no topo: Total Recebido, Total Pendente, Total no Mês corrente.
- Sem alteração de banco — somente leitura.

Registrar rota em `src/App.tsx` e em `src/config/pages.ts` (entrada apenas para `PageGuard`; sem item na sidebar — acesso é exclusivo via menu do avatar).

### Detalhes técnicos
- Reutilizar mesmo padrão de query do `UsersPage` para listar membros.
- Manter `cost.supplier` como string (sem migração).
- Owner também verá o item, mas costuma já enxergar tudo no Financeiro — pode ser ocultado se desejado.

### Arquivos afetados
- `src/pages/crm/BudgetDetail.tsx`
- `src/components/crm/TeamMemberSelect.tsx` (novo)
- `src/components/layout/Header.tsx`
- `src/pages/MyFinancePage.tsx` (novo)
- `src/App.tsx`
- `src/config/pages.ts`
