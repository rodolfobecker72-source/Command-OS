## Gestão de Projetos — nova área no grupo Projetos

### Visão geral
Nova página em `/gestao-projetos` que lista projetos agrupados por status, no estilo do print (linhas colapsáveis com badge colorido + contagem). Acessível por padrão a todos os papéis (incluindo `time_hero`, o time operacional). Os status são editáveis: criar novo, renomear, reordenar (drag-and-drop) e escolher cor.

Esta entrega prepara apenas a estrutura (página + status configuráveis + DB). O detalhe de cada projeto e os campos (responsáveis, datas, objetivo, etc.) ficam para uma etapa futura.

### Banco de dados (nova migração)

Tabela `project_statuses` (status configuráveis por workspace):
- `workspace_id` (FK workspaces)
- `name` (texto, ex.: "Em planejamento")
- `color` (hex, ex.: `#3b82f6`)
- `order` (int, para ordenação)
- `is_default` (bool, marca os 3 status iniciais)
- timestamps padrão

Tabela `projects` (estrutura mínima — campos detalhados serão adicionados depois):
- `workspace_id` (FK workspaces)
- `name` (texto)
- `status_id` (FK project_statuses)
- `budget_id` (FK budgets, opcional — para projetos vindos do CRM aprovado)
- `order` (int, para ordenação dentro do status)
- timestamps padrão

RLS: ambas as tabelas usam `has_workspace_access(auth.uid(), workspace_id)` para SELECT/INSERT/UPDATE/DELETE.

Seed automático dos 3 status iniciais por workspace via função/RPC chamada na primeira visita à página caso ainda não existam:
- "Em planejamento" — azul
- "Em execução" — laranja
- "Finalizado" — verde

### Frontend

**Rota & permissão**
- `src/config/pages.ts`: adicionar entry `{ key: 'gestao-projetos', label: 'Gestão de Projetos', href: '/gestao-projetos', group: 'Projetos' }` (sem `restrictedFrom` — operacional/`time_hero` tem acesso).
- `src/App.tsx`: registrar rota apontando para nova página.

**Página `src/pages/projects/ProjectManagementPage.tsx`**
- Header com título "Gestão de Projetos" e descrição: "Aqui você pode acompanhar todo fluxo de projetos da produtora, cada uma das demandas, responsáveis, datas, objetivo e muito mais!"
- Botão "Gerenciar status" (abre dialog) e botão "Novo projeto" (placeholder por enquanto).
- Lista de status (cada um colapsável, default expandido) inspirada no print:
  - Linha do status: `▶` chevron + dot colorido + nome em pílula colorida (bg suave) + contagem.
  - Ao expandir, mostra os projetos do status (placeholder vazio "Nenhum projeto" inicialmente).
- Status ordenados por `order` asc.

**Dialog de gestão de status (`ProjectStatusManagerDialog.tsx`)**
- Lista atual com drag-and-drop (`@dnd-kit/sortable`, já no projeto).
- Cada linha: nome editável + color picker + botão remover (bloqueado se houver projetos no status; alerta).
- Botão "Adicionar status".
- Salvar persiste `order`, `name`, `color`.

**Tokens semânticos**
- Cores dos status armazenadas como HEX no DB; no render aplicar como inline style usando opacidade para o fundo da pílula (ex.: `style={{ background: color + '1A', color }}`) para manter compatibilidade com o design system, sem hardcode em Tailwind.

### Detalhes técnicos
- Mapper snake_case ↔ camelCase em `src/services/projectsService.ts` (novo).
- Reordenação: ao soltar item, recalcular `order` sequencial e fazer `upsert` em batch.
- Seed dos status default: RPC `seed_default_project_statuses(workspace_id)` que faz `INSERT … ON CONFLICT DO NOTHING` baseado em nome+workspace. Página chama no mount se a query inicial retornar vazia.
- A tabela `projects` é criada agora mesmo vazia para já validar RLS e relacionamentos; será expandida na próxima etapa.

### Fora do escopo desta etapa
- Formulário/edição detalhada de projetos (campos responsáveis, datas, objetivo, anexos, etc.).
- Integração automática de orçamentos aprovados virando projetos.
- Filtros, busca e visualização kanban.
