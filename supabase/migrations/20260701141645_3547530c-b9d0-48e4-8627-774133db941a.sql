INSERT INTO public.project_cards (workspace_id, budget_id, proposal_id, project_name, client_name, client_id, service_types, objective, status, progress, tasks, links, comments, material_link, notes)
SELECT b.workspace_id, b.id, b.proposal_id, b.project_name, COALESCE(c.company_name, 'Cliente'), b.client_id, '[]'::jsonb, COALESCE(b.objective,''), COALESCE((SELECT key FROM public.project_columns WHERE workspace_id = b.workspace_id ORDER BY "order" ASC LIMIT 1), 'planejamento'), 0, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '', ''
FROM public.budgets b LEFT JOIN public.clients c ON c.id = b.client_id
WHERE b.status = 'aprovada'
  AND NOT EXISTS (SELECT 1 FROM public.project_cards pc WHERE pc.budget_id = b.id);