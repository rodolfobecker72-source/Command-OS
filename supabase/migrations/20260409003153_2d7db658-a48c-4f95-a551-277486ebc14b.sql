
CREATE TABLE public.credit_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT '',
  last_digits TEXT NOT NULL DEFAULT '',
  brand TEXT NOT NULL DEFAULT '',
  credit_limit NUMERIC NOT NULL DEFAULT 0,
  closing_day INTEGER NOT NULL DEFAULT 1,
  due_day INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_cards_select" ON public.credit_cards FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "credit_cards_insert" ON public.credit_cards FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "credit_cards_update" ON public.credit_cards FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "credit_cards_delete" ON public.credit_cards FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON public.credit_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
