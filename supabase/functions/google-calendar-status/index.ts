// Returns { connected, email } for the current user's Google Calendar connection.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getConnectionStatus, jsonResponse, corsHeaders } from "../_shared/appUserConnector.ts";

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

    const status = await getConnectionStatus(userData.user.id);
    return jsonResponse(status);
  } catch (e) {
    console.error("[status]", e);
    return jsonResponse({ error: String(e), connected: false }, 200);
  }
});
