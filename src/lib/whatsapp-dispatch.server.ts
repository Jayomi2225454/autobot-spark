// Server-only orchestrator: pick template, send via Meta, record everything.
import { sendWhatsAppTemplate } from "./whatsapp.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function sendInitialWhatsApp(leadId: string) {
  const { data: lead, error: leadErr } = await supabaseAdmin
    .from("leads")
    .select("id, name, mobile")
    .eq("id", leadId)
    .maybeSingle();
  if (leadErr || !lead) {
    console.error("sendInitialWhatsApp: lead not found", leadErr);
    return { ok: false, error: "Lead not found" };
  }

  // pick default active template
  let templateName = process.env.META_WHATSAPP_DEFAULT_TEMPLATE || "hello_world";
  let language = process.env.META_WHATSAPP_DEFAULT_TEMPLATE_LANG || "en_US";
  const { data: tpl } = await supabaseAdmin
    .from("templates")
    .select("name, language")
    .eq("is_active", true)
    .eq("is_default", true)
    .maybeSingle();
  if (tpl) {
    templateName = tpl.name;
    language = tpl.language;
  }

  // create message row
  const { data: msg, error: msgErr } = await supabaseAdmin
    .from("messages")
    .insert({
      lead_id: lead.id,
      direction: "outbound",
      phone: lead.mobile,
      template_name: templateName,
      status: "sending",
      body: `Template: ${templateName}`,
    })
    .select("id")
    .single();
  if (msgErr || !msg) {
    console.error("sendInitialWhatsApp: failed to create message", msgErr);
    return { ok: false, error: msgErr?.message };
  }

  await supabaseAdmin.from("leads").update({ wa_status: "sending", last_activity_at: new Date().toISOString() }).eq("id", lead.id);
  await supabaseAdmin.from("message_events").insert({
    lead_id: lead.id,
    message_id: msg.id,
    event_type: "sending",
    description: `Sending WhatsApp template "${templateName}"`,
  });

  const res = await sendWhatsAppTemplate({
    to: lead.mobile,
    templateName,
    language,
    variables: [lead.name],
  });

  if (res.ok && res.waMessageId) {
    await supabaseAdmin
      .from("messages")
      .update({
        wa_message_id: res.waMessageId,
        status: "sent",
        sent_at: new Date().toISOString(),
        api_response: res.response as any,
      })
      .eq("id", msg.id);
    await supabaseAdmin.from("leads").update({ wa_status: "sent", last_activity_at: new Date().toISOString() }).eq("id", lead.id);
    await supabaseAdmin.from("message_events").insert({
      lead_id: lead.id,
      message_id: msg.id,
      event_type: "sent",
      description: "WhatsApp message sent",
      metadata: { wa_message_id: res.waMessageId },
    });
    return { ok: true, messageId: msg.id, waMessageId: res.waMessageId };
  }

  // Failure → log + enqueue retry
  await supabaseAdmin
    .from("messages")
    .update({
      status: "failed",
      error: res.error ?? "Unknown error",
      api_response: res.response as any,
      failed_at: new Date().toISOString(),
    })
    .eq("id", msg.id);
  await supabaseAdmin.from("leads").update({ wa_status: "failed", last_activity_at: new Date().toISOString() }).eq("id", lead.id);
  await supabaseAdmin.from("message_events").insert({
    lead_id: lead.id,
    message_id: msg.id,
    event_type: "failed",
    description: `Send failed: ${res.error ?? "unknown"}`,
    metadata: { status: res.status, response: res.response as any } as any,
  });

  // Enqueue for retry (next attempt in 1 minute)
  await supabaseAdmin.from("wa_retry_queue").insert({
    message_id: msg.id,
    lead_id: lead.id,
    attempts: 1,
    last_error: res.error ?? "Unknown error",
    next_attempt_at: new Date(Date.now() + 60_000).toISOString(),
  });

  return { ok: false, error: res.error, messageId: msg.id };
}

export async function retryQueuedMessage(queueId: string) {
  const { data: row } = await supabaseAdmin
    .from("wa_retry_queue")
    .select("*")
    .eq("id", queueId)
    .maybeSingle();
  if (!row || row.done) return { ok: false, skipped: true };

  const { data: msg } = await supabaseAdmin
    .from("messages")
    .select("id, lead_id, phone, template_name")
    .eq("id", row.message_id)
    .maybeSingle();
  const { data: lead } = await supabaseAdmin
    .from("leads")
    .select("id, name, mobile")
    .eq("id", row.lead_id)
    .maybeSingle();
  if (!msg || !lead) {
    await supabaseAdmin.from("wa_retry_queue").update({ done: true, last_error: "Missing message/lead" }).eq("id", queueId);
    return { ok: false };
  }

  const templateName = msg.template_name || process.env.META_WHATSAPP_DEFAULT_TEMPLATE || "hello_world";
  const language = process.env.META_WHATSAPP_DEFAULT_TEMPLATE_LANG || "en_US";

  await supabaseAdmin.from("messages").update({ status: "sending", retry_count: row.attempts }).eq("id", msg.id);
  await supabaseAdmin.from("leads").update({ wa_status: "sending" }).eq("id", lead.id);

  const res = await sendWhatsAppTemplate({
    to: lead.mobile,
    templateName,
    language,
    variables: [lead.name],
  });

  if (res.ok && res.waMessageId) {
    await supabaseAdmin
      .from("messages")
      .update({
        wa_message_id: res.waMessageId,
        status: "sent",
        sent_at: new Date().toISOString(),
        api_response: res.response as any,
        error: null,
      })
      .eq("id", msg.id);
    await supabaseAdmin.from("leads").update({ wa_status: "sent" }).eq("id", lead.id);
    await supabaseAdmin.from("message_events").insert({
      lead_id: lead.id,
      message_id: msg.id,
      event_type: "sent",
      description: `Sent on retry #${row.attempts}`,
    });
    await supabaseAdmin.from("wa_retry_queue").update({ done: true }).eq("id", queueId);
    return { ok: true };
  }

  const nextAttempts = row.attempts + 1;
  if (nextAttempts > row.max_attempts) {
    await supabaseAdmin
      .from("messages")
      .update({ status: "failed", error: res.error ?? "Retry exhausted", failed_at: new Date().toISOString() })
      .eq("id", msg.id);
    await supabaseAdmin.from("leads").update({ wa_status: "failed" }).eq("id", lead.id);
    await supabaseAdmin.from("message_events").insert({
      lead_id: lead.id,
      message_id: msg.id,
      event_type: "failed",
      description: `Retry exhausted after ${row.attempts} attempts`,
    });
    await supabaseAdmin
      .from("wa_retry_queue")
      .update({ done: true, attempts: row.attempts, last_error: res.error ?? "exhausted" })
      .eq("id", queueId);
    return { ok: false };
  }

  // backoff: 1m, 5m, 15m
  const backoffMs = [60_000, 5 * 60_000, 15 * 60_000][Math.min(nextAttempts - 1, 2)];
  await supabaseAdmin
    .from("wa_retry_queue")
    .update({
      attempts: nextAttempts,
      last_error: res.error ?? "unknown",
      next_attempt_at: new Date(Date.now() + backoffMs).toISOString(),
    })
    .eq("id", queueId);
  await supabaseAdmin.from("messages").update({ status: "failed", error: res.error }).eq("id", msg.id);
  await supabaseAdmin.from("leads").update({ wa_status: "failed" }).eq("id", lead.id);
  return { ok: false, retryScheduled: true };
}
