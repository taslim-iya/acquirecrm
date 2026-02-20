-- Add scheduled send time and document attachment support to emails
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS scheduled_send_at TIMESTAMPTZ;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS send_status TEXT NOT NULL DEFAULT 'sent';
-- send_status: 'draft', 'scheduled', 'sent', 'failed'

-- Create email_attachments junction table
CREATE TABLE public.email_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their email attachments"
ON public.email_attachments FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.emails WHERE emails.id = email_attachments.email_id AND emails.user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.emails WHERE emails.id = email_attachments.email_id AND emails.user_id = auth.uid())
);