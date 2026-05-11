## Ajustes no cadastro de Patrimônio

### 1. Banco de dados (migration)
Adicionar duas colunas na tabela `assets`:
- `category` (text, default `'equipamento'`) — valores aceitos: `equipamento` ou `estrutura`
- `needs_insurance` (boolean, default `false`) — indica necessidade de seguro

Sem alterações de RLS (políticas existentes já cobrem por `workspace_id`).

### 2. Formulário (`PatrimonioPage.tsx`)
- **Remover** o campo "URL da foto" do dialog de criar/editar.
- **Adicionar** Select "Categoria" com as opções:
  - Equipamento
  - Estrutura
- **Adicionar** Checkbox "Necessita de seguro".
- Atualizar `emptyForm`, `openEdit`, `handleSave` e a interface `Asset` para incluir `category` e `needs_insurance` (e remover `photo` do formulário — manteremos a coluna `photo` no banco intocada para não perder dados existentes, apenas removendo do form).

### 3. Listagem
- Substituir a miniatura de foto (coluna da imagem) por um ícone neutro indicando a categoria (Package para equipamento, Building/Boxes para estrutura).
- Adicionar coluna **Categoria** (badge).
- Adicionar indicador visual de **Seguro** (badge "Seguro" quando `needs_insurance = true`).
- Filtro de busca passa a considerar também `category`.

### Resumo técnico
- Migration: `ALTER TABLE public.assets ADD COLUMN category text NOT NULL DEFAULT 'equipamento'; ADD COLUMN needs_insurance boolean NOT NULL DEFAULT false;`
- Frontend: edição apenas em `src/pages/admin/PatrimonioPage.tsx`.
- Mantemos `photo` no DB para compatibilidade, mas sem expor no formulário.
