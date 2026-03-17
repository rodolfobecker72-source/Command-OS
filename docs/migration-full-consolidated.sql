-- ============================================================================
-- COMMAND OS — SCRIPT SQL CONSOLIDADO DE MIGRAÇÃO COMPLETA
-- ============================================================================
-- Versão: 2.0 (corrigida ordem de dependências)
-- Data: 2026-03-16
-- Objetivo: Replicar 100% do schema atual em um projeto Supabase limpo.
-- Instruções: Cole este script inteiro no SQL Editor do novo projeto Supabase
--             e execute de uma vez.
-- ============================================================================
-- ORDEM DE EXECUÇÃO:
-- 1. ENUM app_role
-- 2. TABELAS (23 tabelas, ordem de dependências)
-- 3. FUNÇÃO update_updated_at_column
-- 4. FUNÇÕES AUXILIARES (dependem de workspace_members)
-- 5. FUNÇÕES DE NEGÓCIO (handle_new_user, handle_signup_workspace, accept_invite)
-- 6. TRIGGERS
-- 7. RLS POLICIES (~88 policies)
-- 8. ÍNDICES (22 índices)
-- 9. STORAGE BUCKETS + POLICIES
-- 10. CHECKLIST DE VALIDAÇÃO
-- ============================================================================


-- ============================================================================
-- 1. ENUM
-- ============================================================================

CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'vendedor', 'visualizador');


-- ============================================================================
-- 2. TABELAS
-- ============================================================================

-- 2.1 profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2.2 workspaces
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- 2.3 workspace_members
CREATE TABLE public.workspace_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL DEFAULT 'visualizador',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  page_permissions TEXT[] NOT NULL DEFAULT '{}',
  UNIQUE (workspace_id, user_id)
);
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- 2.4 workspace_invites
CREATE TABLE public.workspace_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'visualizador',
  page_permissions TEXT[] NOT NULL DEFAULT '{}',
  invited_by UUID,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- 2.5 workspace_settings
CREATE TABLE public.workspace_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE UNIQUE,
  default_fixed_cost_percentage NUMERIC NOT NULL DEFAULT 20,
  default_nf_percentage NUMERIC NOT NULL DEFAULT 13,
  default_target_margin_percentage NUMERIC NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

