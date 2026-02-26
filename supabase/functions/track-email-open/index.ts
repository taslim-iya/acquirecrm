import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b,
]);

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get("t");

    if (trackingId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Update open tracking atomically
      const now = new Date().toISOString();
      await supabase.rpc("increment_email_open", { p_tracking_id: trackingId, p_now: now }).catch(() => {
        // Fallback: direct update if RPC doesn't exist yet
        return supabase
          .from("emails")
          .update({
            open_count: 1, // Will be incremented properly via RPC
            first_opened_at: now,
            last_opened_at: now,
          })
          .eq("tracking_id", trackingId)
          .is("first_opened_at", null);
      });

      // Also update for subsequent opens
      await supabase
        .from("emails")
        .update({ last_opened_at: now })
        .eq("tracking_id", trackingId);
    }
  } catch (e) {
    console.error("Track error:", e);
  }

  // Always return the pixel regardless of tracking success
  return new Response(TRACKING_PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
