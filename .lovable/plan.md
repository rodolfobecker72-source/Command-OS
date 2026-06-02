# Meu Calendário

Nova página pessoal que mostra, em um calendário, tudo que está atribuído ao usuário logado nas áreas de **Gestão de Projetos** e **Prospecção**.

## Arquivos

**Criar**
- `src/pages/welcome/MyCalendarPage.tsx` — página com Header, toolbar (Mês/Semana, navegação, Hoje), legenda e Dialog de detalhes.

**Editar**
- `src/config/pages.ts` — adicionar entrada `meu-calendario` no grupo "Início", logo abaixo de `boas-vindas`. Sem `restrictedFrom` (todos os papéis veem).
- `src/App.tsx` — registrar rota `/meu-calendario` protegida por `PageGuard pageKey="meu-calendario"`.
- `mem://index.md` — referenciar a nova memória.

**Criar memória**
- `mem://features/my-calendar` — descrição da página pessoal.

## Fontes de dados (filtradas pelo `user.id` do AuthContext)

1. **Atividades de projeto** — `project_activities` onde `assigned_to_user_ids` contém o usuário e `due_date` existe. Join leve com `project_cards` para obter `proposal_id` + `project_name`.
2. **Ações de prospecção** — `prospection_leads` onde `responsible_user_id = user.id` e `next_action_date` está preenchida. Mostra empresa + próxima ação.

Carregamento via duas queries paralelas no `useEffect`, filtradas por `workspace_id` (RLS já garante isolamento).

## UI

- **Header**: "Meu Calendário"
- **Toolbar**: toggle Mês/Semana, navegação ←/→, label do período em pt-BR, botão "Hoje", switches para alternar visibilidade de cada tipo (Projetos / Prospecção)
- **Legenda**: 🟣 roxo = atividade de projeto · 🟠 laranja = ação de prospecção · destaque "Hoje" em azul `primary`
- **Grid** (mês): 7 colunas, células com data + chips compactos de eventos do dia
- **Semana**: 7 colunas com cards maiores
- **Mobile-first**: chips truncados com `text-[10px]`, scroll vertical dentro da célula
- **Dialog ao clicar**:
  - Atividade de projeto → título, projeto, data, status, botão "Abrir em Gestão de Projetos" (navega para `/gestao-projetos?budget=<budget_id>`)
  - Ação de prospecção → empresa, próxima ação, data, botão "Abrir em Prospecção" (navega para `/prospeccao`)

## Detalhes técnicos

```text
type PersonalEvent = {
  id: string;
  date: Date;
  kind: 'project' | 'prospection';
  title: string;       // ex: "ATV-123 - Editar vídeo"
  subtitle: string;    // ex: "P-0042 — Campanha XPTO"
  raw: any;            // dados originais para o Dialog
};
```

- Datas em string recebem `T12:00:00` antes de virar `Date` (regra do projeto).
- Estado: `currentDate`, `view: 'month'|'week'`, `showProjects`, `showProspection`, `selectedEvent`.
- Sem mudanças de schema/RLS (já temos `has_workspace_access`).
- Reaproveita ícones do `lucide-react` e componentes shadcn já existentes (`Dialog`, `Switch`, `Tabs`, `Button`).
- Sem dependência da página existente `/calendario` — código próprio, mais leve.

## Permissões

Sem restrições por papel — cada usuário vê apenas os próprios itens. A sidebar mostra automaticamente via `APP_PAGES`.
