## Tela de Boas-vindas

Nova rota `/boas-vindas` que será o primeiro item do menu e a página inicial após login para todos os usuários.

### Conteúdo da tela
1. **Saudação dinâmica por horário** + nome do usuário
   - 5h–12h: "Bom dia, {Nome}"
   - 12h–18h: "Boa tarde, {Nome}"
   - 18h–5h: "Boa noite, {Nome}"
2. **Data atual** formatada em pt-BR (ex.: "quarta-feira, 13 de maio de 2026")
3. **Resumo rápido** (cards):
   - Projetos ativos (count de projetos em status diferente de concluído/cancelado, do workspace)
   - Propostas pendentes (orçamentos em estágios não-finais do CRM)
4. **Aniversariantes do mês** — lista de membros do workspace com `birth_date` no mês atual, mostrando nome, avatar e dia. Mensagem amigável quando vazio.

### Mudanças técnicas

**Roteamento (`src/App.tsx`)**
- Adicionar rota `/boas-vindas` dentro do `AppLayout`, com `PageGuard pageKey="boas-vindas"`.

**Registro de páginas (`src/config/pages.ts`)**
- Adicionar entrada `{ key: 'boas-vindas', label: 'Boas-vindas', href: '/boas-vindas', group: 'Início' }` sem restrição de role (todos têm acesso).
- Colocar como **primeiro item** do array `APP_PAGES`, para que `Index.tsx` (que redireciona para a primeira página acessível) leve naturalmente para `/boas-vindas`.

**Sidebar (`src/components/layout/Sidebar.tsx`)**
- Adicionar novo grupo "Início" no topo do `navGroups` com o item Boas-vindas (ícone `Home` ou `Sparkles` do lucide-react).

**Página (`src/pages/welcome/WelcomePage.tsx` — novo)**
- Usa `useAuth()` para nome do usuário e `workspace_id`.
- Calcula saudação por `new Date().getHours()`.
- Data via `toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })`.
- Queries Supabase:
  - `projects` filtrados pelo workspace e status ativo
  - `budgets` filtrados pelo workspace em estágios pendentes
  - `profiles` do workspace com `birth_date` cujo mês = mês atual (parse com `T12:00:00` para evitar timezone shift)
- Layout em cards usando design tokens semânticos (primary `#002cbe`), responsivo mobile-first, com `Header` padrão.

**Login redirect**
- Login já redireciona para `/` que entra no `Index.tsx` → primeira página acessível. Como Boas-vindas será a primeira em `APP_PAGES` e todos têm acesso, isso resolve o "primeira tela ao acessar".

### Não-mudanças
- Sem migrações de banco (usa `birth_date` já existente).
- Sem mudanças em RLS, edge functions ou Auth.