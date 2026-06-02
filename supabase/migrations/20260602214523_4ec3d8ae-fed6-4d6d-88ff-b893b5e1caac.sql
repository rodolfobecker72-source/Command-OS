CREATE TABLE public.calendar_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  date date NOT NULL,
  content text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_notes TO authenticated;
GRANT ALL ON public.calendar_notes TO service_role;

ALTER TABLE public.calendar_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_notes_select_own"
ON public.calendar_notes FOR SELECT TO authenticated
USING (auth.uid() = user_id AND has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "calendar_notes_insert_own"
ON public.calendar_notes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "calendar_notes_update_own"
ON public.calendar_notes FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "calendar_notes_delete_own"
ON public.calendar_notes FOR DELETE TO authenticated
USING (auth.uid() = user_id AND has_workspace_access(auth.uid(), workspace_id));

CREATE INDEX idx_calendar_notes_user_date ON public.calendar_notes(user_id, date);

CREATE TRIGGER update_calendar_notes_updated_at
BEFORE UPDATE ON public.calendar_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();