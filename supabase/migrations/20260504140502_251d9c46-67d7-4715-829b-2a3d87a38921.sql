-- Remove duplicates by ctid (keep one row per workspace_id+key)
DELETE FROM public.service_categories a
USING public.service_categories b
WHERE a.ctid > b.ctid
  AND a.workspace_id = b.workspace_id
  AND a.key = b.key;

ALTER TABLE public.service_categories
  ADD CONSTRAINT service_categories_workspace_key_unique UNIQUE (workspace_id, key);