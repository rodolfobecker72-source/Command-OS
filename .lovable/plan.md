## Adicionar data de nascimento ao cadastro de membros

### Banco de dados
- Adicionar coluna `birth_date` (date, nullable) na tabela `profiles`.

### Frontend (`src/pages/users/UsersPage.tsx`)
- Adicionar campo "Data de nascimento" (input type="date") no diálogo **Cadastrar Membro** (opcional).
- Adicionar o mesmo campo no diálogo **Editar Membro**, pré-preenchido com o valor atual.
- Mostrar a data formatada (dd/mm/aaaa) na linha da tabela, abaixo do nome do membro.

### Edge Functions
- `create-member`: aceitar `birthDate` no body e gravar em `profiles.birth_date` após criar o usuário.
- `update-member-profile`: aceitar `birthDate` no body e incluir no update do profile.

### Tipos
- Estender a interface `Profile` em `src/contexts/AuthContext.tsx` com `birth_date: string | null`.

Sem mudanças em RLS (políticas existentes da `profiles` já cobrem leitura/atualização).