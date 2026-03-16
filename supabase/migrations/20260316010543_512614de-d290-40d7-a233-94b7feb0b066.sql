
CREATE TABLE public.monthly_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  month text NOT NULL DEFAULT '',
  value numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, month)
);

ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;

-- All authenticated workspace members can READ goals (for dashboard)
CREATE POLICY "monthly_goals_select" ON public.monthly_goals
  FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- Only owner can INSERT
CREATE POLICY "monthly_goals_insert" ON public.monthly_goals
  FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) = 'owner'::app_role);

-- Only owner can UPDATE
CREATE POLICY "monthly_goals_update" ON public.monthly_goals
  FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) = 'owner'::app_role);

-- Only owner can DELETE
CREATE POLICY "monthly_goals_delete" ON public.monthly_goals
  FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) = 'owner'::app_role);
