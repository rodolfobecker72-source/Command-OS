// Public read-only view of a project's activities. No auth required.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const cardId = url.searchParams.get("cardId");
    if (!cardId) {
      return new Response(JSON.stringify({ error: "cardId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: card, error: cardError } = await supabase
      .from("project_cards")
      .select("id, project_name, client_name, proposal_id, material_links, material_link, workspace_id, comments")
      .eq("id", cardId)
      .maybeSingle();

    if (cardError || !card) {
      return new Response(JSON.stringify({ error: "Projeto não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: activities } = await supabase
      .from("project_activities")
      .select("id, title, status, order, assigned_to_user_ids, assigned_to_user_id, due_date, end_date, is_delivery, freela_name")
      .eq("project_card_id", cardId)
      .order("order", { ascending: true });

    // Collect member ids for display names/photos
    const memberIds = new Set<string>();
    for (const a of activities || []) {
      const ids = Array.isArray((a as any).assigned_to_user_ids) && (a as any).assigned_to_user_ids.length > 0
        ? (a as any).assigned_to_user_ids
        : ((a as any).assigned_to_user_id ? [(a as any).assigned_to_user_id] : []);
      for (const id of ids) memberIds.add(id);
    }
    let members: Array<{ id: string; name: string; photo_url: string | null }> = [];
    if (memberIds.size > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, name, photo_url")
        .in("id", Array.from(memberIds));
      members = (profs as any[]) || [];
    }

    const rawLinks = (card as any).material_links;
    const legacy = (card as any).material_link || "";
    const materialLinks: string[] = Array.isArray(rawLinks) && rawLinks.length > 0
      ? rawLinks.filter((l: any) => typeof l === "string" && l.trim())
      : (legacy ? [legacy] : []);

    const rawComments = Array.isArray((card as any).comments) ? (card as any).comments : [];
    const comments = rawComments.map((c: any) => ({
      id: c.id,
      userName: c.userName || 'Usuário',
      photoUrl: c.photoUrl || null,
      text: c.text || '',
      createdAt: c.createdAt || null,
      editedAt: c.editedAt || null,
    }));

    return new Response(
      JSON.stringify({
        card: {
          id: card.id,
          projectName: (card as any).project_name,
          clientName: (card as any).client_name,
          proposalId: (card as any).proposal_id,
          materialLinks,
        },
        activities: (activities || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          status: d.status,
          order: d.order,
          assignedToUserIds: Array.isArray(d.assigned_to_user_ids) && d.assigned_to_user_ids.length > 0
            ? d.assigned_to_user_ids
            : (d.assigned_to_user_id ? [d.assigned_to_user_id] : []),
          dueDate: d.due_date ?? null,
          endDate: d.end_date ?? null,
          isDelivery: !!d.is_delivery,
          freelaName: d.freela_name ?? null,
        })),
        members,
        comments,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
