# Corrigir "nada aparece no Calendário do Time"

## Diagnóstico

O `TeamCalendarPage` só considera um projeto como "do membro" quando existe uma **atividade de projeto (project_activities)** com o `user_id` do membro dentro do array `assigned_to_user_ids`.

Na base atual:
- 78 projetos aprovados
- 48 atividades no total
- **Apenas 5 atividades têm responsável atribuído**

Ou seja, para quase todos os membros a busca devolve zero projetos → tela vazia. Também há um campo legado `assigned_to_user_id` (singular) usado em atividades antigas que hoje é ignorado pela query.

Além disso, o vínculo "quem executa" também aparece nos próprios serviços do orçamento (campo `executor` de cada serviço, editado via `TeamMemberSelect`) — mas isso guarda o **nome**, não o `user_id`.

## Correções

Ampliar a resolução de "projetos do membro" em `src/pages/operation/TeamCalendarPage.tsx`, unindo três fontes:

1. **Atividades com array de responsáveis** (já existe): `project_activities.assigned_to_user_ids contains [memberId]`.
2. **Atividades com responsável legado**: também consultar `project_activities.assigned_to_user_id = memberId` e unir os `project_card_id` resultantes.
3. **Serviços com executor pelo nome do membro**: percorrer os `budgets` já carregados no contexto e incluir os que tenham alguma versão com `services[].executor === nomeDoMembro` (comparação case-insensitive, ignorando o prefixo `Freela: `). O nome vem da lista `members` já buscada.

O `memberBudgetIds` final é a união dos três conjuntos, mantendo a lógica atual de filtrar por `status='aprovada'` para o calendário.

## Feedback visual

Quando o membro está selecionado e o resultado é vazio, manter a mensagem atual ("Nenhum projeto encontrado…") — mas incluir uma linha explicativa curta abaixo: "Um projeto aparece aqui quando o membro é responsável por alguma atividade do projeto ou executor de algum serviço do orçamento."

## Arquivos alterados

- `src/pages/operation/TeamCalendarPage.tsx` — expandir o `useEffect` que monta `memberBudgetIds` (adicionar segunda query em `project_activities` pelo campo singular; cruzar `budgets` do contexto pelo `executor`); ajustar a mensagem de estado vazio.

## Fora de escopo

- Não alterar o schema nem migrar `assigned_to_user_id` → `assigned_to_user_ids`.
- Não mudar como o `executor` é salvo (continua por nome).
- Não mexer nas views de mês/semana nem no drag-and-drop.
