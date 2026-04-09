
ALTER TABLE public.cashflow_entries
  ADD COLUMN is_future_payment BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN payment_due_date DATE,
  ADD COLUMN is_paid BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;
