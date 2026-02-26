import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error("Unauthorized");
    const userId = claimsData.claims.sub;

    const { custom_notes } = await req.json();

    // Fetch fundraising data
    const [investorsRes, profileRes, activitiesRes] = await Promise.all([
      supabase.from("investor_deals").select("*").order("updated_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(20),
    ]);

    const investors = investorsRes.data || [];
    const profile = profileRes.data;
    const activities = activitiesRes.data || [];

    // Calculate metrics
    const totalInvestors = investors.length;
    const committed = investors.filter(i => ["committed", "closed"].includes(i.stage));
    const totalCommitted = committed.reduce((sum, i) => sum + (i.commitment_amount || 0), 0);
    const meetingsScheduled = investors.filter(i => i.stage === "meeting_scheduled").length;
    const interested = investors.filter(i => i.stage === "interested").length;
    const fundraisingGoal = profile?.fundraising_goal || 1000000;
    const progressPct = fundraisingGoal > 0 ? Math.round((totalCommitted / fundraisingGoal) * 100) : 0;

    const stageBreakdown = {
      not_contacted: investors.filter(i => i.stage === "not_contacted").length,
      outreach_sent: investors.filter(i => i.stage === "outreach_sent").length,
      follow_up: investors.filter(i => i.stage === "follow_up").length,
      meeting_scheduled: meetingsScheduled,
      interested: interested,
      committed: committed.length,
    };

    const recentActivities = activities.slice(0, 10).map(a => `- ${a.title}`).join("\n");

    const systemPrompt = `You are a professional investor relations writer for a search fund. Write a concise, compelling monthly investor update letter. Use a professional but warm tone. Format in clean paragraphs with clear sections. Do NOT use markdown headers - use bold text sparingly. Keep it under 600 words.

The letter should include:
1. A brief greeting and overview
2. Fundraising progress highlights  
3. Pipeline activity summary
4. Key milestones or wins
5. Next steps / outlook
6. A professional sign-off

Company: ${profile?.company_name || "Our Search Fund"}
Sender: ${profile?.display_name || "The Team"}`;

    const userPrompt = `Generate a monthly investor update with these real metrics:

FUNDRAISING METRICS:
- Total investors in pipeline: ${totalInvestors}
- Capital committed: $${totalCommitted.toLocaleString()} of $${fundraisingGoal.toLocaleString()} goal (${progressPct}%)
- Meetings scheduled: ${meetingsScheduled}
- Interested investors: ${interested}
- Committed investors: ${committed.length}

PIPELINE BREAKDOWN:
${Object.entries(stageBreakdown).map(([k, v]) => `- ${k.replace(/_/g, " ")}: ${v}`).join("\n")}

RECENT ACTIVITIES:
${recentActivities || "No recent activities logged."}

${custom_notes ? `ADDITIONAL NOTES FROM SENDER:\n${custom_notes}` : ""}

Write the update letter now.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content, metrics: { totalInvestors, totalCommitted, progressPct, meetingsScheduled, interested, committed: committed.length } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-investor-update error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
