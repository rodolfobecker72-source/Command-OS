

## Calendário de Operação

### O que será feito

1. **Nova aba "Operação" no menu lateral** com item "Calendário"
2. **Página de calendário** estilo Google Agenda com visualização mensal e semanal
3. **Dados automáticos**: orçamentos com `hasExecutionDate=true` e datas definidas (`executionStartDate`/`executionEndDate`) aparecem no calendário
4. **Identificação visual**: cada evento mostra `proposalId - projectName` com cor baseada no status do orçamento (kanban column color)
5. **Somente visualização** (sem drag-and-drop ou edição)
6. **Mobile-first**: responsivo, com toggle mês/semana e navegação por setas

### Alterações

| Arquivo | Alteração |
|---|---|
| `src/config/pages.ts` | Adicionar `calendario` na lista de páginas, grupo "Operação" |
| `src/components/layout/Sidebar.tsx` | Adicionar grupo "Operação" com ícone `CalendarDays` e item "Calendário" |
| `src/pages/operation/CalendarPage.tsx` | **Novo** - Página principal do calendário |
| `src/components/operation/CalendarMonthView.tsx` | **Novo** - Visualização mensal (grid 7 colunas, dias do mês, eventos posicionados) |
| `src/components/operation/CalendarWeekView.tsx` | **Novo** - Visualização semanal (7 colunas, horários ou all-day events) |
| `src/components/operation/CalendarEventCard.tsx` | **Novo** - Card de evento com proposalId, nome do projeto, cliente, badge de status |
| `src/App.tsx` | Adicionar rota `/calendario` com PageGuard |

### Design do calendário

- **Header**: toggle Mês/Semana, setas para navegar, label do mês/semana atual
- **Visão Mensal**: grid com dias, eventos como barras coloridas que podem se estender por vários dias (período)
- **Visão Semanal**: grid de 7 dias com eventos all-day no topo
- **Eventos**: derivados dos budgets do CRMContext que possuem `hasExecutionDate=true` e `executionStartDate` definido
- **Ao clicar no evento**: Dialog com detalhes (cliente, valor, tipo de serviço, período) e link para o orçamento
- **Cores**: baseadas no status do kanban (aprovada=verde, enviada=azul, etc.)

### Dados

Sem alterações no banco de dados. Os dados já existem na tabela `budgets` (`has_execution_date`, `execution_start_date`, `execution_end_date`). O componente consome diretamente do `CRMContext`.

### Seção técnica

- Calendário construído com componentes nativos (sem lib externa pesada) usando CSS Grid
- Mês: `grid-cols-7` com overflow scroll vertical no mobile
- Semana: `grid-cols-7` com scroll horizontal no mobile se necessário
- Eventos multi-dia renderizados com `gridColumn: span N` na visão mensal
- Toggle mês/semana usa `Tabs` component existente
- Navegação usa `useState` para `currentDate` com botões prev/next

