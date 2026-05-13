CREATE TABLE public.project_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  project_card_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'nao_iniciado',
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_activities_card ON public.project_activities(project_card_id);
CREATE INDEX idx_project_activities_workspace ON public.project_activities(workspace_id);

ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_activities_select" ON public.project_activities
  FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "project_activities_insert" ON public.project_activities
  FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "project_activities_update" ON public.project_activities
  FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "project_activities_delete" ON public.project_activities
  FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

CREATE TRIGGER update_project_activities_updated_at
  BEFORE UPDATE ON public.project_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();