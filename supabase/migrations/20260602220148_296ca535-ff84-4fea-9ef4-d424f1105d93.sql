
-- Tokens OAuth do Google por usuário
CREATE TABLE public.user_google_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  workspace_id UUID NOT NULL,
  google_email TEXT NOT NULL DEFAULT '',
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT NOT NULL DEFAULT '',
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_google_tokens TO authenticated;
GRANT ALL ON public.user_google_tokens TO service_role;

ALTER TABLE public.user_google_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ugt_select_own" ON public.user_google_tokens
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ugt_insert_own" ON public.user_google_tokens
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ugt_update_own" ON public.user_google_tokens
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ugt_delete_own" ON public.user_google_tokens
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_ugt_updated_at
  BEFORE UPDATE ON public.user_google_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mapeamento atividade -> evento do Google
CREATE TABLE public.google_calendar_sync_map (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  activity_id UUID NOT NULL,
  google_event_id TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, activity_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_calendar_sync_map TO authenticated;
GRANT ALL ON public.google_calendar_sync_map TO service_role;

ALTER TABLE public.google_calendar_sync_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gcsm_select_own" ON public.google_calendar_sync_map
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "gcsm_insert_own" ON public.google_calendar_sync_map
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gcsm_update_own" ON public.google_calendar_sync_map
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "gcsm_delete_own" ON public.google_calendar_sync_map
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_gcsm_activity ON public.google_calendar_sync_map(activity_id);
