
-- ============= PHASE 1: CLIENTS =============
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT '',
  cnpj TEXT NOT NULL DEFAULT '',
  responsible_person TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  lead_origin TEXT NOT NULL DEFAULT 'indicacao',
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view clients"
  ON public.clients FOR SELECT
  USING (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can update clients"
  ON public.clients FOR UPDATE
  USING (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can delete clients"
  ON public.clients FOR DELETE
  USING (has_workspace_access(auth.uid(), workspace_id));

-- ============= PHASE 2: PROSPECTION LEADS =============
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

CREATE POLICY "Workspace members can view leads"
  ON public.prospection_leads FOR SELECT
  USING (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can insert leads"
  ON public.prospection_leads FOR INSERT
  WITH CHECK (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can update leads"
  ON public.prospection_leads FOR UPDATE
  USING (has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can delete leads"
  ON public.prospection_leads FOR DELETE
  USING (has_workspace_access(auth.uid(), workspace_id));

-- ============= UPDATED_AT TRIGGER =============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prospection_leads_updated_at
  BEFORE UPDATE ON public.prospection_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
