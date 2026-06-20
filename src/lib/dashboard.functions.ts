import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [total, today, statuses, recent] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
      supabase.from("leads").select("wa_status, status"),
      supabase
        .from("leads")
        .select("id, lead_code, name, mobile, source, status, wa_status, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const counts = {
      pending: 0,
      sending: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      replied: 0,
      failed: 0,
      won: 0,
      lost: 0,
    };
    const rows = statuses.data ?? [];
    for (const r of rows) {
      const k = r.wa_status as keyof typeof counts;
      if (k in counts) counts[k]++;
      if (r.status === "won") counts.won++;
      if (r.status === "lost") counts.lost++;
    }
    const totalLeads = total.count ?? 0;
    const conversion = totalLeads > 0 ? Math.round((counts.won / totalLeads) * 1000) / 10 : 0;

    return {
      totalLeads,
      todayLeads: today.count ?? 0,
      counts,
      conversion,
      recent: recent.data ?? [],
    };
  });
