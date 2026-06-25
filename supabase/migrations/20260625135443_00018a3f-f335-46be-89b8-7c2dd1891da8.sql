
DO $$ BEGIN
  CREATE TYPE public.app_section AS ENUM (
    'dashboard','deals','contacts','investors','cap_table',
    'brokers','target_universe','documents','analytics','admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_section_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section public.app_section NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, section)
);

GRANT SELECT ON public.user_section_access TO authenticated;
GRANT ALL ON public.user_section_access TO service_role;

ALTER TABLE public.user_section_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own section access" ON public.user_section_access;
CREATE POLICY "Users can view their own section access"
  ON public.user_section_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage section access" ON public.user_section_access;
CREATE POLICY "Admins manage section access"
  ON public.user_section_access FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.has_section_access(_user_id uuid, _section public.app_section)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin')
      OR EXISTS (SELECT 1 FROM public.user_section_access WHERE user_id = _user_id AND section = _section);
$$;

DROP FUNCTION IF EXISTS public.admin_list_team_members();
CREATE FUNCTION public.admin_list_team_members()
RETURNS TABLE(user_id uuid, email text, display_name text, roles text[], modes text[], sections text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    u.id,
    u.email::text,
    p.display_name,
    COALESCE((SELECT array_agg(ur.role::text) FROM public.user_roles ur WHERE ur.user_id = u.id), '{}'),
    COALESCE((SELECT array_agg(uma.mode::text) FROM public.user_mode_access uma WHERE uma.user_id = u.id), '{}'),
    COALESCE((SELECT array_agg(usa.section::text) FROM public.user_section_access usa WHERE usa.user_id = u.id), '{}')
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY u.email;
$$;

ALTER TABLE public.contacts        ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.deals           ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.investor_deals  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.companies       ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.brokers         ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.documents       ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.tasks           ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.notes           ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS contacts_deleted_at_idx       ON public.contacts (deleted_at);
CREATE INDEX IF NOT EXISTS deals_deleted_at_idx          ON public.deals (deleted_at);
CREATE INDEX IF NOT EXISTS investor_deals_deleted_at_idx ON public.investor_deals (deleted_at);
CREATE INDEX IF NOT EXISTS companies_deleted_at_idx      ON public.companies (deleted_at);
CREATE INDEX IF NOT EXISTS brokers_deleted_at_idx        ON public.brokers (deleted_at);
CREATE INDEX IF NOT EXISTS documents_deleted_at_idx      ON public.documents (deleted_at);
CREATE INDEX IF NOT EXISTS tasks_deleted_at_idx          ON public.tasks (deleted_at);
CREATE INDEX IF NOT EXISTS notes_deleted_at_idx          ON public.notes (deleted_at);
