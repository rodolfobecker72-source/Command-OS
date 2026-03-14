
-- Create workspace_layout table
CREATE TABLE public.workspace_layout (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  logo_url text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id)
);

ALTER TABLE public.workspace_layout ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "workspace_layout_select" ON public.workspace_layout
  FOR SELECT TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "workspace_layout_insert" ON public.workspace_layout
  FOR INSERT TO authenticated
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "workspace_layout_update" ON public.workspace_layout
  FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "workspace_layout_delete" ON public.workspace_layout
  FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id));

-- Updated_at trigger
CREATE TRIGGER update_workspace_layout_updated_at
  BEFORE UPDATE ON public.workspace_layout
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create logos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Storage RLS: authenticated users in workspace can upload
CREATE POLICY "logos_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');

CREATE POLICY "logos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'logos');

CREATE POLICY "logos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'logos');

CREATE POLICY "logos_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'logos');
