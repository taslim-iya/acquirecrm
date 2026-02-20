
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS recurrence text,
  ADD COLUMN IF NOT EXISTS investor_deal_id uuid REFERENCES public.investor_deals(id) ON DELETE SET NULL;
