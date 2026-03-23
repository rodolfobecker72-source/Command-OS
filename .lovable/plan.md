

## Lista de projetos sem data definida no mês

### O que será feito

Abaixo do calendário (na visão mensal), exibir uma seção com os projetos que possuem `executionMonth` correspondente ao mês visualizado, mas que **não** têm `executionStartDate` definida. Cada item usa o mesmo padrão visual do calendário: verde para aprovados, amarelo para em negociação. Clicável para abrir o mesmo dialog de detalhes.

### Alterações

| Arquivo | Alteração |
|---|---|
| `src/pages/operation/CalendarPage.tsx` | Adicionar lista `undatedEvents` filtrando budgets com `executionMonth === YYYY-MM do mês atual` e sem `executionStartDate`. Renderizar seção abaixo do calendário com título "Projetos previstos para {mês} — sem data definida" e cards usando `CalendarEventCard`. |

### Lógica de filtragem

```typescript
const currentYearMonth = format(currentDate, 'yyyy-MM');
const undatedEvents = budgets.filter(
  b => b.executionMonth === currentYearMonth && !b.executionStartDate
);
```

### Visual

- Seção com borda superior, padding, título em texto pequeno
- Cards no mesmo estilo do `CalendarEventCard` (não-compact), com cores por status
- Clique abre o mesmo dialog de detalhes já existente
- Exibida apenas quando há itens (oculta se vazia)

