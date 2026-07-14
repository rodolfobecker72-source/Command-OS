ALTER TABLE public.service_items ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY workspace_id, category_key ORDER BY name) AS rn
  FROM public.service_items
)
UPDATE public.service_items s SET sort_order = r.rn FROM ranked r WHERE s.id = r.id;