

## Correção: Projetos não aparecem no calendário

### Problema identificado

Há um bug de referência de objeto JavaScript no `getEventsForDay` nos componentes `CalendarMonthView` e `CalendarWeekView`. Quando um orçamento não tem `executionEndDate` (como o 727 - Seminário Imobiliário), o código faz `end = start`, criando duas variáveis apontando para o mesmo objeto Date. Ao chamar `end.setHours(23,59,59,999)`, o `start` também é mutado para 23:59, fazendo com que a comparação `d >= start` falhe (12:00 >= 23:59 = false).

O projeto 727 existe no banco com `execution_start_date: 2026-05-20` e `execution_end_date: null`, confirmando que é afetado por este bug.

### Correção

| Arquivo | Alteração |
|---|---|
| `src/components/operation/CalendarMonthView.tsx` | Corrigir `getEventsForDay`: quando `executionEndDate` é null, criar um **novo** Date a partir de `start` em vez de reusar a referência |
| `src/components/operation/CalendarWeekView.tsx` | Mesma correção |

### Detalhe técnico

Trocar:
```typescript
const end = b.executionEndDate ? new Date(b.executionEndDate) : start;
```
Por:
```typescript
const end = b.executionEndDate ? new Date(b.executionEndDate) : new Date(start);
```

Isso garante que `start` e `end` são objetos independentes, e `setHours` em um não afeta o outro. Com isso, todos os projetos com data de execução (mesmo sem data de fim) passarão a aparecer corretamente no calendário, com a cor amarela (warning) para projetos em negociação.