-- 2.6 workspace_layout
CREATE TABLE public.workspace_layout (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT NOT NULL DEFAULT '',
  company_name TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workspace_layout ENABLE ROW LEVEL SECURITY;

-- 2.7 clients
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT '',
  cnpj TEXT NOT NULL DEFAULT '',
  responsible_person TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  lead_origin TEXT NOT NULL DEFAULT 'indicacao',
  sector TEXT NOT NULL DEFAULT '',
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 2.8 budgets
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  proposal_id TEXT NOT NULL DEFAULT '',
  project_name TEXT NOT NULL DEFAULT '',
  project_description TEXT NOT NULL DEFAULT '',
  service_type TEXT NOT NULL DEFAULT '',
  objective TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  payment_terms TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'oportunidade_mapeada',
  includes_tax BOOLEAN NOT NULL DEFAULT false,
  includes_logistics BOOLEAN NOT NULL DEFAULT false,
  includes_accommodation BOOLEAN NOT NULL DEFAULT false,
  includes_meals BOOLEAN NOT NULL DEFAULT false,
  includes_raw_material BOOLEAN NOT NULL DEFAULT false,
  includes_technical_visit BOOLEAN NOT NULL DEFAULT false,
  has_execution_date BOOLEAN NOT NULL DEFAULT false,
  execution_start_date TIMESTAMPTZ,
  execution_end_date TIMESTAMPTZ,
  execution_month TEXT,
  current_version INTEGER NOT NULL DEFAULT 0,
  approved_version INTEGER,
  approval_date TIMESTAMPTZ,
  final_value NUMERIC,
  execution JSONB,
  contract_url TEXT,
  nf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- 2.9 budget_versions
CREATE TABLE public.budget_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  services JSONB NOT NULL DEFAULT '[]',
  operational_costs JSONB NOT NULL DEFAULT '[]',
  costs JSONB NOT NULL DEFAULT '[]',
  production_cost NUMERIC NOT NULL DEFAULT 0,
  fixed_cost_percentage NUMERIC NOT NULL DEFAULT 20,
  nf_cost_percentage NUMERIC NOT NULL DEFAULT 13,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  full_price NUMERIC NOT NULL DEFAULT 0,
  discount4_price NUMERIC NOT NULL DEFAULT 0,
  discount5_price NUMERIC NOT NULL DEFAULT 0,
  margin NUMERIC NOT NULL DEFAULT 0,
  is_rejected BOOLEAN NOT NULL DEFAULT false,
  reason TEXT NOT NULL DEFAULT '',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.budget_versions ENABLE ROW LEVEL SECURITY;

-- 2.10 prospection_leads
CREATE TABLE public.prospection_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL DEFAULT '',
  contact_role TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  origin TEXT NOT NULL DEFAULT 'prospeccao_ativa',
  segment TEXT NOT NULL DEFAULT 'outro',
  acquisition_type TEXT NOT NULL DEFAULT 'outbound',
  estimated_potential NUMERIC NOT NULL DEFAULT 0,
  temperature TEXT NOT NULL DEFAULT 'frio',
  funnel_status TEXT NOT NULL DEFAULT 'mapeado',
  prospection_responsible TEXT NOT NULL DEFAULT '',
  closing_responsible TEXT NOT NULL DEFAULT '',
  last_contact_date TEXT NOT NULL DEFAULT '',
  next_action TEXT NOT NULL DEFAULT '',
  next_action_date TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'media',
  strategic_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prospection_leads ENABLE ROW LEVEL SECURITY;

-- 2.11 kanban_columns
CREATE TABLE public.kanban_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  key TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  "order" INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;

-- 2.12 project_columns
CREATE TABLE public.project_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  key TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  "order" INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.project_columns ENABLE ROW LEVEL SECURITY;

-- 2.13 project_cards
CREATE TABLE public.project_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  proposal_id TEXT NOT NULL DEFAULT '',
  project_name TEXT NOT NULL DEFAULT '',
  client_name TEXT NOT NULL DEFAULT '',
  client_id TEXT NOT NULL DEFAULT '',
  objective TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planejamento',
  service_types JSONB NOT NULL DEFAULT '[]',
  progress INTEGER NOT NULL DEFAULT 0,
  tasks JSONB NOT NULL DEFAULT '[]',
  links JSONB NOT NULL DEFAULT '[]',
  comments JSONB NOT NULL DEFAULT '[]',
  material_link TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_cards ENABLE ROW LEVEL SECURITY;

-- 2.14 service_categories
CREATE TABLE public.service_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  key TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL DEFAULT '',
  "order" INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- 2.15 service_objectives
CREATE TABLE public.service_objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  key TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL DEFAULT '',
  category_key TEXT NOT NULL DEFAULT '',
  "order" INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.service_objectives ENABLE ROW LEVEL SECURITY;

-- 2.16 service_items
CREATE TABLE public.service_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  category_key TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'diaria',
  description TEXT NOT NULL DEFAULT '',
  default_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_items ENABLE ROW LEVEL SECURITY;

-- 2.17 payment_terms
CREATE TABLE public.payment_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_terms ENABLE ROW LEVEL SECURITY;

-- 2.18 score_history
CREATE TABLE public.score_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  previous_score INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;

-- 2.19 assets
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  serial_number TEXT NOT NULL DEFAULT '',
  hero_asset_number TEXT NOT NULL DEFAULT '',
  photo TEXT NOT NULL DEFAULT '',
  reference_link TEXT NOT NULL DEFAULT '',
  assigned_to TEXT NOT NULL DEFAULT '',
  value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- 2.20 hard_drives
CREATE TABLE public.hard_drives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '',
  capacity_gb NUMERIC NOT NULL DEFAULT 0,
  projects JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hard_drives ENABLE ROW LEVEL SECURITY;

-- 2.21 legacy_projects
CREATE TABLE public.legacy_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_number TEXT NOT NULL DEFAULT '',
  client_id TEXT NOT NULL DEFAULT '',
  client_name TEXT NOT NULL DEFAULT '',
  size_gb NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.legacy_projects ENABLE ROW LEVEL SECURITY;

-- 2.22 monthly_goals
CREATE TABLE public.monthly_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  month TEXT NOT NULL DEFAULT '',
  value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, month)
);
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;

