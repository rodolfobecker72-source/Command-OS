DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'budgets','budget_versions','kanban_columns','service_categories','service_items','service_objectives','payment_terms',
    'prospection_leads',
    'project_cards','project_activities','project_columns','legacy_projects',
    'clients','score_history',
    'cashflow_entries','financial_accounts','credit_cards','cost_centers','revenue_centers','assets','hard_drives',
    'appointments','calendar_notes','monthly_goals',
    'workspace_members','workspace_settings','workspace_layout','workspace_contract_template'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END $$;