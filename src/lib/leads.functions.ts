import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const leadSourceEnum = z.enum(["justdial", "website", "webhook", "email", "csv", "manual", "other"]);

const createLeadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  mobile: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(160).optional().or(z.literal("").transform(() => undefined)),
  business_name: z.string().trim().max(160).optional().or(z.literal("").transform(() => undefined)),
  city: z.string().trim().max(80).optional().or(z.literal("").transform(() => undefined)),
  source: leadSourceEnum.default("manual"),
  notes: z.string().trim().max(2000).optional().or(z.literal("").transform(() => undefined)),
  assigned_to: z.string().uuid().optional().nullable(),
});

export const createLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createLeadSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const digits = data.mobile.replace(/\D/g, "");
    const last10 = digits.slice(-10);

    // duplicate check by trailing 10 digits
    const { data: existing } = await supabase
      .from("leads")
      .select("id, lead_code, name")
      .like("mobile", `%${last10}`)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return { duplicate: true, lead: existing };
    }

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        name: data.name,
        mobile: data.mobile,
        email: data.email ?? null,
        business_name: data.business_name ?? null,
        city: data.city ?? null,
        source: data.source,
        notes: data.notes ?? null,
        assigned_to: data.assigned_to ?? null,
        created_by: userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("message_events").insert({
      lead_id: lead.id,
      event_type: "queued",
      description: "Lead received and saved",
    });

    // Fire-and-await WhatsApp send via admin path
    try {
      const { sendInitialWhatsApp } = await import("./whatsapp-dispatch.server");
      await sendInitialWhatsApp(lead.id);
    } catch (e) {
      console.error("Initial WA dispatch error:", e);
    }

    return { duplicate: false, lead };
  });

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        search: z.string().optional(),
        status: z.string().optional(),
        wa_status: z.string().optional(),
        limit: z.number().min(1).max(200).default(100),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("leads")
      .select("id, lead_code, name, mobile, email, city, source, status, wa_status, assigned_to, last_activity_at, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.search && data.search.trim()) {
      const s = `%${data.search.trim()}%`;
      q = q.or(`name.ilike.${s},mobile.ilike.${s},email.ilike.${s},business_name.ilike.${s},lead_code.ilike.${s}`);
    }
    if (data.status) q = q.eq("status", data.status as any);
    if (data.wa_status) q = q.eq("wa_status", data.wa_status as any);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { leads: rows ?? [] };
  });

export const getLead = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: lead, error: e1 }, { data: messages, error: e2 }, { data: events, error: e3 }] =
      await Promise.all([
        supabase.from("leads").select("*").eq("id", data.id).maybeSingle(),
        supabase.from("messages").select("*").eq("lead_id", data.id).order("created_at", { ascending: true }),
        supabase.from("message_events").select("*").eq("lead_id", data.id).order("occurred_at", { ascending: true }),
      ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    if (e3) throw new Error(e3.message);
    if (!lead) throw new Error("Lead not found");
    return { lead, messages: messages ?? [], events: events ?? [] };
  });

export const updateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"]).optional(),
        assigned_to: z.string().uuid().nullable().optional(),
        notes: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { data: lead, error } = await context.supabase
      .from("leads")
      .update({ ...patch, last_activity_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    if (patch.status) {
      await context.supabase.from("message_events").insert({
        lead_id: id,
        event_type: "status_change",
        description: `Status changed to ${patch.status}`,
      });
    }
    if ("assigned_to" in patch) {
      await context.supabase.from("message_events").insert({
        lead_id: id,
        event_type: "assigned",
        description: patch.assigned_to ? "Lead assigned" : "Lead unassigned",
        metadata: { assigned_to: patch.assigned_to },
      });
    }
    return { lead };
  });

export const resendWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ lead_id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { sendInitialWhatsApp } = await import("./whatsapp-dispatch.server");
    return sendInitialWhatsApp(data.lead_id);
  });

export const sendTextMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ lead_id: z.string().uuid(), body: z.string().trim().min(1).max(4096) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("id, mobile")
      .eq("id", data.lead_id)
      .maybeSingle();
    if (leadErr) throw new Error(leadErr.message);
    if (!lead) throw new Error("Lead not found");

    const { data: msg, error: msgErr } = await supabase
      .from("messages")
      .insert({
        lead_id: lead.id,
        direction: "outbound",
        phone: lead.mobile,
        status: "sending",
        body: data.body,
      })
      .select("id")
      .single();
    if (msgErr) throw new Error(msgErr.message);

    const { sendWhatsAppText } = await import("./whatsapp.server");
    const res = await sendWhatsAppText({ to: lead.mobile, body: data.body });

    if (res.ok && res.waMessageId) {
      await supabase
        .from("messages")
        .update({
          wa_message_id: res.waMessageId,
          status: "sent",
          sent_at: new Date().toISOString(),
          api_response: res.response as any,
        })
        .eq("id", msg.id);
      await supabase.from("leads").update({ wa_status: "sent", last_activity_at: new Date().toISOString() }).eq("id", lead.id);
      await supabase.from("message_events").insert({
        lead_id: lead.id,
        message_id: msg.id,
        event_type: "sent",
        description: "Free-form text sent",
      });
      return { ok: true, messageId: msg.id, waMessageId: res.waMessageId };
    }

    await supabase
      .from("messages")
      .update({
        status: "failed",
        error: res.error ?? "Unknown error",
        api_response: res.response as any,
        failed_at: new Date().toISOString(),
      })
      .eq("id", msg.id);
    await supabase.from("message_events").insert({
      lead_id: lead.id,
      message_id: msg.id,
      event_type: "failed",
      description: `Text send failed: ${res.error ?? "unknown"}`,
    });
    throw new Error(res.error ?? "Failed to send message");
  });

export const deleteLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: deletedLead, error } = await context.supabase
      .from("leads")
      .delete()
      .eq("id", data.id)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!deletedLead) throw new Error("Lead not found or you do not have permission to delete it");
    return { ok: true };
  });

export const importLeadsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        rows: z
          .array(
            z.object({
              name: z.string().trim().min(1).max(120),
              mobile: z.string().trim().min(7).max(20),
              email: z.string().trim().optional(),
              business_name: z.string().trim().optional(),
              city: z.string().trim().optional(),
              notes: z.string().trim().optional(),
            }),
          )
          .min(1)
          .max(500),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let inserted = 0;
    let duplicates = 0;
    const errors: string[] = [];

    for (const r of data.rows) {
      const last10 = r.mobile.replace(/\D/g, "").slice(-10);
      const { data: existing } = await supabase
        .from("leads")
        .select("id")
        .like("mobile", `%${last10}`)
        .limit(1)
        .maybeSingle();
      if (existing) {
        duplicates++;
        continue;
      }
      const { data: lead, error } = await supabase
        .from("leads")
        .insert({
          name: r.name,
          mobile: r.mobile,
          email: r.email || null,
          business_name: r.business_name || null,
          city: r.city || null,
          notes: r.notes || null,
          source: "csv",
          created_by: userId,
        })
        .select("id")
        .single();
      if (error) {
        errors.push(`${r.mobile}: ${error.message}`);
        continue;
      }
      inserted++;
      try {
        const { sendInitialWhatsApp } = await import("./whatsapp-dispatch.server");
        await sendInitialWhatsApp(lead.id);
      } catch (e) {
        console.error("CSV WA dispatch:", e);
      }
    }
    return { inserted, duplicates, errors };
  });
