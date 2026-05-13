## Kanban de Atividades por Projeto

Hoje, em **Gestão de Projetos**, cada status mostra uma lista simples de projetos. Vou tornar cada projeto **clicável** para abrir um diálogo "Atividades do projeto" com um **kanban próprio** (similar ao exemplo enviado), com 3 colunas fixas:

- **Não iniciado**
- **Em andamento**
- **Concluído**

Cada coluna terá um botão "+ Nova tarefa" e os cartões podem ser arrastados entre colunas.

### Banco de dados

Nova tabela `project_activities`:
- `project_card_id` (referência ao projeto)
- `workspace_id` (isolamento por workspace, com RLS)
- `title`
- `status` (`nao_iniciado` | `em_andamento` | `concluido`)
- `order` (posição na coluna)

RLS por `workspace_id` (mesmo padrão das demais tabelas).

### Frontend

1. **`src/components/projects/ProjectActivitiesDialog.tsx`** (novo): dialog grande mostrando o kanban. Usa `@dnd-kit` (já instalado) para drag-and-drop entre colunas e reordenação dentro da coluna.
2. **`src/contexts/CRMContext.tsx`**: novos métodos `loadProjectActivities(projectCardId)`, `addProjectActivity`, `updateProjectActivity`, `deleteProjectActivity`, `reorderProjectActivities`.
3. **`src/pages/projects/ProjectManagementPage.tsx`**: cada linha de projeto ganha um clique que abre o `ProjectActivitiesDialog` daquele projeto, mantendo o `Select` de status do projeto à direita.

### Comportamento
- Tarefas concluídas mostram o título com leve fade.
- Edição inline do título ao clicar no card.
- Ícone de lixeira no hover para remover.
- Ordem persistida no banco.

Aprovar para eu seguir com a migração e implementação.
