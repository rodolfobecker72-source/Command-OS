
-- Workspace settings for commercial rules
CREATE TABLE public.workspace_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  default_fixed_cost_percentage numeric NOT NULL DEFAULT 20,
  default_nf_percentage numeric NOT NULL DEFAULT 13,
  default_target_margin_percentage numeric NOT NULL DEFAULT 25,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id)
);

ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_settings_select" ON public.workspace_settings
  FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "workspace_settings_insert" ON public.workspace_settings
  FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "workspace_settings_update" ON public.workspace_settings
  FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "workspace_settings_delete" ON public.workspace_settings
  FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- Payment terms table
CREATE TABLE public.payment_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_terms_select" ON public.payment_terms
  FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "payment_terms_insert" ON public.payment_terms
  FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "payment_terms_update" ON public.payment_terms
  FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "payment_terms_delete" ON public.payment_terms
  FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));
