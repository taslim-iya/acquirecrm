import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const entityType = formData.get("entity_type") as string; // "companies" or "contacts"

    if (!file) throw new Error("No file provided");

    let rawText = "";
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".csv") || fileName.endsWith(".txt")) {
      rawText = await file.text();
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      // Read as base64 for AI to interpret the structure
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // Parse CSV-like from xlsx by reading raw text (simplified)
      // For xlsx we'll send raw bytes description + let AI parse headers
      const decoder = new TextDecoder("utf-8", { fatal: false });
      rawText = decoder.decode(bytes);
      // Filter out binary noise, keep printable chars
      rawText = rawText.replace(/[^\\x20-\\x7E\\n\\r\\t]/g, " ").replace(/\s{3,}/g, " | ");
      if (rawText.length > 15000) rawText = rawText.substring(0, 15000);
    } else if (fileName.endsWith(".pdf")) {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const decoder = new TextDecoder("utf-8", { fatal: false });
      rawText = decoder.decode(bytes);
      rawText = rawText.replace(/[^\\x20-\\x7E\\n\\r\\t]/g, " ").replace(/\s{3,}/g, " | ");
      if (rawText.length > 15000) rawText = rawText.substring(0, 15000);
    } else {
      rawText = await file.text();
    }

    if (!rawText.trim()) {
      throw new Error("Could not extract text from file. For Excel/PDF files, try saving as CSV first.");
    }

    const systemPrompt = entityType === "companies"
      ? `You extract company data from documents. Return a JSON array of companies.\nEach company object should have these fields (use null for missing):\n- name (string, required)\n- industry (string)\n- geography (string)  \n- website (string)\n- description (string)\n- sic_code (string)\n- naics_code (string)\n- ownership_type (string: private, family-owned, pe-backed, public, founder-led, estate, unknown)\n- revenue_band (string: <$1M, $1-5M, $5-10M, $10-25M, $25-50M, $50-100M, $100M+)\n- ebitda_band (string: <$500K, $500K-1M, $1-3M, $3-5M, $5-10M, $10M+)\n- employee_count (number)\n- company_status (string: prospect, researching, contacted, engaged, passed, archived)\n- company_source (string)\n- company_tags (array of strings)\nReturn ONLY valid JSON array, no markdown.`
      : `You extract contact/person data from documents. Return a JSON array of contacts.\nEach contact object should have these fields (use null for missing):\n- name (string, required)\n- email (string)\n- phone (string)\n- organization (string)\n- role (string)\n- geography (string)\n- source (string)\n- contact_type (string: investor, owner, intermediary, advisor, river_guide)\n- tags (array of strings)\n- notes (string)\nReturn ONLY valid JSON array, no markdown.`;

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
          { role: "user", content: `Parse the following document and extract all ${entityType} data:\n\n${rawText}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error("AI parsing failed");
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "[]";
    
    // Try to parse JSON from the response
    let parsed;
    try {
      // Strip markdown code fences if present
      const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("AI returned invalid format. Try a cleaner CSV file.");
    }

    if (!Array.isArray(parsed)) {
      parsed = [parsed];
    }

    return new Response(JSON.stringify({ records: parsed, count: parsed.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-import error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
