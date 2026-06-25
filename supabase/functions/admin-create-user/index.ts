import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function genPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  const bytes = new Uint8Array(14);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += chars[b % chars.length];
  return out + '!7';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing auth' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify caller is admin
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userRes, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const callerId = userRes.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: callerId, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admins only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const { email, display_name, role, modes = [], sections = [] } = body as {
      email?: string; display_name?: string; role?: 'admin' | 'member' | 'intern';
      modes?: string[]; sections?: string[];
    };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const tempPassword = genPassword();

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: display_name ? { full_name: display_name } : undefined,
    });
    if (createErr || !created.user) {
      return new Response(JSON.stringify({ error: createErr?.message || 'Failed to create user' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const newUserId = created.user.id;

    if (role) {
      await admin.from('user_roles').insert({ user_id: newUserId, role });
    }
    if (modes.length) {
      await admin.from('user_mode_access').insert(modes.map((m) => ({ user_id: newUserId, mode: m })));
    }
    if (sections.length) {
      await admin.from('user_section_access').insert(sections.map((s) => ({ user_id: newUserId, section: s })));
    }

    return new Response(JSON.stringify({ user_id: newUserId, email, temp_password: tempPassword }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
