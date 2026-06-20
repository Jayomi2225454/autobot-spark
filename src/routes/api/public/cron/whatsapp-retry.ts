// Cron-callable: process due rows in wa_retry_queue.
import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";

export const Route = createFileRoute("/api/public/cron/whatsapp-retry")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { retryQueuedMessage } = await import("@/lib/whatsapp-dispatch.server");

        const { data: due } = await supabaseAdmin
          .from("wa_retry_queue")
          .select("id")
          .eq("done", false)
          .lte("next_attempt_at", new Date().toISOString())
          .order("next_attempt_at", { ascending: true })
          .limit(25);

        const results: Array<{ id: string; ok: boolean }> = [];
        for (const row of due ?? []) {
          try {
            const r = await retryQueuedMessage(row.id);
            results.push({ id: row.id, ok: !!r.ok });
          } catch (e) {
            console.error("retry cron item failed", row.id, e);
            results.push({ id: row.id, ok: false });
          }
        }
        return new Response(JSON.stringify({ processed: results.length, results }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
