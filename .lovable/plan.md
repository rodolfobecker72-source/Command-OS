

## Plano: Regenerar Script SQL Consolidado

### Analise

O arquivo `docs/migration-full-consolidated.sql` (884 linhas) ja existe com a ordem correta (tabelas antes de funcoes). Comparei linha a linha com o schema real do banco (fornecido no contexto) e identifiquei **uma divergencia**:

| Item | Script atual | Schema real |
|---|---|---|
| `workspace_members` UNIQUE constraint | Ausente | `UNIQUE (workspace_id, user_id)` (definido na migracao original) |

Todas as 23 tabelas, 8 funcoes, ~88 policies, 2 triggers, 22 indices e 2 buckets estao presentes e na ordem correta.

### Acao

Reescrever `docs/migration-full-consolidated.sql` adicionando a constraint UNIQUE faltante na tabela `workspace_members`, mantendo toda a estrutura e ordem existente:

1. ENUM `app_role`
2. 23 TABELAS (com `UNIQUE (workspace_id, user_id)` em workspace_members)
3. FUNCOES (update_updated_at_column primeiro, depois auxiliares, depois negocio)
4. TRIGGERS
5. RLS POLICIES (~88)
6. INDICES (22)
7. STORAGE BUCKETS + POLICIES
8. CHECKLIST DE VALIDACAO

Nenhuma alteracao no frontend. Apenas o arquivo de documentacao SQL sera atualizado.