-- 2.23 landing_leads (pública, sem workspace_id)
CREATE TABLE public.landing_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  instagram TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.landing_leads ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 3. FUNÇÃO update_updated_at_column (não depende de tabelas específicas)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ============================================================================
-- 4. FUNÇÕES AUXILIARES (dependem de workspace_members)
-- ============================================================================

-- 4.1 has_workspace_access
CREATE OR REPLACE FUNCTION public.has_workspace_access(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  )
$$;

-- 4.2 get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.workspace_members
  WHERE user_id = _user_id LIMIT 1
$$;

-- 4.3 has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4.4 get_user_workspace
CREATE OR REPLACE FUNCTION public.get_user_workspace(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT workspace_id FROM public.workspace_members
  WHERE user_id = _user_id LIMIT 1
$$;


-- ============================================================================
-- 5. FUNÇÕES DE NEGÓCIO
-- ============================================================================

-- 5.1 handle_new_user (trigger function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- 5.2 handle_signup_workspace
CREATE OR REPLACE FUNCTION public.handle_signup_workspace(workspace_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- 5.3 accept_invite
CREATE OR REPLACE FUNCTION public.accept_invite(invite_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_invite public.workspace_invites%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM public.workspace_invites WHERE id = invite_id AND accepted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or already accepted';
  END IF;

  IF v_invite.email != (SELECT email FROM auth.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Email does not match invite';
  END IF;

  INSERT INTO public.workspace_members (workspace_id, user_id, role, page_permissions)
  VALUES (v_invite.workspace_id, auth.uid(), v_invite.role, v_invite.page_permissions);

  UPDATE public.workspace_invites SET accepted_at = now() WHERE id = invite_id;
END;
$$;


-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- 6.1 Trigger: criar profile automaticamente ao criar usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6.2 Trigger: atualizar updated_at em workspace_layout
CREATE TRIGGER update_workspace_layout_updated_at
  BEFORE UPDATE ON public.workspace_layout
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================
-- 7. RLS POLICIES
-- ============================================================================

-- 7.1 profiles
CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY profiles_select_peers ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm1
      JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.id
    )
  );
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- 7.2 workspaces
CREATE POLICY workspaces_insert ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY workspaces_select ON public.workspaces FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), id));
CREATE POLICY workspaces_update ON public.workspaces FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), id));

-- 7.3 workspace_members
CREATE POLICY workspace_members_select ON public.workspace_members FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY workspace_members_insert_owner ON public.workspace_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'owner');
CREATE POLICY workspace_members_insert_admin ON public.workspace_members FOR INSERT TO authenticated
  WITH CHECK (
    has_workspace_access(auth.uid(), workspace_id)
    AND get_user_role(auth.uid()) = ANY(ARRAY['owner'::app_role, 'admin'::app_role])
  );
CREATE POLICY workspace_members_update ON public.workspace_members FOR UPDATE TO authenticated
  USING (
    has_workspace_access(auth.uid(), workspace_id)
    AND get_user_role(auth.uid()) = ANY(ARRAY['owner'::app_role, 'admin'::app_role])
  );
CREATE POLICY workspace_members_delete ON public.workspace_members FOR DELETE TO authenticated
  USING (
    has_workspace_access(auth.uid(), workspace_id)
    AND get_user_role(auth.uid()) = ANY(ARRAY['owner'::app_role, 'admin'::app_role])
  );

-- 7.4 workspace_invites
CREATE POLICY workspace_invites_select ON public.workspace_invites FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY workspace_invites_insert ON public.workspace_invites FOR INSERT TO authenticated
  WITH CHECK (
    has_workspace_access(auth.uid(), workspace_id)
    AND get_user_role(auth.uid()) = ANY(ARRAY['owner'::app_role, 'admin'::app_role])
  );
CREATE POLICY workspace_invites_update ON public.workspace_invites FOR UPDATE TO authenticated
  USING (
    has_workspace_access(auth.uid(), workspace_id)
    AND get_user_role(auth.uid()) = ANY(ARRAY['owner'::app_role, 'admin'::app_role])
  );
