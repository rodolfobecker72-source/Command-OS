ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS legal_representative_name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS legal_representative_cpf TEXT NOT NULL DEFAULT '';