
CREATE TABLE public.financial_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  name text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'corrente',
  bank text NOT NULL DEFAULT '',
  agency text NOT NULL DEFAULT '',
  account_number text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_accounts_select" ON public.financial_accounts FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "financial_accounts_insert" ON public.financial_accounts FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "financial_accounts_update" ON public.financial_accounts FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "financial_accounts_delete" ON public.financial_accounts FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
