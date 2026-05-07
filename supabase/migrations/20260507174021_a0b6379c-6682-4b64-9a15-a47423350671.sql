-- Create private bucket for budget documents (contracts and invoices)
INSERT INTO storage.buckets (id, name, public)
VALUES ('budget-documents', 'budget-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies: workspace members can manage files in their workspace folder
-- Path convention: {workspace_id}/{budget_id}/{type}-{filename}.pdf

CREATE POLICY "budget_docs_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'budget-documents'
  AND public.has_workspace_access(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "budget_docs_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'budget-documents'
  AND public.has_workspace_access(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "budget_docs_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'budget-documents'
  AND public.has_workspace_access(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "budget_docs_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'budget-documents'
  AND public.has_workspace_access(auth.uid(), ((storage.foldername(name))[1])::uuid)
);