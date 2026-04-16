

# Plano: Central de Mídias

## Resumo
Criar a página "Central de Mídias" dentro do grupo **Projetos** na sidebar, permitindo cadastrar HDs, alocar projetos a eles e visualizar capacidades. A tabela `hard_drives` já existe no banco com a estrutura necessária (label, capacity_gb, projects como JSONB).

## O que será construído

**3 abas de visualização** (conforme prints):
1. **Projetos por HD** — Lista expandível de cada HD com barra de progresso e seus projetos
2. **Lista de Projetos** — Tabela com todos os projetos alocados em todos os HDs
3. **Capacidades** — Grid de cards com resumo visual de cada HD

**Métricas no topo**: HDs Cadastrados, Capacidade Total, Espaço Utilizado, Projetos Cadastrados

**Ações**: Novo HD (dialog), Alocar Projeto (dialog), Editar HD, Excluir HD

**Busca e filtros**: Campo de busca + filtro por HD

## Detalhes técnicos

### 1. Registrar página no sistema
- `src/config/pages.ts` — Adicionar entrada `central-midia` no grupo Projetos
- `src/components/layout/Sidebar.tsx` — Adicionar item "Central de Mídias" com ícone `HardDrive` no grupo Projetos
- `src/App.tsx` — Adicionar rota `/central-midia` com PageGuard

### 2. Criar página `src/pages/operation/MediaCenterPage.tsx`
- Usar a tabela `hard_drives` existente (campos: label, capacity_gb, projects JSONB)
- JSONB `projects` armazena array de `{ projectNumber, clientName, sizeGb }`
- 3 abas com Tabs component
- Dialog para cadastrar novo HD (Identificador + Capacidade em GB)
- Dialog para alocar projeto a um HD (Número do projeto, Cliente, Tamanho em GB)
- Cálculos de espaço utilizado, livre, percentual
- Barra de progresso visual para cada HD
- Busca por HD, projeto ou cliente
- Botão de ordenar por espaço disponível na aba Capacidades

### 3. Sem alterações no banco de dados
A tabela `hard_drives` já possui todos os campos necessários com RLS configurado.

