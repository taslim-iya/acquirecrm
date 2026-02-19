import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
  const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    console.error('Failed to refresh Microsoft token:', await response.text());
    return null;
  }

  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAnon.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: integration, error: integrationError } = await supabaseService
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'microsoft')
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      return new Response(JSON.stringify({ error: 'Microsoft integration not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let accessToken = integration.access_token;
    const tokenExpiry = new Date(integration.token_expires_at);

    if (tokenExpiry < new Date()) {
      const refreshed = await refreshAccessToken(integration.refresh_token);
      if (!refreshed) {
        return new Response(JSON.stringify({ error: 'Failed to refresh Microsoft token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      accessToken = refreshed.access_token;
      const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

      await supabaseService
        .from('user_integrations')
        .update({
          access_token: accessToken,
          token_expires_at: newExpiry,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);
    }

    // Fetch calendar events from Microsoft Graph
    const now = new Date().toISOString();
    const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const eventsResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${now}&endDateTime=${future}&$top=50&$orderby=start/dateTime&$select=id,subject,start,end,location,isAllDay,bodyPreview,onlineMeeting,webLink`,
      { headers: { Authorization: `Bearer ${accessToken}`, Prefer: 'outlook.timezone="UTC"' } }
    );

    if (!eventsResponse.ok) {
      console.error('Microsoft Calendar API error:', await eventsResponse.text());
      return new Response(JSON.stringify({ error: 'Failed to fetch calendar events' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const eventsData = await eventsResponse.json();
    const events = eventsData.value || [];

    let synced = 0;

    for (const event of events) {
      const eventData = {
        user_id: userId,
        external_id: event.id,
        external_provider: 'microsoft',
        title: event.subject || 'Untitled',
        start_time: event.start?.dateTime ? new Date(event.start.dateTime + 'Z').toISOString() : now,
        end_time: event.end?.dateTime ? new Date(event.end.dateTime + 'Z').toISOString() : now,
        all_day: event.isAllDay || false,
        description: event.bodyPreview || null,
        location: event.location?.displayName || null,
        meeting_link: event.onlineMeeting?.joinUrl || null,
        meeting_type: event.onlineMeeting ? 'teams' : null,
      };

      const { error } = await supabaseService
        .from('calendar_events')
        .upsert(eventData, { onConflict: 'user_id,external_id' });

      if (!error) synced++;
    }

    return new Response(JSON.stringify({ success: true, synced }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in sync-microsoft-calendar:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
