
CREATE TYPE public.app_mode AS ENUM ('fundraising', 'deal-sourcing', 'research');

CREATE TABLE public.user_mode_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  mode public.app_mode NOT NULL,
  granted_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, mode)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_mode_access TO authenticated;
GRANT ALL ON public.user_mode_access TO service_role;

ALTER TABLE public.user_mode_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mode access"
  ON public.user_mode_access FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert mode access"
  ON public.user_mode_access FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete mode access"
  ON public.user_mode_access FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update mode access"
  ON public.user_mode_access FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Grant fundraising access to all existing users by default
INSERT INTO public.user_mode_access (user_id, mode)
SELECT id, 'fundraising'::public.app_mode FROM auth.users
ON CONFLICT (user_id, mode) DO NOTHING;

-- Admin lookup: list all users with their roles and granted modes
CREATE OR REPLACE FUNCTION public.admin_list_team_members()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  roles TEXT[],
  modes TEXT[]
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id AS user_id,
    u.email::text,
    p.display_name,
    COALESCE((SELECT array_agg(ur.role::text) FROM public.user_roles ur WHERE ur.user_id = u.id), '{}') AS roles,
    COALESCE((SELECT array_agg(uma.mode::text) FROM public.user_mode_access uma WHERE uma.user_id = u.id), '{}') AS modes
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY u.email;
$$;
