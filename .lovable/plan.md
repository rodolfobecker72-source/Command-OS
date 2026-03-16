

## Correção do Script SQL Consolidado -- Ordem de Dependências

### Problema

As funções `has_workspace_access`, `get_user_role`, `has_role`, `get_user_workspace` usam `LANGUAGE sql` e referenciam `public.workspace_members` diretamente no corpo. O Supabase valida essas referências no momento do `CREATE FUNCTION` para funções SQL, e como as tabelas ainda nao existiam, o script falhou.

### Solução

Reordenar o script para que todas as tabelas sejam criadas antes de qualquer funcao que as referencie. A nova ordem sera:

```text
1. ENUM app_role
2. TABELAS (23 tabelas, mesma ordem atual)
3. FUNCAO update_updated_at_column (nao depende de tabelas)
4. FUNCOES AUXILIARES (has_workspace_access, get_user_role, has_role, get_user_workspace)
5. FUNCOES DE NEGOCIO (handle_new_user, handle_signup_workspace, accept_invite)
6. TRIGGERS (on_auth_user_created, update_workspace_layout_updated_at)
7. RLS POLICIES (~88 policies)
8. INDICES (22 indices)
9. STORAGE BUCKETS + POLICIES
10. CHECKLIST DE VALIDACAO
```

### Alteracoes no Arquivo

**Arquivo:** `docs/migration-full-consolidated.sql`

Sera reescrito por completo com o mesmo conteudo, apenas reordenando os blocos. Nenhuma tabela, policy, funcao ou trigger sera adicionada ou removida. O conteudo e identico ao atual -- apenas a sequencia muda.

### O que NAO muda

- Nenhum arquivo do frontend
- Nenhuma tabela, coluna ou default
- Nenhuma policy RLS
- Nenhum indice
- Nenhuma funcao ou trigger (apenas a posicao no script)

