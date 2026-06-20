// Server-only Meta WhatsApp Cloud API helper. Never import from client code.
// Filename .server.ts is import-protected.

export interface SendTemplateInput {
  to: string; // E.164 or Indian 10-digit (we'll normalize)
  templateName: string;
  language: string;
  variables?: string[]; // ordered template params, replace {{1}}, {{2}}, ...
}

export interface SendTemplateResult {
  ok: boolean;
  waMessageId?: string;
  status: number;
  response: unknown;
  error?: string;
}

export function normalizeIndianMobile(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return "91" + digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 13 && digits.startsWith("091")) return digits.slice(1);
  return digits;
}

export async function sendWhatsAppTemplate(input: SendTemplateInput): Promise<SendTemplateResult> {
  const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { ok: false, status: 0, response: null, error: "Meta WhatsApp credentials not configured" };
  }

  const to = normalizeIndianMobile(input.to);
  const components = input.variables && input.variables.length > 0
    ? [{
        type: "body",
        parameters: input.variables.map((v) => ({ type: "text", text: String(v ?? "") })),
      }]
    : undefined;

  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: input.templateName,
      language: { code: input.language },
      ...(components ? { components } : {}),
    },
  };

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        response: json,
        error: (json as any)?.error?.message || `HTTP ${res.status}`,
      };
    }
    const waMessageId = (json as any)?.messages?.[0]?.id as string | undefined;
    return { ok: true, status: res.status, response: json, waMessageId };
  } catch (err) {
    return { ok: false, status: 0, response: null, error: err instanceof Error ? err.message : String(err) };
  }
}
