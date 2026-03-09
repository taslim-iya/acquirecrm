
CREATE OR REPLACE FUNCTION public.admin_get_investor_reply_status()
RETURNS TABLE (
  investor_deal_id uuid,
  investor_name text,
  organization text,
  stage text,
  owner_user_id uuid,
  owner_email text,
  contact_email text,
  last_outbound_at timestamptz,
  first_inbound_after_outbound_at timestamptz,
  reply_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    id.id AS investor_deal_id,
    id.name AS investor_name,
    id.organization,
    id.stage::text,
    id.user_id AS owner_user_id,
    au.email AS owner_email,
    c.email AS contact_email,
    outbound.last_outbound_at,
    inbound.first_inbound_after_outbound_at,
    CASE
      WHEN outbound.last_outbound_at IS NULL THEN 'not_contacted'
      WHEN inbound.first_inbound_after_outbound_at IS NOT NULL THEN 'replied'
      ELSE 'pending'
    END AS reply_status
  FROM investor_deals id
  LEFT JOIN contacts c ON id.contact_id = c.id
  LEFT JOIN auth.users au ON id.user_id = au.id
  LEFT JOIN LATERAL (
    SELECT MAX(e.created_at) AS last_outbound_at
    FROM emails e
    WHERE e.user_id = id.user_id
      AND e.direction = 'outbound'
      AND (
        e.contact_id = id.contact_id
        OR (c.email IS NOT NULL AND c.email = ANY(e.to_emails))
      )
  ) outbound ON true
  LEFT JOIN LATERAL (
    SELECT MIN(e2.created_at) AS first_inbound_after_outbound_at
    FROM emails e2
    WHERE e2.user_id = id.user_id
      AND e2.direction = 'inbound'
      AND outbound.last_outbound_at IS NOT NULL
      AND e2.created_at > outbound.last_outbound_at
      AND (
        e2.contact_id = id.contact_id
        OR (c.email IS NOT NULL AND e2.from_email = c.email)
      )
  ) inbound ON true
  WHERE has_role(auth.uid(), 'admin')
  ORDER BY
    CASE
      WHEN outbound.last_outbound_at IS NULL THEN 3
      WHEN inbound.first_inbound_after_outbound_at IS NOT NULL THEN 2
      ELSE 1
    END,
    outbound.last_outbound_at DESC NULLS LAST;
$$;