CREATE POLICY workspace_invites_delete ON public.workspace_invites FOR DELETE TO authenticated
  USING (
    has_workspace_access(auth.uid(), workspace_id)
    AND get_user_role(auth.uid()) = ANY(ARRAY['owner'::app_role, 'admin'::app_role])
  );

-- 7.5 workspace_settings
CREATE POLICY workspace_settings_select ON public.workspace_settings FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY workspace_settings_insert ON public.workspace_settings FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY workspace_settings_update ON public.workspace_settings FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY workspace_settings_delete ON public.workspace_settings FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- 7.6 workspace_layout
CREATE POLICY workspace_layout_select ON public.workspace_layout FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY workspace_layout_insert ON public.workspace_layout FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY workspace_layout_update ON public.workspace_layout FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY workspace_layout_delete ON public.workspace_layout FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- 7.7 clients
CREATE POLICY clients_select ON public.clients FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY clients_insert ON public.clients FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY clients_update ON public.clients FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY clients_delete ON public.clients FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- 7.8 budgets
CREATE POLICY budgets_select ON public.budgets FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY budgets_insert ON public.budgets FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY budgets_update ON public.budgets FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY budgets_delete ON public.budgets FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- 7.9 budget_versions
CREATE POLICY budget_versions_select ON public.budget_versions FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY budget_versions_insert ON public.budget_versions FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY budget_versions_update ON public.budget_versions FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY budget_versions_delete ON public.budget_versions FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- 7.10 prospection_leads
CREATE POLICY leads_select ON public.prospection_leads FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY leads_insert ON public.prospection_leads FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY leads_update ON public.prospection_leads FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY leads_delete ON public.prospection_leads FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- 7.11 kanban_columns
CREATE POLICY kanban_columns_select ON public.kanban_columns FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY kanban_columns_insert ON public.kanban_columns FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY kanban_columns_update ON public.kanban_columns FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY kanban_columns_delete ON public.kanban_columns FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- 7.12 project_columns
CREATE POLICY project_columns_select ON public.project_columns FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY project_columns_insert ON public.project_columns FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY project_columns_update ON public.project_columns FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY project_columns_delete ON public.project_columns FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- 7.13 project_cards
CREATE POLICY project_cards_select ON public.project_cards FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY project_cards_insert ON public.project_cards FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY project_cards_update ON public.project_cards FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY project_cards_delete ON public.project_cards FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- 7.14 service_categories
CREATE POLICY service_categories_select ON public.service_categories FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY service_categories_insert ON public.service_categories FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY service_categories_update ON public.service_categories FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY service_categories_delete ON public.service_categories FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- 7.15 service_objectives
CREATE POLICY service_objectives_select ON public.service_objectives FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY service_objectives_insert ON public.service_objectives FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY service_objectives_update ON public.service_objectives FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY service_objectives_delete ON public.service_objectives FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- 7.16 service_items
CREATE POLICY service_items_select ON public.service_items FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY service_items_insert ON public.service_items FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY service_items_update ON public.service_items FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY service_items_delete ON public.service_items FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- 7.17 payment_terms
CREATE POLICY payment_terms_select ON public.payment_terms FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY payment_terms_insert ON public.payment_terms FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY payment_terms_update ON public.payment_terms FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY payment_terms_delete ON public.payment_terms FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- 7.18 score_history (sem UPDATE — intencional)
CREATE POLICY score_history_select ON public.score_history FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY score_history_insert ON public.score_history FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY score_history_delete ON public.score_history FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- 7.19 assets
CREATE POLICY assets_select ON public.assets FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY assets_insert ON public.assets FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY assets_update ON public.assets FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY assets_delete ON public.assets FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- 7.20 hard_drives
CREATE POLICY hard_drives_select ON public.hard_drives FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY hard_drives_insert ON public.hard_drives FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY hard_drives_update ON public.hard_drives FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY hard_drives_delete ON public.hard_drives FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- 7.21 legacy_projects
CREATE POLICY legacy_projects_select ON public.legacy_projects FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY legacy_projects_insert ON public.legacy_projects FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY legacy_projects_update ON public.legacy_projects FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY legacy_projects_delete ON public.legacy_projects FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- 7.22 monthly_goals (write restrito a owner)
CREATE POLICY monthly_goals_select ON public.monthly_goals FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY monthly_goals_insert ON public.monthly_goals FOR INSERT TO authenticated
  WITH CHECK (
    has_workspace_access(auth.uid(), workspace_id)
    AND get_user_role(auth.uid()) = 'owner'::app_role
  );
