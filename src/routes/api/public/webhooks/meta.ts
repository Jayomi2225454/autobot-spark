// Meta WhatsApp webhook: GET for verification, POST for events.
import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

export const Route = createFileRoute("/api/public/webhooks/meta")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        const verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN;
        if (mode === "subscribe" && token && token === verifyToken && challenge) {
          return new Response(challenge, { status: 200, headers: { ...CORS, "Content-Type": "text/plain" } });
        }
        return new Response("Forbidden", { status: 403, headers: CORS });
      },

      POST: async ({ request }) => {
        const raw = await request.text();
        let payload: any = {};
        try { payload = JSON.parse(raw); } catch { /* keep raw */ }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Log
        await supabaseAdmin.from("webhook_logs").insert({
          source: "meta_whatsapp",
          payload,
          headers: Object.fromEntries(request.headers.entries()),
        });

        try {
          const entries = payload?.entry ?? [];
          for (const entry of entries) {
            for (const change of entry.changes ?? []) {
              const value = change.value ?? {};

              // Delivery status updates
              for (const st of value.statuses ?? []) {
                const waId: string | undefined = st.id;
                const status: string | undefined = st.status; // sent | delivered | read | failed
                if (!waId || !status) continue;
                const { data: msg } = await supabaseAdmin
                  .from("messages")
                  .select("id, lead_id, status")
                  .eq("wa_message_id", waId)
                  .maybeSingle();
                if (!msg) continue;
                const nowIso = new Date().toISOString();
                const patch: any = { status };
                if (status === "sent") patch.sent_at = nowIso;
                if (status === "delivered") patch.delivered_at = nowIso;
                if (status === "read") patch.read_at = nowIso;
                if (status === "failed") {
                  patch.failed_at = nowIso;
                  patch.error = st.errors?.[0]?.title ?? "Failed at provider";
                }
                await supabaseAdmin.from("messages").update(patch).eq("id", msg.id);
                await supabaseAdmin
                  .from("leads")
                  .update({ wa_status: status as any, last_activity_at: nowIso })
                  .eq("id", msg.lead_id);
                await supabaseAdmin.from("message_events").insert({
                  lead_id: msg.lead_id,
                  message_id: msg.id,
                  event_type: status as any,
                  description: `WhatsApp ${status}`,
                  metadata: st,
                });
              }

              // Inbound customer replies
              for (const m of value.messages ?? []) {
                const from: string = m.from;
                const body =
                  m.text?.body ??
                  m.button?.text ??
                  m.interactive?.button_reply?.title ??
                  m.interactive?.list_reply?.title ??
                  `[${m.type}]`;

                // find latest lead by trailing 10 digits
                const last10 = from.replace(/\D/g, "").slice(-10);
                const { data: lead } = await supabaseAdmin
                  .from("leads")
                  .select("id")
                  .like("mobile", `%${last10}`)
                  .order("created_at", { ascending: false })
                  .limit(1)
                  .maybeSingle();
                if (!lead) continue;
                const nowIso = new Date().toISOString();
                const { data: inMsg } = await supabaseAdmin
                  .from("messages")
                  .insert({
                    lead_id: lead.id,
                    direction: "inbound",
                    phone: from,
                    body,
                    status: "replied",
                    wa_message_id: m.id,
                    api_response: m,
                  })
                  .select("id")
                  .single();
                await supabaseAdmin
                  .from("leads")
                  .update({ wa_status: "replied", last_activity_at: nowIso })
                  .eq("id", lead.id);
                await supabaseAdmin.from("message_events").insert({
                  lead_id: lead.id,
                  message_id: inMsg?.id ?? null,
                  event_type: "replied",
                  description: `Customer replied: ${body.slice(0, 200)}`,
                  metadata: m,
                });
              }
            }
          }
          return new Response("EVENT_RECEIVED", { status: 200, headers: CORS });
        } catch (err) {
          console.error("meta webhook error", err);
          await supabaseAdmin
            .from("webhook_logs")
            .update({ error: err instanceof Error ? err.message : String(err) })
            .eq("source", "meta_whatsapp");
          return new Response("ok", { status: 200, headers: CORS });
        }
      },
    },
  },
});
