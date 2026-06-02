// Sincroniza uma atividade de projeto com o Google Calendar dos responsáveis.
// Body: { activity_id: string, action: 'upsert' | 'delete' }
// Para cada responsável que tem user_google_tokens, faz create/update/delete no Google Calendar.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Renova access token usando refresh token. Retorna novo access_token.
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    console.error("[refresh] failed", await res.text());
    return null;
  }
  return await res.json();
}

async function getValidAccessToken(admin: any, userId: string): Promise<string | null> {
  const { data: row } = await admin
    .from("user_google_tokens")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!row) return null;

  const expiresAt = new Date(row.expires_at).getTime();
  if (expiresAt > Date.now() + 30_000) return row.access_token;

  const refreshed = await refreshAccessToken(row.refresh_token);
  if (!refreshed) return null;

  const newExpiresAt = new Date(Date.now() + (refreshed.expires_in - 60) * 1000).toISOString();
  await admin.from("user_google_tokens")
    .update({ access_token: refreshed.access_token, expires_at: newExpiresAt })
    .eq("user_id", userId);
  return refreshed.access_token;
}

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
    if (!userData.user) return json({ error: "unauthorized" }, 401);

    const body = await req.json();
    const activityId: string = body.activity_id;
    const action: "upsert" | "delete" = body.action ?? "upsert";
    if (!activityId) return json({ error: "activity_id required" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // === DELETE: remove eventos do Google e linhas do mapa ===
    if (action === "delete") {
      const { data: maps } = await admin
        .from("google_calendar_sync_map")
        .select("*")
        .eq("activity_id", activityId);

      for (const m of (maps ?? [])) {
        const token = await getValidAccessToken(admin, m.user_id);
        if (token) {
          await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${m.google_event_id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
      }
      await admin.from("google_calendar_sync_map").delete().eq("activity_id", activityId);
      return json({ ok: true, deleted: maps?.length ?? 0 });
    }

    // === UPSERT: buscar atividade + projeto ===
    const { data: activity, error: actErr } = await admin
      .from("project_activities")
      .select("*")
      .eq("id", activityId)
      .maybeSingle();
    if (actErr || !activity) return json({ error: "activity not found" }, 404);

    const { data: project } = await admin
      .from("project_cards")
      .select("project_name, client_name, proposal_id")
      .eq("id", activity.project_card_id)
      .maybeSingle();

    const assigneeIds: string[] = Array.isArray(activity.assigned_to_user_ids) && activity.assigned_to_user_ids.length > 0
      ? activity.assigned_to_user_ids
      : (activity.assigned_to_user_id ? [activity.assigned_to_user_id] : []);

    // Sem data ou sem responsáveis → nada para sincronizar; remove mapas existentes
    if (!activity.due_date || assigneeIds.length === 0) {
      const { data: existingMaps } = await admin
        .from("google_calendar_sync_map")
        .select("*")
        .eq("activity_id", activityId);
      for (const m of (existingMaps ?? [])) {
        const token = await getValidAccessToken(admin, m.user_id);
        if (token) {
          await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${m.google_event_id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
      }
      await admin.from("google_calendar_sync_map").delete().eq("activity_id", activityId);
      return json({ ok: true, skipped: "no due_date or no assignees" });
    }

    const projectLabel = project?.project_name || project?.proposal_id || "Projeto";
    const summary = `[${projectLabel}] ${activity.title}`;
    const description = [
      activity.title,
      project?.client_name ? `Cliente: ${project.client_name}` : null,
      project?.proposal_id ? `Proposta: ${project.proposal_id}` : null,
      `Status: ${activity.status}`,
    ].filter(Boolean).join("\n");

    const eventBody = {
      summary,
      description,
      start: { date: activity.due_date },
      end: { date: activity.due_date },
      source: { title: "Hero Command", url: "https://command.hero.rec.br" },
    };

    // Para cada responsável conectado, upsert do evento
    const results: Array<{ user_id: string; status: string; error?: string }> = [];

    // Pegar mapas existentes para essa atividade
    const { data: existingMaps } = await admin
      .from("google_calendar_sync_map")
      .select("*")
      .eq("activity_id", activityId);
    const existingByUser = new Map((existingMaps ?? []).map((m: any) => [m.user_id, m]));

    // Deletar do Google os usuários que não são mais responsáveis
    for (const m of (existingMaps ?? [])) {
      if (!assigneeIds.includes(m.user_id)) {
        const token = await getValidAccessToken(admin, m.user_id);
        if (token) {
          await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${m.google_event_id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
        await admin.from("google_calendar_sync_map").delete().eq("id", m.id);
      }
    }

    for (const uid of assigneeIds) {
      const token = await getValidAccessToken(admin, uid);
      if (!token) {
        results.push({ user_id: uid, status: "not_connected" });
        continue;
      }

      const existing = existingByUser.get(uid);
      try {
        if (existing) {
          // Update
          const res = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${existing.google_event_id}`,
            {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify(eventBody),
            },
          );
          if (!res.ok) {
            const txt = await res.text();
            // Se evento foi deletado no Google, recria
            if (res.status === 404 || res.status === 410) {
              const createRes = await fetch(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                  body: JSON.stringify(eventBody),
                },
              );
              const created = await createRes.json();
              if (createRes.ok) {
                await admin.from("google_calendar_sync_map")
                  .update({ google_event_id: created.id, last_synced_at: new Date().toISOString() })
                  .eq("id", existing.id);
                results.push({ user_id: uid, status: "recreated" });
              } else {
                results.push({ user_id: uid, status: "error", error: JSON.stringify(created) });
              }
            } else {
              results.push({ user_id: uid, status: "error", error: txt });
            }
          } else {
            await admin.from("google_calendar_sync_map")
              .update({ last_synced_at: new Date().toISOString() })
              .eq("id", existing.id);
            results.push({ user_id: uid, status: "updated" });
          }
        } else {
          // Create
          const { data: ugt } = await admin
            .from("user_google_tokens")
            .select("workspace_id")
            .eq("user_id", uid)
            .maybeSingle();
          const createRes = await fetch(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify(eventBody),
            },
          );
          const created = await createRes.json();
          if (createRes.ok) {
            await admin.from("google_calendar_sync_map").insert({
              user_id: uid,
              workspace_id: ugt?.workspace_id ?? activity.workspace_id,
              activity_id: activityId,
              google_event_id: created.id,
            });
            results.push({ user_id: uid, status: "created" });
          } else {
            results.push({ user_id: uid, status: "error", error: JSON.stringify(created) });
          }
        }
      } catch (e) {
        results.push({ user_id: uid, status: "error", error: String(e) });
      }
    }

    return json({ ok: true, results });
  } catch (e) {
    console.error("[sync-activity] error", e);
    return json({ error: String(e) }, 500);
  }
});
