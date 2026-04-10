
ALTER TABLE public.cashflow_entries
ADD COLUMN credit_card_id uuid REFERENCES public.credit_cards(id) ON DELETE SET NULL DEFAULT NULL;

CREATE INDEX idx_cashflow_entries_credit_card ON public.cashflow_entries(credit_card_id) WHERE credit_card_id IS NOT NULL;
