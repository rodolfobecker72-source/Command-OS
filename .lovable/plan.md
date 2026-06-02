## Régua de temperatura automática

A temperatura (Frio / Morno / Quente) passa a ser calculada automaticamente a cada criação/edição do lead, com base em **origem do lead** e **histórico de relacionamento** (status no funil + recência do último contato + próxima ação agendada).

O usuário ainda pode travar manualmente quando quiser sobrescrever a régua.

## Régua de pontuação (0–100)

### Origem do lead

| Origem | Pontos |
|---|---|
| Indicação | +20 |
| Site / Inbound / Networking | +15 |
| Evento | +12 |
| Instagram / Meta Ads / Google Ads | +8 |
| Prospecção ativa / Outbound / Outro | +0 |

### Status no funil

| Status | Pontos |
|---|---|
| Reunião agendada | +35 |
| Qualificado para CRM | +45 |
| Contato realizado | +18 |
| Mapeado | +0 |
| Nutrição | −5 |
| Perdido | força **Frio** (override) |

### Recência do último contato

| Tempo desde o último contato | Pontos |
|---|---|
| Nunca contatado | −10 |
| ≤ 7 dias | +20 |
| 8–14 dias | +10 |
| 15–30 dias | +0 |
| 31–60 dias | −10 |
| > 60 dias | −20 |

### Próxima ação agendada

| Situação | Pontos |
|---|---|
| Marcada nos próximos 7 dias | +15 |
| Marcada entre 8–30 dias | +5 |
| Sem próxima ação | −5 |
| Atrasada (data já passou) | −15 |

### Faixas

- `0–39` → **Frio**
- `40–69` → **Morno**
- `≥ 70` → **Quente**

## Arquivos

**Criar**
- `src/utils/leadTemperature.ts` — função pura `computeLeadTemperature(lead): { temperature, score, breakdown }`. Aplica os pesos acima, trata override de `perdido` e retorna o detalhamento para tooltip.

**Editar**
- `src/types/prospection.ts` — adicionar campo `temperatureManual?: boolean` (default `false`). Quando `true`, a régua não sobrescreve.
- `src/contexts/ProspectionContext.tsx` — em `addLead` e `updateLead`, antes de salvar, se `temperatureManual !== true` recalcular `temperature` via `computeLeadTemperature`. Atualizar mappers `leadFromDb` / `leadToDb` para o novo campo (`temperature_manual`).
- `src/pages/prospection/ProspectionPage.tsx` — no formulário de lead:
  - Substituir o select "Temperatura" por um bloco com:
    - Badge da temperatura calculada (somente leitura por padrão) + score e tooltip com o breakdown
    - Toggle "Definir manualmente" → quando ligado, libera o select e marca `temperatureManual=true`
  - No Dialog de detalhes, mostrar pequena legenda "Calculada automaticamente" ou "Definida manualmente"

**Banco**
- Migração `ALTER TABLE prospection_leads ADD COLUMN temperature_manual boolean NOT NULL DEFAULT false;`
- Sem recálculo retroativo — leads existentes ficam como estão até a próxima edição (conforme escolhido).

## Comportamento da UI

```text
┌─ Temperatura ───────────────────────────────────┐
│ [🌡️ Quente]  Score: 78/100   ⓘ ver detalhes    │
│ ☐ Definir manualmente                            │
└──────────────────────────────────────────────────┘
```

Tooltip ⓘ mostra: "Origem: Indicação (+20) · Status: Reunião agendada (+35) · Último contato 5 dias (+20) · Próxima ação em 3 dias (+15) = 78".

Com o toggle ligado, o badge vira o select original e o sistema para de recalcular naquele lead.

## Memória

- Atualizar `mem://features/prospection/leads` com a régua de temperatura e o campo `temperatureManual`.

## Detalhes técnicos

- Função pura, sem efeitos colaterais — fácil de testar.
- Datas continuam usando o padrão `T12:00:00` ao virar `Date`.
- Mappers snake_case ↔ camelCase mantidos.
- Sem mudança nas RLS.
- Reaproveita `TemperatureBadge` já existente; nenhum componente novo de UI complexo.
