// Temporary test endpoint: triggers sendInitialWhatsApp for a given lead_id.
import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";

export const Route = createFileRoute("/api/public/test/wa-send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}));
        const leadId = (body as { lead_id?: string }).lead_id;
        if (!leadId) {
          return new Response(JSON.stringify({ ok: false, error: "lead_id required" }), { status: 400 });
        }
        const { sendInitialWhatsApp } = await import("@/lib/whatsapp-dispatch.server");
        const result = await sendInitialWhatsApp(leadId);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
