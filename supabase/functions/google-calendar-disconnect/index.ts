// Disconnect Google Calendar: revoke via connector gateway + wipe local sync map.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { disconnectUser, jsonResponse, corsHeaders } from "../_shared/appUserConnector.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return jsonResponse({ error: "unauthorized" }, 401);

    const gwResult = await disconnectUser(userData.user.id);
    // Log but do not fail — even if gateway disconnect isn't available, we still clear local maps.
    if (!gwResult.ok) console.warn("[disconnect] gateway", gwResult.status, gwResult.text);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await admin.from("google_calendar_sync_map").delete().eq("user_id", userData.user.id);

    return jsonResponse({ ok: true, gateway_status: gwResult.status });
  } catch (e) {
    console.error("[disconnect]", e);
    return jsonResponse({ error: String(e) }, 500);
  }
});
