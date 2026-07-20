## Objetivo
No **Calendário do Time**, permitir selecionar múltiplos responsáveis (com opção "Todos"), atribuir uma cor única a cada pessoa e exibir uma legenda no rodapé. A mesma cor por pessoa também deve ser usada no **Meu Calendário** (individual). Eventos de entrega mantêm o ícone de entrega além da cor da pessoa.

## Mudanças

### 1. Paleta compartilhada de cores por pessoa
Novo utilitário `src/utils/memberColors.ts`:
- Paleta fixa de ~14 cores (tons distintos: violeta, âmbar, esmeralda, rosa, ciano, laranja, índigo, teal, rose, lime, sky, fuchsia, amber-dark, slate) — todas com bom contraste em light/dark.
- Função `getMemberColor(userId: string)` → retorna `{ bg, border, text, dot, hex }` de forma determinística (hash do userId → índice na paleta), garantindo mesma cor em qualquer tela.

### 2. `TeamCalendarPage.tsx` — seleção múltipla
- Trocar `memberId: string` por `selectedMemberIds: Set<string>`.
- Substituir o `<Select>` atual por um **Popover + Command** (multi-check) com:
  - Checkbox "Selecionar todos" no topo (marca/desmarca todos).
  - Lista de membros com checkbox.
  - Trigger mostrando "N selecionados" ou nomes truncados.
- Refatorar o `useEffect` de carregamento para iterar sobre cada `userId` selecionado (queries `contains` e `.eq` para o campo legado) e consolidar `bids` e `memberActivityEvents`, guardando em cada evento o `assignedUserId` (a pessoa a quem o evento pertence — quando a atividade tem múltiplos responsáveis, gerar um evento por responsável selecionado para colorir corretamente).
- Passar `memberColorMap` para as views (Month/Week/Day) e para o `CalendarEventCard`.

### 3. Cor por pessoa no `CalendarEventCard.tsx`
- Nova prop opcional `memberColor?: { bg; border; text; dot }`.
- Quando presente, sobrescreve `statusStyle` e `dotColor` (mantendo o layout).
- Para eventos de **entrega** (`isDelivery` ou `eventType === 'delivery'`): manter o **ícone de pacote** (`Package`) visível ao lado do título, junto da cor da pessoa — hoje a "entrega" é sinalizada apenas pelo fundo azul; passará a ser sinalizada pelo ícone.

### 4. Legenda no rodapé (Team Calendar)
- Novo componente `MemberLegend` renderizado abaixo da área do calendário:
  - Uma "pill" por pessoa selecionada: bolinha na cor + nome.
  - Item extra explicativo: ícone `Package` + "Entrega".
- Sticky/border-top, esconde quando nenhum membro está selecionado.

### 5. `MyCalendarPage.tsx` — usar a mesma cor do usuário logado
- Ao renderizar eventos (`project`, `activity`), aplicar `getMemberColor(user.id)` via a nova prop do `CalendarEventCard` / bloco de evento equivalente.
- Eventos de entrega recebem o ícone `Package` junto ao título (mesma regra da Team).
- Compromissos, notas, e leads continuam com sua cor atual (não estão vinculados a "pessoa" no sentido do time).

### 6. Views auxiliares (`CalendarMonthView`, `CalendarWeekView`, `CalendarDayView`)
- Repassar `memberColorMap` para o `CalendarEventCard`.
- Nenhuma mudança de layout além disso.

## Detalhes técnicos
- Nenhuma migração de banco — cor é derivada do `user.id` no cliente.
- Persistência da seleção múltipla em `sessionStorage` (chave por workspace) para não perder ao trocar de aba.
- Tokens semânticos: preferir classes Tailwind existentes (`bg-violet-500/15 border-violet-500/30 text-violet-700 dark:text-violet-300` etc.) mapeadas na paleta, para manter compatibilidade com dark mode.
- Sem alterações em business logic (drag-and-drop, sync, RLS).

## Fora de escopo
- Permitir escolher/editar manualmente a cor de cada pessoa (fica automático).
- Alteração no calendário público do cliente.