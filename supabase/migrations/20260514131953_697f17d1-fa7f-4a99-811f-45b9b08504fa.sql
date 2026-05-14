ALTER TABLE public.project_activities
  ADD COLUMN IF NOT EXISTS assigned_to_user_ids uuid[] NOT NULL DEFAULT '{}';

UPDATE public.project_activities
SET assigned_to_user_ids = ARRAY[assigned_to_user_id]
WHERE assigned_to_user_id IS NOT NULL
  AND (assigned_to_user_ids IS NULL OR cardinality(assigned_to_user_ids) = 0);