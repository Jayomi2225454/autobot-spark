// Justdial Lead Push receiver. Accepts GET (query params) or POST (JSON / form).
// Protected by ?token= or X-Webhook-Token header matching JUSTDIAL_TOKEN.
import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Webhook-Token",
} as const;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function pick(obj: Record<string, any>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return undefined;
}

async function readPayload(request: Request): Promise<Record<string, any>> {
  const url = new URL(request.url);
  const q: Record<string, any> = {};
  url.searchParams.forEach((v, k) => (q[k] = v));
  if (request.method === "GET") return q;

  const ct = request.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      const j = await request.json().catch(() => ({}));
      return { ...q, ...(j && typeof j === "object" ? j : {}) };
    }
    if (ct.includes("form")) {
      const fd = await request.formData();
      const o: Record<string, any> = {};
      fd.forEach((v, k) => (o[k] = String(v)));
      return { ...q, ...o };
    }
    const text = await request.text();
    if (text.trim().startsWith("{")) {
      const j = JSON.parse(text);
      return { ...q, ...(j && typeof j === "object" ? j : {}) };
    }
  } catch {}
  return q;
}

async function handle(request: Request) {
  const url = new URL(request.url);
  const expected = process.env.JUSTDIAL_TOKEN;
  const provided =
    url.searchParams.get("token") ||
    request.headers.get("x-webhook-token") ||
    "";
  if (!expected || provided !== expected) {
    return json(401, { error: "Unauthorized" });
  }

  const payload = await readPayload(request);

  const name = pick(payload, ["name", "Name", "prefix", "customer_name", "leadname", "lead_name"]);
  const mobile = pick(payload, ["mobile", "Mobile", "phone", "Phone", "phone_number", "mobilenumber", "mobile_number"]);
  const email = pick(payload, ["email", "Email", "email_id"]);
  const category = pick(payload, ["category", "Category", "subject", "service", "requirement"]);
  const city = pick(payload, ["city", "City", "area", "location"]);
  const dateStr = pick(payload, ["date", "Date", "lead_date", "created_at"]);

  if (!name || !mobile) {
    return json(400, { error: "Missing required fields", required: ["name", "mobile"], received: payload });
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const last10 = mobile.replace(/\D/g, "").slice(-10);
  const { data: existing } = await supabaseAdmin
    .from("leads")
    .select("id, lead_code")
    .like("mobile", `%${last10}`)
    .limit(1)
    .maybeSingle();
  if (existing) {
    return json(200, { ok: true, duplicate: true, lead: existing });
  }

  const notesParts: string[] = [];
  if (category) notesParts.push(`Category: ${category}`);
  if (dateStr) notesParts.push(`Justdial date: ${dateStr}`);

  const { data: lead, error } = await supabaseAdmin
    .from("leads")
    .insert({
      name,
      mobile,
      email: email ?? null,
      city: city ?? null,
      notes: notesParts.length ? notesParts.join("\n") : null,
      source: "justdial",
    })
    .select("id, lead_code")
    .single();
  if (error) return json(500, { error: error.message });

  await supabaseAdmin.from("message_events").insert({
    lead_id: lead.id,
    event_type: "queued",
    description: "Lead received via Justdial",
    metadata: payload as any,
  });

  try {
    const { sendInitialWhatsApp } = await import("@/lib/whatsapp-dispatch.server");
    sendInitialWhatsApp(lead.id).catch((e) => console.error("justdial dispatch", e));
  } catch (e) {
    console.error("justdial dispatch import", e);
  }

  return json(201, { ok: true, lead });
}

export const Route = createFileRoute("/api/public/leads/justdial")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
