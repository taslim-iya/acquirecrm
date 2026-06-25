-- Companies: research/profile fields
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS research_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS thesis_problem text,
  ADD COLUMN IF NOT EXISTS thesis_why_now text,
  ADD COLUMN IF NOT EXISTS thesis_success text,
  ADD COLUMN IF NOT EXISTS thesis_kill_criteria text,
  ADD COLUMN IF NOT EXISTS peer_company_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS revenue numeric,
  ADD COLUMN IF NOT EXISTS employee_count int,
  ADD COLUMN IF NOT EXISTS hq_location text,
  ADD COLUMN IF NOT EXISTS founded_year int,
  ADD COLUMN IF NOT EXISTS website text;

CREATE INDEX IF NOT EXISTS companies_user_research_status_idx ON public.companies(user_id, research_status);
CREATE INDEX IF NOT EXISTS documents_company_id_idx ON public.documents(company_id);

-- Research sectors
CREATE TABLE IF NOT EXISTS public.research_sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  industry text NOT NULL,
  sic_codes text[] DEFAULT '{}',
  thesis_problem text,
  thesis_why_now text,
  thesis_success text,
  thesis_kill_criteria text,
  target_multiple numeric,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_sectors TO authenticated;
GRANT ALL ON public.research_sectors TO service_role;

ALTER TABLE public.research_sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sectors" ON public.research_sectors FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sectors" ON public.research_sectors FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sectors" ON public.research_sectors FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sectors" ON public.research_sectors FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_research_sectors_updated_at BEFORE UPDATE ON public.research_sectors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Research sources
CREATE TABLE IF NOT EXISTS public.research_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text,
  source_type text NOT NULL DEFAULT 'article',
  themes text[] DEFAULT '{}',
  summary text,
  sector_id uuid REFERENCES public.research_sectors(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_sources TO authenticated;
GRANT ALL ON public.research_sources TO service_role;

ALTER TABLE public.research_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sources" ON public.research_sources FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sources" ON public.research_sources FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sources" ON public.research_sources FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sources" ON public.research_sources FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_research_sources_updated_at BEFORE UPDATE ON public.research_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();