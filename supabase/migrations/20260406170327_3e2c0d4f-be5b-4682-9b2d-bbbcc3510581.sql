ALTER TABLE public.budgets ADD COLUMN rejection_reason text NOT NULL DEFAULT '';
ALTER TABLE public.budgets ADD COLUMN rejection_observation text NOT NULL DEFAULT '';