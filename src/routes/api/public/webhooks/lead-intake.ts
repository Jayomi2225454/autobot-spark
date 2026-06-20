// Public webhook for website forms, Zapier, Justdial email-to-webhook, etc.
// Optionally protect by setting a LEAD_WEBHOOK_TOKEN secret and including ?token=
import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { z } from "zod";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Webhook-Token",
} as const;

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  mobile: z.string().trim().min(7).max(20),
  email: z.string().trim().email().optional(),
  business_name: z.string().trim().max(160).optional(),
  city: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(2000).optional(),
  source: z
    .enum(["justdial", "website", "webhook", "email", "csv", "manual", "other"])
    .optional(),
});

export const Route = createFileRoute("/api/public/webhooks/lead-intake")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const expected = process.env.LEAD_WEBHOOK_TOKEN;
        if (expected) {
          const url = new URL(request.url);
          const provided = url.searchParams.get("token") || request.headers.get("x-webhook-token");
          if (provided !== expected) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { ...CORS, "Content-Type": "application/json" },
            });
          }
        }

        const body = await request.json().catch(() => ({}));
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return new Response(JSON.stringify({ error: "Invalid payload", details: parsed.error.flatten() }), {
            status: 400,
            headers: { ...CORS, "Content-Type": "application/json" },
          });
        }
        const data = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const last10 = data.mobile.replace(/\D/g, "").slice(-10);
        const { data: existing } = await supabaseAdmin
          .from("leads")
          .select("id, lead_code")
          .like("mobile", `%${last10}`)
          .limit(1)
          .maybeSingle();
        if (existing) {
          return new Response(JSON.stringify({ ok: true, duplicate: true, lead: existing }), {
            status: 200,
            headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        const { data: lead, error } = await supabaseAdmin
          .from("leads")
          .insert({
            name: data.name,
            mobile: data.mobile,
            email: data.email ?? null,
            business_name: data.business_name ?? null,
            city: data.city ?? null,
            notes: data.notes ?? null,
            source: data.source ?? "webhook",
          })
          .select("id, lead_code")
          .single();
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...CORS, "Content-Type": "application/json" },
          });
        }

        await supabaseAdmin.from("message_events").insert({
          lead_id: lead.id,
          event_type: "queued",
          description: `Lead received via ${data.source ?? "webhook"}`,
        });

        const { sendInitialWhatsApp } = await import("@/lib/whatsapp-dispatch.server");
        sendInitialWhatsApp(lead.id).catch((e) => console.error("intake dispatch", e));

        return new Response(JSON.stringify({ ok: true, lead }), {
          status: 201,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      },
    },
  },
});
