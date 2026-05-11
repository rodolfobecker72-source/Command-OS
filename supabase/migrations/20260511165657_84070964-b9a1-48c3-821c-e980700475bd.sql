ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'equipamento',
ADD COLUMN IF NOT EXISTS needs_insurance boolean NOT NULL DEFAULT false;