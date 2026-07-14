// Starts Google Calendar OAuth via the Lovable App User Connector gateway.
// Returns { url } to open in a popup.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { startAuthorize, jsonResponse, corsHeaders } from "../_shared/appUserConnector.ts";

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

    const body = await req.json().catch(() => ({}));
    const origin: string = body.origin || "https://herocommandcrm.lovable.app";
    const returnUrl = `${origin.replace(/\/$/, "")}/auth/google-calendar-callback`;

    const { authorization_url } = await startAuthorize({
      appUserId: userData.user.id,
      returnUrl,
    });
    return jsonResponse({ url: authorization_url });
  } catch (e) {
    console.error("[connect-init]", e);
    return jsonResponse({ error: String(e) }, 500);
  }
});
