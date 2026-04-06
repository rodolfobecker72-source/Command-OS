CREATE TABLE public.workspace_contract_template (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id)
);

ALTER TABLE public.workspace_contract_template ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contract_template_select" ON public.workspace_contract_template
  FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "contract_template_insert" ON public.workspace_contract_template
  FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "contract_template_update" ON public.workspace_contract_template
  FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "contract_template_delete" ON public.workspace_contract_template
  FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));