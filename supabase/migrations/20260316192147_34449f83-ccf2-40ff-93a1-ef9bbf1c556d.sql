
CREATE TABLE public.landing_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  instagram TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_leads ENABLE ROW LEVEL SECURITY;

-- Public insert policy (no auth required for landing page)
CREATE POLICY "anyone_can_insert_landing_leads"
ON public.landing_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only authenticated workspace owners can read
CREATE POLICY "authenticated_can_select_landing_leads"
ON public.landing_leads
FOR SELECT
TO authenticated
USING (true);
