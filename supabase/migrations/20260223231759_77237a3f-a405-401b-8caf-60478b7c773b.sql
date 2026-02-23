
-- ============= PHASE 3: Budgets =============

CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  proposal_id TEXT NOT NULL DEFAULT '',
  project_name TEXT NOT NULL DEFAULT '',
  project_description TEXT NOT NULL DEFAULT '',
  client_id UUID NOT NULL,
  service_type TEXT NOT NULL DEFAULT '',
  objective TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  payment_terms TEXT NOT NULL DEFAULT '',
  includes_tax BOOLEAN NOT NULL DEFAULT false,
  includes_logistics BOOLEAN NOT NULL DEFAULT false,
  includes_accommodation BOOLEAN NOT NULL DEFAULT false,
  includes_meals BOOLEAN NOT NULL DEFAULT false,
  includes_raw_material BOOLEAN NOT NULL DEFAULT false,
  has_execution_date BOOLEAN NOT NULL DEFAULT false,
  execution_start_date TIMESTAMPTZ,
  execution_end_date TIMESTAMPTZ,
  location TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'oportunidade_mapeada',
  current_version INTEGER NOT NULL DEFAULT 0,
  approved_version INTEGER,
  approval_date TIMESTAMPTZ,
  final_value NUMERIC,
  contract_url TEXT,
  nf_url TEXT,
  execution JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view budgets" ON public.budgets FOR SELECT USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert budgets" ON public.budgets FOR INSERT WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update budgets" ON public.budgets FOR UPDATE USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete budgets" ON public.budgets FOR DELETE USING (has_workspace_access(auth.uid(), workspace_id));

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Budget Versions
CREATE TABLE public.budget_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  operational_costs JSONB NOT NULL DEFAULT '[]'::jsonb,
  costs JSONB NOT NULL DEFAULT '[]'::jsonb,
  production_cost NUMERIC NOT NULL DEFAULT 0,
  fixed_cost_percentage NUMERIC NOT NULL DEFAULT 20,
  nf_cost_percentage NUMERIC NOT NULL DEFAULT 13,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  full_price NUMERIC NOT NULL DEFAULT 0,
  discount4_price NUMERIC NOT NULL DEFAULT 0,
  discount5_price NUMERIC NOT NULL DEFAULT 0,
  margin NUMERIC NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT '',
  is_rejected BOOLEAN NOT NULL DEFAULT false,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view budget_versions" ON public.budget_versions FOR SELECT USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert budget_versions" ON public.budget_versions FOR INSERT WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update budget_versions" ON public.budget_versions FOR UPDATE USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete budget_versions" ON public.budget_versions FOR DELETE USING (has_workspace_access(auth.uid(), workspace_id));

-- ============= PHASE 4: Settings & Secondary Data =============

-- Kanban Columns
CREATE TABLE public.kanban_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  key TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  "order" INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can view kanban_columns" ON public.kanban_columns FOR SELECT USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert kanban_columns" ON public.kanban_columns FOR INSERT WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update kanban_columns" ON public.kanban_columns FOR UPDATE USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete kanban_columns" ON public.kanban_columns FOR DELETE USING (has_workspace_access(auth.uid(), workspace_id));

-- Service Categories
CREATE TABLE public.service_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  key TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL DEFAULT '',
  "order" INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can view service_categories" ON public.service_categories FOR SELECT USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert service_categories" ON public.service_categories FOR INSERT WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update service_categories" ON public.service_categories FOR UPDATE USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete service_categories" ON public.service_categories FOR DELETE USING (has_workspace_access(auth.uid(), workspace_id));

-- Service Objectives
CREATE TABLE public.service_objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  category_key TEXT NOT NULL DEFAULT '',
  key TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL DEFAULT '',
  "order" INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.service_objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can view service_objectives" ON public.service_objectives FOR SELECT USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert service_objectives" ON public.service_objectives FOR INSERT WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update service_objectives" ON public.service_objectives FOR UPDATE USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete service_objectives" ON public.service_objectives FOR DELETE USING (has_workspace_access(auth.uid(), workspace_id));

-- Assets (Patrimônio)
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  value NUMERIC NOT NULL DEFAULT 0,
  serial_number TEXT NOT NULL DEFAULT '',
  hero_asset_number TEXT NOT NULL DEFAULT '',
  photo TEXT NOT NULL DEFAULT '',
  reference_link TEXT NOT NULL DEFAULT '',
  assigned_to TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can view assets" ON public.assets FOR SELECT USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert assets" ON public.assets FOR INSERT WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update assets" ON public.assets FOR UPDATE USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete assets" ON public.assets FOR DELETE USING (has_workspace_access(auth.uid(), workspace_id));

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Hard Drives
CREATE TABLE public.hard_drives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  label TEXT NOT NULL DEFAULT '',
  capacity_gb NUMERIC NOT NULL DEFAULT 0,
  projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hard_drives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can view hard_drives" ON public.hard_drives FOR SELECT USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert hard_drives" ON public.hard_drives FOR INSERT WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update hard_drives" ON public.hard_drives FOR UPDATE USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete hard_drives" ON public.hard_drives FOR DELETE USING (has_workspace_access(auth.uid(), workspace_id));

-- Legacy Projects
CREATE TABLE public.legacy_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  project_number TEXT NOT NULL DEFAULT '',
  client_id TEXT NOT NULL DEFAULT '',
  client_name TEXT NOT NULL DEFAULT '',
  size_gb NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.legacy_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can view legacy_projects" ON public.legacy_projects FOR SELECT USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert legacy_projects" ON public.legacy_projects FOR INSERT WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update legacy_projects" ON public.legacy_projects FOR UPDATE USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete legacy_projects" ON public.legacy_projects FOR DELETE USING (has_workspace_access(auth.uid(), workspace_id));

-- Project Columns
CREATE TABLE public.project_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  key TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  "order" INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.project_columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can view project_columns" ON public.project_columns FOR SELECT USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert project_columns" ON public.project_columns FOR INSERT WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update project_columns" ON public.project_columns FOR UPDATE USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete project_columns" ON public.project_columns FOR DELETE USING (has_workspace_access(auth.uid(), workspace_id));

-- Project Cards
CREATE TABLE public.project_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  budget_id UUID NOT NULL,
  proposal_id TEXT NOT NULL DEFAULT '',
  project_name TEXT NOT NULL DEFAULT '',
  client_name TEXT NOT NULL DEFAULT '',
  client_id TEXT NOT NULL DEFAULT '',
  service_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  objective TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planejamento',
  progress INTEGER NOT NULL DEFAULT 0,
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  links JSONB NOT NULL DEFAULT '[]'::jsonb,
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  material_link TEXT NOT NULL DEFAULT '',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can view project_cards" ON public.project_cards FOR SELECT USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert project_cards" ON public.project_cards FOR INSERT WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update project_cards" ON public.project_cards FOR UPDATE USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete project_cards" ON public.project_cards FOR DELETE USING (has_workspace_access(auth.uid(), workspace_id));

CREATE TRIGGER update_project_cards_updated_at BEFORE UPDATE ON public.project_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Score History
CREATE TABLE public.score_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  client_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  previous_score INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can view score_history" ON public.score_history FOR SELECT USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert score_history" ON public.score_history FOR INSERT WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete score_history" ON public.score_history FOR DELETE USING (has_workspace_access(auth.uid(), workspace_id));
