
-- Email open tracking columns
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS open_count integer DEFAULT 0;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS first_opened_at timestamp with time zone;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS last_opened_at timestamp with time zone;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS tracking_id uuid DEFAULT gen_random_uuid();

-- Create index on tracking_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_emails_tracking_id ON public.emails(tracking_id);

-- Investor updates table for monthly letters
CREATE TABLE public.investor_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  sent_at timestamp with time zone,
  recipient_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.investor_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own updates" ON public.investor_updates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own updates" ON public.investor_updates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own updates" ON public.investor_updates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own updates" ON public.investor_updates FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_investor_updates_updated_at BEFORE UPDATE ON public.investor_updates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User activity log for admin analytics
CREATE TABLE public.user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity" ON public.user_activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activity" ON public.user_activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_activity_log_created ON public.user_activity_log(created_at DESC);
CREATE INDEX idx_user_activity_log_event ON public.user_activity_log(event_type);
