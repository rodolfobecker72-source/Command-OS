

## Ajustar lista de status do funil de prospecção

### O que será feito

Remover 3 status que não são mais usados: `tentativa_contato`, `reuniao_realizada`, `proposta_solicitada`. O funil ficará com 6 estágios:

1. Mapeado
2. Contato Realizado
3. Reunião Agendada
4. Qualificado para CRM
5. Perdido
6. Nutrição

### Alterações

| Arquivo | Alteração |
|---|---|
| `src/types/prospection.ts` | Remover `tentativa_contato`, `reuniao_realizada`, `proposta_solicitada` do tipo `LeadFunnelStatus`, de `LEAD_FUNNEL_STATUS_LABELS` e de `FUNNEL_STATUS_ORDER` |
| `src/pages/prospection/ProspectionPage.tsx` | Remover os 3 status do `colorMap`, do `kanbanStatuses` e ajustar métricas (remover contagem de `proposals`, ajustar filtro de `meetings` para usar só `reuniao_agendada`) |

### Nota sobre dados existentes

Leads que já possuam os status removidos no banco de dados continuarão existindo mas não aparecerão no kanban. Caso existam, será necessário migrá-los manualmente para um status válido.

