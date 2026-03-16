-- =====================================================================
-- COMMAND OS — Etapa 1: Migração Consolidada
-- Escopo: Autenticação, Workspaces, Membros, Permissões
-- Compatível com: Supabase (novo projeto limpo)
-- Data: 2026-03-16
-- =====================================================================
-- INSTRUÇÕES:
-- 1. Crie um novo projeto no supabase.com
-- 2. Abra o SQL Editor do projeto
-- 3. Cole e execute este script inteiro
-- =====================================================================

BEGIN;

-- =====================================================================
-- 1. ENUM DE ROLES
-- =====================================================================
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'vendedor', 'visualizador');

-- =====================================================================
-- 2. FUNÇÕES AUXILIARES (SECURITY DEFINER)
-- Criadas ANTES das tabelas para uso nas RLS policies
-- =====================================================================

-- Retorna o workspace_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_workspace(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id FROM public.workspace_members
  WHERE user_id = _user_id LIMIT 1
$$;

-- Verifica se o usuário tem um role específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Verifica se o usuário pertence ao workspace
CREATE OR REPLACE FUNCTION public.has_workspace_access(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  )
$$;

-- Retorna o role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.workspace_members
  WHERE user_id = _user_id LIMIT 1
$$;

-- Função genérica para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================================
-- 3. TABELA: profiles
-- =====================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS: profiles
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_select_peers" ON public.profiles
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm1
      JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.id
    )
  );

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- =====================================================================
-- 4. TABELA: workspaces
-- =====================================================================
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- RLS: workspaces (sem DELETE — intencional)
CREATE POLICY "workspaces_select" ON public.workspaces
  FOR SELECT TO authenticated USING (public.has_workspace_access(auth.uid(), id));

CREATE POLICY "workspaces_insert" ON public.workspaces
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "workspaces_update" ON public.workspaces
  FOR UPDATE TO authenticated USING (public.has_workspace_access(auth.uid(), id));

-- =====================================================================
-- 5. TABELA: workspace_members
-- =====================================================================
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'visualizador',
  page_permissions TEXT[] NOT NULL DEFAULT '{}',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- RLS: workspace_members
CREATE POLICY "workspace_members_select" ON public.workspace_members
  FOR SELECT TO authenticated
  USING (public.has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "workspace_members_insert_admin" ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_workspace_access(auth.uid(), workspace_id)
    AND (public.get_user_role(auth.uid()) = ANY (ARRAY['owner'::public.app_role, 'admin'::public.app_role]))
  );

-- Permite que o próprio usuário se insira como owner (durante signup)
CREATE POLICY "workspace_members_insert_owner" ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND (role = 'owner'::public.app_role));

CREATE POLICY "workspace_members_update" ON public.workspace_members
  FOR UPDATE TO authenticated
  USING (
    public.has_workspace_access(auth.uid(), workspace_id)
    AND (public.get_user_role(auth.uid()) = ANY (ARRAY['owner'::public.app_role, 'admin'::public.app_role]))
  );

CREATE POLICY "workspace_members_delete" ON public.workspace_members
  FOR DELETE TO authenticated
  USING (
    public.has_workspace_access(auth.uid(), workspace_id)
    AND (public.get_user_role(auth.uid()) = ANY (ARRAY['owner'::public.app_role, 'admin'::public.app_role]))
  );

-- =====================================================================
-- 6. TABELA: workspace_invites
-- =====================================================================
CREATE TABLE public.workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'visualizador',
  page_permissions TEXT[] NOT NULL DEFAULT '{}',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- RLS: workspace_invites
CREATE POLICY "workspace_invites_select" ON public.workspace_invites
  FOR SELECT TO authenticated
  USING (public.has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "workspace_invites_insert" ON public.workspace_invites
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_workspace_access(auth.uid(), workspace_id)
    AND (public.get_user_role(auth.uid()) = ANY (ARRAY['owner'::public.app_role, 'admin'::public.app_role]))
  );

CREATE POLICY "workspace_invites_update" ON public.workspace_invites
  FOR UPDATE TO authenticated
  USING (
    public.has_workspace_access(auth.uid(), workspace_id)
    AND (public.get_user_role(auth.uid()) = ANY (ARRAY['owner'::public.app_role, 'admin'::public.app_role]))
  );

CREATE POLICY "workspace_invites_delete" ON public.workspace_invites
  FOR DELETE TO authenticated
  USING (
    public.has_workspace_access(auth.uid(), workspace_id)
    AND (public.get_user_role(auth.uid()) = ANY (ARRAY['owner'::public.app_role, 'admin'::public.app_role]))
  );

-- =====================================================================
-- 7. TRIGGER: auto-criar profile ao registrar usuário
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, photo_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NULL
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- 8. FUNÇÃO: criar workspace + membro owner no signup
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_signup_workspace(workspace_name TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  INSERT INTO public.workspaces (name, created_by)
  VALUES (workspace_name, auth.uid())
  RETURNING id INTO new_workspace_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, auth.uid(), 'owner');

  RETURN new_workspace_id;
END;
$$;

-- =====================================================================
-- 9. FUNÇÃO: aceitar convite de workspace
-- =====================================================================
CREATE OR REPLACE FUNCTION public.accept_invite(invite_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.workspace_invites%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM public.workspace_invites
  WHERE id = invite_id AND accepted_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or already accepted';
  END IF;

  -- Verificar se o email corresponde
  IF v_invite.email != (SELECT email FROM auth.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Email does not match invite';
  END IF;

  INSERT INTO public.workspace_members (workspace_id, user_id, role, page_permissions)
  VALUES (v_invite.workspace_id, auth.uid(), v_invite.role, v_invite.page_permissions);

  UPDATE public.workspace_invites SET accepted_at = now() WHERE id = invite_id;
END;
$$;

-- =====================================================================
-- 10. ÍNDICES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace_id ON public.workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_email ON public.workspace_invites(email);

COMMIT;

-- =====================================================================
-- CHECKLIST PÓS-EXECUÇÃO:
-- =====================================================================
-- [ ] Verificar no Table Editor que as 4 tabelas foram criadas:
--     profiles, workspaces, workspace_members, workspace_invites
-- [ ] Verificar que RLS está ativo em todas as tabelas
-- [ ] Em Auth → URL Configuration:
--     - Site URL: https://command.hero.rec.br
--     - Redirect URLs: https://command.hero.rec.br/reset-password
-- [ ] Testar signup: deve criar profile + workspace + member automaticamente
-- =====================================================================
