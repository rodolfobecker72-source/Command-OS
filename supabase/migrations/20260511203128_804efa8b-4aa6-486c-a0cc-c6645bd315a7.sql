ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS inactive_reason text NOT NULL DEFAULT '';