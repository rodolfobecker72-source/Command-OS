## Resumo

Adicionar 3 capacidades aos calendários:

1. **Arrastar cards entre dias** no Calendário de Projetos e no Meu Calendário
2. **Redimensionar** o período de execução (arrastar borda esquerda = início, borda direita = fim)
3. **Compromissos com horário** (nova tabela), independentes de orçamento — para reuniões, gravações avulsas, entregas pontuais, etc.

---

## 1. Drag-and-drop nos calendários

### Calendário de Projetos (`/calendario`)

| Tipo de card | Cor | O que acontece ao arrastar |
|---|---|---|
| Execução aprovada | Verde | Move `executionStartDate` e `executionEndDate` mantendo a duração; também ajusta `executionMonth` |
| Pendente (sem aprovar) | Amarelo | Mesmo comportamento acima |
| Entrega de serviço | Azul | Converte o serviço para `deliveryType='data_especifica'` e fixa `deliveryDate` no novo dia |

Além disso, **redimensionar**: ao segurar a borda esquerda/direita do card e arrastar, ajusta só `executionStartDate` ou só `executionEndDate` (sem mexer no outro).

### Meu Calendário (`/meu-calendario`)

- Atividades de projeto → atualiza `dueDate` da `project_activities`
- Ações de prospecção → atualiza `nextActionDate` do lead
- Compromissos (novo) → atualiza `startAt`/`endAt`

### Implementação técnica

- Biblioteca: `@dnd-kit/core` (já usada no projeto, evita conflito)
- Cada célula de dia vira um `useDroppable`
- Cada card vira um `useDraggable`; bordas viram handles próprios para resize
- Confirmação otimista no UI + persistência via contexto (CRMContext / novo hook)

---

## 2. Nova tabela: `appointments` (compromissos)

Compromissos são eventos do calendário **independentes de orçamento**, com data + horário opcional. Podem ser vinculados a um orçamento, cliente ou lead para contexto.

### Colunas

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid | RLS por workspace |
| created_by | uuid | auth.users |
| assigned_to | uuid[] | participantes |
| title | text | "Reunião com X", "Gravação Y" |
| kind | enum | `reuniao` · `gravacao` · `entrega` · `visita` · `outro` |
| description | text | |
| location | text | |
| start_at | timestamptz | obrigatório |
| end_at | timestamptz | opcional |
| all_day | boolean | default false |
| color | text | opcional, para destaque |
| budget_id | uuid? FK | vínculo opcional ao projeto |
| client_id | uuid? FK | vínculo opcional ao cliente |
| lead_id | uuid? FK | vínculo opcional ao lead |
| created_at / updated_at | timestamptz | |

RLS: leitura/escrita restrita ao `workspace_id` do usuário (helper `has_workspace_access` já existe). GRANTs para `authenticated` e `service_role`.

### UI

- **Botão "Novo compromisso"** na toolbar do Calendário de Projetos e do Meu Calendário
- **Dialog** com: título, tipo, data início/fim, hora início/fim (ou "dia inteiro"), local, descrição, vincular a projeto/cliente/lead (opcionais)
- **Card no calendário** com cor por tipo + horário no rótulo (ex: `14:30 · Reunião com Acme`)
- **Drag-and-drop**: arrastar move data mantendo horário; redimensionar ajusta duração
- **Filtro** na toolbar para ligar/desligar compromissos (como já existe para entregas)

---

## 3. Horários em execuções/entregas existentes

Para execuções e entregas que **já vêm de orçamentos**, adicionar campos opcionais:

- `budgets.execution_start_time` / `execution_end_time` (text `HH:MM`)
- Em cada serviço (JSONB do BudgetVersion): `deliveryTime` opcional

Quando preenchidos, aparecem no rótulo do card (ex: `09:00 · 986 - Conteúdo Juice`).

Edição: campos de hora no diálogo de detalhe que já abre ao clicar no card, e no formulário de novo/editar orçamento (seção de execução).

---

## Arquivos afetados (alto nível)

**Backend (migration)**
- nova tabela `appointments` + enum `appointment_kind` + grants + RLS + trigger updated_at
- `ALTER TABLE budgets ADD COLUMN execution_start_time text, execution_end_time text`

**Frontend**
- `src/types/crm.ts` — novo tipo `Appointment`, campos de hora em Budget/ServiceItem
- `src/contexts/CRMContext.tsx` — CRUD de appointments, helper `moveBudgetDates`, `resizeBudget`, `convertServiceToSpecificDate`
- `src/components/operation/CalendarEventCard.tsx` — suporte a drag, resize handles, exibição de hora
- `src/components/operation/CalendarMonthView.tsx` + `CalendarWeekView.tsx` — `DndContext`, droppable nas células, render de appointments
- `src/components/operation/AppointmentDialog.tsx` — **novo**: criar/editar compromisso
- `src/pages/operation/CalendarPage.tsx` — botão "Novo compromisso", filtro, integração
- `src/pages/welcome/MyCalendarPage.tsx` — drag-and-drop + appointments do usuário
- mapper de snake_case ↔ camelCase para appointments

---

## Pontos de atenção

- Mobile: drag-and-drop em touch fica ruim em células pequenas. Sugiro **desabilitar drag no mobile** e manter só edição via diálogo (manter UX já existente).
- Validação: ao arrastar uma execução, se cair em mês diferente, o `executionMonth` é recalculado automaticamente.
- Entregas convertidas para "data específica" perdem o vínculo com a fórmula original (X dias úteis). Mostraremos um toast confirmando a conversão.
- Compromissos não entram na lógica financeira nem de metas — são puramente de agenda.

---

## Ordem de execução

1. Migration (tabela + colunas) — aguarda aprovação
2. Tipos + mapper + contexto
3. AppointmentDialog
4. Drag-and-drop no Calendário de Projetos
5. Drag-and-drop no Meu Calendário
6. Exibição/edição de horários
