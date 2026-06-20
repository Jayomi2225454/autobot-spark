import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/dashboard.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Users,
  CalendarClock,
  Clock,
  Send,
  CheckCheck,
  Eye,
  MessageCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WaStatusPill, statusColor } from "@/components/app/StatusPills";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Pulse CRM" }] }),
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(getDashboard);
  const { data, refetch } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  useEffect(() => {
    const ch = supabase
      .channel("dashboard-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => refetch())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [refetch]);

  const cards = [
    { label: "Total Leads", value: data?.totalLeads ?? 0, icon: Users, accent: "text-info" },
    { label: "Today's Leads", value: data?.todayLeads ?? 0, icon: CalendarClock, accent: "text-info" },
    { label: "WA Pending", value: data?.counts.pending ?? 0, icon: Clock, accent: "text-warning" },
    { label: "WA Sent", value: data?.counts.sent ?? 0, icon: Send, accent: "text-info" },
    { label: "Delivered", value: data?.counts.delivered ?? 0, icon: CheckCheck, accent: "text-info" },
    { label: "Read", value: data?.counts.read ?? 0, icon: Eye, accent: "text-success" },
    { label: "Replies", value: data?.counts.replied ?? 0, icon: MessageCircle, accent: "text-success" },
    { label: "Failed", value: data?.counts.failed ?? 0, icon: XCircle, accent: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Live view of every lead and WhatsApp delivery.</p>
        </div>
        <Card className="flex items-center gap-3 px-4 py-2 shadow-soft">
          <TrendingUp className="h-4 w-4 text-success" />
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Conversion rate</div>
            <div className="font-display text-lg font-bold">{data?.conversion ?? 0}%</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-4 shadow-soft transition hover:shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</span>
              <c.icon className={cn("h-4 w-4", c.accent)} />
            </div>
            <div className="mt-2 font-display text-3xl font-bold">{c.value}</div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="font-display font-semibold">Recent leads</h2>
          <Link to="/leads" className="text-xs font-medium text-primary hover:underline">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-border">
          {(data?.recent ?? []).map((l) => (
            <Link
              key={l.id}
              to="/leads/$leadId"
              params={{ leadId: l.id }}
              className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-muted/50"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{l.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {l.mobile} · {l.source} · {new Date(l.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline" className={statusColor(l.status)}>{l.status}</Badge>
                <WaStatusPill status={l.wa_status as any} />
              </div>
            </Link>
          ))}
          {!data?.recent?.length && (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No leads yet. <Link to="/leads/new" className="text-primary hover:underline">Add your first lead.</Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
