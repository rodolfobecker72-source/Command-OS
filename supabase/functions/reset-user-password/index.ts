import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, new_password, admin_key } = await req.json();

    // Validate: require service role key as admin_key, or a valid owner/admin JWT
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    let authorized = false;
    
    // Check admin_key in body
    if (admin_key === serviceRoleKey) {
      authorized = true;
    }
    
    // Check Authorization header for authenticated owner/admin
    if (!authorized && authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      if (token !== anonKey) {
        const anonClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          anonKey,
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: claimsData, error: claimsError } =
          await anonClient.auth.getClaims(token);
        if (!claimsError && claimsData?.claims) {
          const callerId = claimsData.claims.sub as string;
          const { data: callerRole } = await anonClient.rpc("get_user_role", {
            _user_id: callerId,
          });
          if (callerRole === "owner" || callerRole === "admin") {
            authorized = true;
          }
        }
      }
    }
    
    if (!authorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!email || !new_password) {
      return new Response(
        JSON.stringify({ error: "email and new_password required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use service role to update user password
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find user by email
    const { data: userList, error: listError } =
      await adminClient.auth.admin.listUsers();
    if (listError) throw listError;

    const targetUser = userList.users.find((u) => u.email === email);
    if (!targetUser) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateError } =
      await adminClient.auth.admin.updateUserById(targetUser.id, {
        password: new_password,
      });

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, message: "Password updated" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