CREATE POLICY monthly_goals_update ON public.monthly_goals FOR UPDATE TO authenticated
  USING (
    has_workspace_access(auth.uid(), workspace_id)
    AND get_user_role(auth.uid()) = 'owner'::app_role
  );
CREATE POLICY monthly_goals_delete ON public.monthly_goals FOR DELETE TO authenticated
  USING (
    has_workspace_access(auth.uid(), workspace_id)
    AND get_user_role(auth.uid()) = 'owner'::app_role
  );

-- 7.23 landing_leads (pública para INSERT, SELECT para authenticated)
CREATE POLICY anyone_can_insert_landing_leads ON public.landing_leads FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY authenticated_can_select_landing_leads ON public.landing_leads FOR SELECT TO authenticated
  USING (true);


-- ============================================================================
-- 8. ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace_id ON public.workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_email ON public.workspace_invites(email);
CREATE INDEX IF NOT EXISTS idx_clients_workspace_id ON public.clients(workspace_id);
CREATE INDEX IF NOT EXISTS idx_budgets_workspace_id ON public.budgets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_budgets_client_id ON public.budgets(client_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);
CREATE INDEX IF NOT EXISTS idx_budget_versions_budget_id ON public.budget_versions(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_versions_workspace_id ON public.budget_versions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_prospection_leads_workspace_id ON public.prospection_leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_workspace_id ON public.kanban_columns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_project_columns_workspace_id ON public.project_columns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_project_cards_workspace_id ON public.project_cards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_project_cards_budget_id ON public.project_cards(budget_id);
CREATE INDEX IF NOT EXISTS idx_service_categories_workspace_id ON public.service_categories(workspace_id);
CREATE INDEX IF NOT EXISTS idx_service_objectives_workspace_id ON public.service_objectives(workspace_id);
CREATE INDEX IF NOT EXISTS idx_service_items_workspace_id ON public.service_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_payment_terms_workspace_id ON public.payment_terms(workspace_id);
CREATE INDEX IF NOT EXISTS idx_score_history_workspace_id ON public.score_history(workspace_id);
CREATE INDEX IF NOT EXISTS idx_score_history_client_id ON public.score_history(client_id);
CREATE INDEX IF NOT EXISTS idx_monthly_goals_workspace_id ON public.monthly_goals(workspace_id);


-- ============================================================================
-- 9. STORAGE BUCKETS + POLICIES
-- ============================================================================
-- NOTA: Se os comandos abaixo falharem no SQL Editor, crie os buckets manualmente:
--   Storage → New Bucket → "avatars" (público)
--   Storage → New Bucket → "logos" (público)

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT (id) DO NOTHING;

-- Policies para avatars
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');
CREATE POLICY "avatars_auth_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "avatars_auth_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars');
CREATE POLICY "avatars_auth_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars');

-- Policies para logos
CREATE POLICY "logos_public_read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'logos');
CREATE POLICY "logos_auth_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');
CREATE POLICY "logos_auth_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'logos');
CREATE POLICY "logos_auth_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'logos');


-- ============================================================================
-- 10. CHECKLIST DE VALIDAÇÃO PÓS-EXECUÇÃO
-- ============================================================================
-- Execute as queries abaixo individualmente para validar a migração:

-- Enum (deve retornar 4 valores: owner, admin, vendedor, visualizador):
-- SELECT unnest(enum_range(NULL::app_role));

-- Tabelas (deve retornar 23):
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- RLS ativo em todas (deve retornar 0 linhas):
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;

-- Policies (deve retornar ~88):
-- SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';

-- Funções (deve retornar 8):
-- SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public';

-- Trigger handle_new_user (deve retornar 1 linha):
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

-- Storage buckets (deve retornar 2 linhas com public = true):
-- SELECT id, public FROM storage.buckets WHERE id IN ('avatars', 'logos');
