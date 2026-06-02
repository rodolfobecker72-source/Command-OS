// Callback OAuth do Google. Recebe ?code & ?state, troca por tokens e salva em user_google_tokens.
// Esta função é chamada pelo navegador via redirect → precisa ser pública (verify_jwt=false).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function htmlResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
}

function closeWindowPage(message: string, ok: boolean) {
  const color = ok ? "#16a34a" : "#dc2626";
  return htmlResponse(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Google Calendar</title>
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc;color:#0f172a}
.box{max-width:420px;padding:24px;text-align:center;background:white;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
.dot{width:48px;height:48px;border-radius:50%;background:${color};margin:0 auto 16px;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:bold}</style>
</head><body><div class="box"><div class="dot">${ok ? "✓" : "!"}</div><h2>${message}</h2>
<p style="color:#64748b">Você pode fechar esta janela.</p></div>
<script>setTimeout(()=>{try{window.close()}catch(e){}},1500)</script>
</body></html>`, ok ? 200 : 400);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) return closeWindowPage(`Autorização recusada: ${error}`, false);
    if (!code || !state) return closeWindowPage("Parâmetros inválidos.", false);

    let parsedState: { uid: string; r: string; t: number };
    try {
      parsedState = JSON.parse(atob(state));
    } catch {
      return closeWindowPage("State inválido.", false);
    }

    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
    if (!clientId || !clientSecret) return closeWindowPage("Credenciais OAuth não configuradas.", false);

    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar-oauth-callback`;

    // Trocar code por tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("[oauth-callback] token error", tokenJson);
      return closeWindowPage(`Erro ao obter tokens: ${tokenJson.error_description || tokenJson.error}`, false);
    }

    const accessToken = tokenJson.access_token as string;
    const refreshToken = tokenJson.refresh_token as string | undefined;
    const expiresIn = tokenJson.expires_in as number;
    const scope = tokenJson.scope as string;

    // Buscar e-mail
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userInfo = await userInfoRes.json();
    const googleEmail = userInfo.email ?? "";

    // Salvar (service role para bypass RLS, já validamos uid via state)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Buscar workspace
    const { data: member } = await admin
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", parsedState.uid)
      .limit(1)
      .maybeSingle();
    if (!member) return closeWindowPage("Workspace não encontrado.", false);

    // Se não veio refresh_token (já autorizou antes), preservar o existente
    const existing = await admin
      .from("user_google_tokens")
      .select("refresh_token")
      .eq("user_id", parsedState.uid)
      .maybeSingle();

    const finalRefreshToken = refreshToken || existing.data?.refresh_token;
    if (!finalRefreshToken) {
      return closeWindowPage("Refresh token não recebido. Tente novamente e autorize acesso offline.", false);
    }

    const expiresAt = new Date(Date.now() + (expiresIn - 60) * 1000).toISOString();

    const { error: upsertErr } = await admin
      .from("user_google_tokens")
      .upsert({
        user_id: parsedState.uid,
        workspace_id: member.workspace_id,
        google_email: googleEmail,
        access_token: accessToken,
        refresh_token: finalRefreshToken,
        expires_at: expiresAt,
        scope,
      }, { onConflict: "user_id" });

    if (upsertErr) {
      console.error("[oauth-callback] upsert error", upsertErr);
      return closeWindowPage("Erro ao salvar tokens.", false);
    }

    return closeWindowPage(`Conectado como ${googleEmail}`, true);
  } catch (e) {
    console.error("[oauth-callback] error", e);
    return closeWindowPage("Erro inesperado.", false);
  }
});
