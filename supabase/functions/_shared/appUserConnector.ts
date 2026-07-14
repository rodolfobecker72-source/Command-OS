// Shared helper for Google Calendar App User Connector via Lovable connector gateway.
// Auth headers: Bearer LOVABLE_API_KEY + X-Connection-Api-Key (client key) + X-App-User-Id (per user).
const GATEWAY_BASE = "https://connector-gateway.lovable.dev";
export const CONNECTOR_ID = "google_calendar";

// Scopes we ask each end user to grant. userinfo.email lets us identify the connected Google account.
export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
];

function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function getGatewayCreds() {
  return {
    lovableKey: requireEnv("LOVABLE_API_KEY"),
    clientKey: requireEnv("GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY"),
  };
}

// Start the OAuth authorize flow. Returns the URL to open in a popup.
export async function startAuthorize(opts: {
  appUserId: string;
  returnUrl: string;
  scopes?: string[];
}): Promise<{ authorization_url: string; session_id: string }> {
  const { lovableKey, clientKey } = getGatewayCreds();
  const res = await fetch(`${GATEWAY_BASE}/api/v1/app-users/oauth2/authorize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Client-Api-Key": clientKey,
    },
    body: JSON.stringify({
      connector_id: CONNECTOR_ID,
      app_user_id: opts.appUserId,
      return_url: opts.returnUrl,
      credentials_configuration: {
        scopes: opts.scopes ?? GOOGLE_CALENDAR_SCOPES,
      },
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`authorize [${res.status}]: ${text}`);
  return JSON.parse(text);
}

// Call a Google Calendar API path as the given app user.
// path examples: "/calendar/v3/users/me/calendarList", "/calendar/v3/calendars/primary/events"
export async function callAsUser(opts: {
  appUserId: string;
  path: string;
  method?: string;
  body?: unknown;
  query?: Record<string, string>;
}): Promise<{ status: number; ok: boolean; data: any; text: string }> {
  const { lovableKey, clientKey } = getGatewayCreds();
  const url = new URL(`${GATEWAY_BASE}/${CONNECTOR_ID}${opts.path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    method: opts.method ?? "GET",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": clientKey,
      "X-App-User-Id": opts.appUserId,
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* keep null */ }
  return { status: res.status, ok: res.ok, data, text };
}

// Returns { connected, email } for the given app user.
export async function getConnectionStatus(appUserId: string): Promise<{ connected: boolean; email?: string }> {
  // userinfo endpoint is available under the same connector gateway for Google
  // (any Google API with granted scope goes through here). Try calendarList as
  // a light call; if it works, then fetch userinfo for the email.
  const list = await callAsUser({
    appUserId,
    path: "/calendar/v3/users/me/calendarList",
    query: { maxResults: "1" },
  });
  if (list.status === 401) return { connected: false };
  if (!list.ok) throw new Error(`status check failed [${list.status}]: ${list.text}`);

  // Best-effort fetch of the connected Google email via userinfo (uses userinfo.email scope).
  let email: string | undefined;
  const info = await callAsUser({
    appUserId,
    // userinfo lives on a different host; the gateway proxies /oauth2/v2/userinfo too.
    path: "/oauth2/v2/userinfo",
  });
  if (info.ok && info.data?.email) email = info.data.email;
  return { connected: true, email };
}

// Best-effort disconnect: tells the gateway to drop the user's credential.
export async function disconnectUser(appUserId: string): Promise<{ ok: boolean; status: number; text: string }> {
  const { lovableKey, clientKey } = getGatewayCreds();
  // Try the documented shape; if it doesn't exist yet, the caller can ignore the error.
  const res = await fetch(
    `${GATEWAY_BASE}/api/v1/app-users/connections?connector_id=${CONNECTOR_ID}&app_user_id=${encodeURIComponent(appUserId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Client-Api-Key": clientKey,
      },
    },
  );
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
