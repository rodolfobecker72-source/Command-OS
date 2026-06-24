
-- Enum for appointment kind
DO $$ BEGIN
  CREATE TYPE public.appointment_kind AS ENUM ('reuniao', 'gravacao', 'entrega', 'visita', 'outro');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Appointments table
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  assigned_to uuid[] NOT NULL DEFAULT '{}',
  title text NOT NULL,
  kind public.appointment_kind NOT NULL DEFAULT 'reuniao',
  description text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  all_day boolean NOT NULL DEFAULT false,
  color text,
  budget_id uuid REFERENCES public.budgets(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.prospection_leads(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (public.has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can create appointments"
  ON public.appointments FOR INSERT
  TO authenticated
  WITH CHECK (public.has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can update appointments"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (public.has_workspace_access(auth.uid(), workspace_id))
  WITH CHECK (public.has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can delete appointments"
  ON public.appointments FOR DELETE
  TO authenticated
  USING (public.has_workspace_access(auth.uid(), workspace_id));

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX appointments_workspace_start_idx ON public.appointments(workspace_id, start_at);
CREATE INDEX appointments_budget_idx ON public.appointments(budget_id) WHERE budget_id IS NOT NULL;
CREATE INDEX appointments_lead_idx ON public.appointments(lead_id) WHERE lead_id IS NOT NULL;

-- Execution time fields on budgets
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS execution_start_time text,
  ADD COLUMN IF NOT EXISTS execution_end_time text;
