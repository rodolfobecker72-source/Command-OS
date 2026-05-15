## Objetivo

Adicionar um campo "Responsável pelo Lead" na prospecção (vinculado a um usuário do workspace com role `vendedor` ou `admin`/`owner`) e mostrar avisos sobre a próxima ação do lead na tela de Boas-vindas para o usuário responsável (1 dia antes, no dia, ou em atraso).

## O que vai mudar

### 1. Banco de dados
- Adicionar coluna `responsible_user_id UUID NULL` em `prospection_leads` (referência lógica ao `auth.users` / `profiles.id`).

### 2. Tipos e contexto
- `src/types/prospection.ts`: adicionar campo `responsibleUserId?: string` na interface `ProspectionLead`.
- `src/contexts/ProspectionContext.tsx`: mapear `responsible_user_id` ↔ `responsibleUserId` no `leadFromDb` e `leadToDb`.

### 3. Formulário de Lead (ProspectionPage)
- Adicionar um `Select` "Responsável pelo Lead" no formulário de criação/edição.
- O Select carrega membros do workspace (via `workspace_members` + `profiles`) cuja `role` seja `vendedor`, `admin` ou `owner` (cobre vendedor e administrativo). Mostra nome + foto.
- Salvar o `user_id` selecionado no novo campo.
- Exibir o nome do responsável na visualização do card/tabela do lead.

### 4. Tela de Boas-vindas (WelcomePage)
- Novo bloco "Leads — próxima ação" abaixo das atividades operacionais.
- Buscar leads do workspace onde `responsible_user_id = profile.id`, `funnel_status NOT IN ('perdido', 'qualificado_crm')`, e `next_action_date` corresponde a:
  - **Em atraso**: data < hoje (badge vermelho)
  - **Hoje**: data = hoje (badge âmbar)
  - **Amanhã**: data = hoje + 1 (badge azul)
- Cada item mostra: empresa, ação prevista, data, badge de status. Click pode levar à página `/prospeccao` (opcional, simples link).
- Se não houver itens, o bloco não é renderizado.

## Detalhes técnicos

- O campo `next_action_date` em `prospection_leads` é `text` no formato `YYYY-MM-DD` (consistente com o resto do app). Comparação é feita com `today.toISOString().slice(0,10)` para evitar timezone (segue o padrão já usado em WelcomePage).
- O Select de responsável usa o componente `TeamMemberSelect` existente se aplicável, ou nova query inline (mesma lógica de carregar `workspace_members` + `profiles`).
- Não há mudança em RLS — o filtro por `workspace_id` já é coberto pelas policies existentes.
- O `prospectionResponsible` (texto livre) existente fica intacto para retrocompatibilidade.

## Arquivos afetados

- Migração SQL (nova coluna)
- `src/types/prospection.ts`
- `src/contexts/ProspectionContext.tsx`
- `src/pages/prospection/ProspectionPage.tsx`
- `src/pages/welcome/WelcomePage.tsx`
