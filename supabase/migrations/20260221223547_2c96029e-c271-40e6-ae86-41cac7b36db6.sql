
-- ============================================================
-- Deal Sourcing Data Model Extension
-- ============================================================

-- 1. Create deal sourcing stage enum
CREATE TYPE public.deal_sourcing_stage AS ENUM (
  'screening', 'contacted', 'teaser', 'cim', 'ioi', 'loi', 'dd', 'financing', 'signing', 'closed_won', 'lost'
);

-- 2. Extend companies table with deal sourcing fields
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS sic_code text,
  ADD COLUMN IF NOT EXISTS naics_code text,
  ADD COLUMN IF NOT EXISTS ownership_type text,
  ADD COLUMN IF NOT EXISTS revenue_band text,
  ADD COLUMN IF NOT EXISTS ebitda_band text,
  ADD COLUMN IF NOT EXISTS employee_count integer,
  ADD COLUMN IF NOT EXISTS company_status text DEFAULT 'prospect',
  ADD COLUMN IF NOT EXISTS company_source text,
  ADD COLUMN IF NOT EXISTS last_touched_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS company_tags text[] DEFAULT '{}';

-- 3. Create deals table (deal sourcing deals, separate from investor_deals)
CREATE TABLE public.deals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  broker_id uuid,
  name text NOT NULL,
  stage public.deal_sourcing_stage NOT NULL DEFAULT 'screening',
  probability integer,
  expected_close_date date,
  valuation_notes text,
  structure_notes text,
  next_step text,
  source text DEFAULT 'proprietary',
  deal_revenue numeric,
  deal_ebitda numeric,
  ebitda_margin numeric,
  recurring_rev_pct numeric,
  nwc_notes text,
  customer_concentration text,
  retention_proxy text,
  entry_multiple numeric,
  leverage_pct numeric,
  interest_rate numeric,
  exit_multiple numeric,
  hold_period integer DEFAULT 5,
  ebitda_growth numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deals" ON public.deals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own deals" ON public.deals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own deals" ON public.deals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own deals" ON public.deals FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create brokers table
CREATE TABLE public.brokers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  firm text NOT NULL,
  contact_name text NOT NULL,
  email text,
  phone text,
  coverage_sector text,
  coverage_geo text,
  responsiveness_score integer DEFAULT 3,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own brokers" ON public.brokers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own brokers" ON public.brokers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own brokers" ON public.brokers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own brokers" ON public.brokers FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_brokers_updated_at BEFORE UPDATE ON public.brokers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add FK from deals to brokers
ALTER TABLE public.deals ADD CONSTRAINT deals_broker_id_fkey FOREIGN KEY (broker_id) REFERENCES public.brokers(id) ON DELETE SET NULL;

-- 5. Create diligence_items table
CREATE TABLE public.diligence_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text DEFAULT 'general',
  status text DEFAULT 'pending',
  owner text,
  due_date date,
  doc_link text,
  comments text,
  stage_template text DEFAULT 'screen',
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.diligence_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own diligence items" ON public.diligence_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own diligence items" ON public.diligence_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own diligence items" ON public.diligence_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own diligence items" ON public.diligence_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_diligence_items_updated_at BEFORE UPDATE ON public.diligence_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Create request_items table
CREATE TABLE public.request_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  requested_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'pending',
  received_date date,
  file_path text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own request items" ON public.request_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own request items" ON public.request_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own request items" ON public.request_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own request items" ON public.request_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_request_items_updated_at BEFORE UPDATE ON public.request_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create ic_memos table
CREATE TABLE public.ic_memos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  thesis text,
  business_overview text,
  quality_assessment text,
  risks text,
  key_questions text,
  valuation_snapshot text,
  recommendation text DEFAULT 'hold',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ic_memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ic memos" ON public.ic_memos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ic memos" ON public.ic_memos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ic memos" ON public.ic_memos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ic memos" ON public.ic_memos FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_ic_memos_updated_at BEFORE UPDATE ON public.ic_memos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Create decision_log table
CREATE TABLE public.decision_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  decision_date date NOT NULL DEFAULT CURRENT_DATE,
  decision text NOT NULL DEFAULT 'hold',
  rationale text,
  next_action text,
  lessons_learned text,
  reason_codes text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.decision_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own decision log" ON public.decision_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own decision log" ON public.decision_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own decision log" ON public.decision_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own decision log" ON public.decision_log FOR DELETE USING (auth.uid() = user_id);

-- 9. Create saved_filters table
CREATE TABLE public.saved_filters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  filter_config jsonb NOT NULL DEFAULT '{}',
  entity_type text NOT NULL DEFAULT 'company',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved filters" ON public.saved_filters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own saved filters" ON public.saved_filters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own saved filters" ON public.saved_filters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved filters" ON public.saved_filters FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_saved_filters_updated_at BEFORE UPDATE ON public.saved_filters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
