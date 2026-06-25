import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const {
      campaign_id,
      title,
      message,
      type = "info",
      category = "general",
      channel = "in_app",
      target = "all",
      link,
      image_url,
    } = await req.json();

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: "title and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch target users
    let userIds: string[] = [];

    if (target === "all") {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id");
      userIds = (profiles || []).map((p: any) => p.id);
    } else {
      // target is a specific user_id or future segment
      userIds = [target];
    }

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No users found for target" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sendInApp = channel === "in_app" || channel === "all";
    const sendEmail = channel === "email" || channel === "all";
    let inAppCount = 0;

    // ── In-App Notifications ─────────────────────────────────────────────────
    if (sendInApp) {
      const rows = userIds.map((uid) => ({
        user_id: uid,
        title,
        message,
        type,
        category,
        link: link || null,
        campaign_id: campaign_id || null,
        is_read: false,
      }));

      // Batch insert in chunks of 500
      const chunkSize = 500;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await supabase.from("user_notifications").insert(chunk);
        if (!error) inAppCount += chunk.length;
      }
    }

    // ── Email Notifications ──────────────────────────────────────────────────
    let emailCount = 0;
    if (sendEmail) {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        // Fetch emails
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const emails = (authUsers?.users || [])
          .filter((u: any) => userIds.includes(u.id) && u.email)
          .map((u: any) => u.email as string);

        const appName = "MIA ONE";
        const appUrl = Deno.env.get("APP_URL") || "https://miaone.app";

        for (const email of emails.slice(0, 100)) { // cap at 100 per invocation
          const body = {
            from: `${appName} <no-reply@miaone.app>`,
            to: [email],
            subject: title,
            html: `
              <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0D1117;color:#fff;border-radius:16px;overflow:hidden">
                <div style="background:linear-gradient(135deg,#FF8A00,#FF2EC9);padding:24px;text-align:center">
                  <h1 style="margin:0;font-size:22px;color:#fff">${appName}</h1>
                </div>
                <div style="padding:28px">
                  <h2 style="margin:0 0 12px;color:#fff;font-size:18px">${title}</h2>
                  <p style="color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 20px">${message}</p>
                  ${link ? `<a href="${appUrl}${link}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#FF8A00,#FF2EC9);color:#fff;border-radius:12px;text-decoration:none;font-weight:600">View Now</a>` : ""}
                </div>
                <div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
                  <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0">© 2026 MIA ONE. Unsubscribe anytime in Settings.</p>
                </div>
              </div>
            `,
          };

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (res.ok) emailCount++;
        }
      }
    }

    const totalCount = inAppCount + emailCount;

    // Update campaign record
    if (campaign_id) {
      await supabase
        .from("notification_campaigns")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          recipient_count: totalCount,
        })
        .eq("id", campaign_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        in_app_count: inAppCount,
        email_count: emailCount,
        total: totalCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
