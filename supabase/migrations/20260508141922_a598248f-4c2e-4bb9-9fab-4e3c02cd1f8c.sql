
DELETE FROM public.project_columns
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY workspace_id, key ORDER BY id) AS rn
    FROM public.project_columns
  ) t WHERE rn > 1
);

ALTER TABLE public.project_columns
  ADD CONSTRAINT project_columns_workspace_key_unique UNIQUE (workspace_id, key);
