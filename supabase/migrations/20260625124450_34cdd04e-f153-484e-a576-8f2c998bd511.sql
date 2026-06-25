
-- 1. contacts.company_id
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id);

-- 2. companies.sic_codes (multi)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS sic_codes text[] DEFAULT '{}'::text[];

-- 3. mlp manual score
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS mlp_score integer;
ALTER TABLE public.investor_deals ADD COLUMN IF NOT EXISTS mlp_score integer;

-- 4. activities.deal_id (for deal-level activity logging)
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON public.activities(deal_id);

-- 5. deal_advisers join table
CREATE TYPE public.adviser_role AS ENUM ('legal', 'financial', 'tax', 'commercial', 'other');

CREATE TABLE public.deal_advisers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  role public.adviser_role NOT NULL DEFAULT 'other',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deal_id, contact_id, role)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_advisers TO authenticated;
GRANT ALL ON public.deal_advisers TO service_role;

ALTER TABLE public.deal_advisers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own deal advisers" ON public.deal_advisers
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own deal advisers" ON public.deal_advisers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own deal advisers" ON public.deal_advisers
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users delete own deal advisers" ON public.deal_advisers
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_deal_advisers_deal_id ON public.deal_advisers(deal_id);
CREATE INDEX idx_deal_advisers_contact_id ON public.deal_advisers(contact_id);

CREATE TRIGGER trg_deal_advisers_updated_at
  BEFORE UPDATE ON public.deal_advisers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Backfill: auto-create companies from contacts.organization, link contacts
DO $$
DECLARE
  rec RECORD;
  new_company_id uuid;
BEGIN
  FOR rec IN
    SELECT DISTINCT c.user_id, TRIM(c.organization) AS org_name
    FROM public.contacts c
    WHERE c.organization IS NOT NULL
      AND TRIM(c.organization) <> ''
      AND c.company_id IS NULL
  LOOP
    -- Try existing company (case-insensitive, per-user)
    SELECT id INTO new_company_id
    FROM public.companies
    WHERE user_id = rec.user_id
      AND LOWER(TRIM(name)) = LOWER(rec.org_name)
    LIMIT 1;

    -- Otherwise create
    IF new_company_id IS NULL THEN
      INSERT INTO public.companies (user_id, name, company_source)
      VALUES (rec.user_id, rec.org_name, 'backfill')
      RETURNING id INTO new_company_id;
    END IF;

    UPDATE public.contacts
    SET company_id = new_company_id
    WHERE user_id = rec.user_id
      AND LOWER(TRIM(organization)) = LOWER(rec.org_name)
      AND company_id IS NULL;
  END LOOP;
END $$;
