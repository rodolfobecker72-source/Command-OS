
-- Revenue Centers
CREATE TABLE public.revenue_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  name text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.revenue_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revenue_centers_select" ON public.revenue_centers FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "revenue_centers_insert" ON public.revenue_centers FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "revenue_centers_update" ON public.revenue_centers FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "revenue_centers_delete" ON public.revenue_centers FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- Cost Centers
CREATE TABLE public.cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  name text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cost_centers_select" ON public.cost_centers FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "cost_centers_insert" ON public.cost_centers FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "cost_centers_update" ON public.cost_centers FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "cost_centers_delete" ON public.cost_centers FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- Cashflow Entries
CREATE TABLE public.cashflow_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  type text NOT NULL DEFAULT 'receita',
  description text NOT NULL DEFAULT '',
  value numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  account_id uuid REFERENCES public.financial_accounts(id),
  budget_id uuid,
  revenue_center_id uuid REFERENCES public.revenue_centers(id),
  cost_center_id uuid REFERENCES public.cost_centers(id),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cashflow_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cashflow_entries_select" ON public.cashflow_entries FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "cashflow_entries_insert" ON public.cashflow_entries FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "cashflow_entries_update" ON public.cashflow_entries FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "cashflow_entries_delete" ON public.cashflow_entries FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
