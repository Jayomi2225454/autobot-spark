import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { deleteLead, listLeads } from "@/lib/leads.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WaStatusPill, statusColor } from "@/components/app/StatusPills";
import { Plus, Upload, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/leads/")({
  head: () => ({ meta: [{ title: "Leads — Pulse CRM" }] }),
  component: LeadsList,
});

function LeadsList() {
  const fn = useServerFn(listLeads);
  const deleteFn = useServerFn(deleteLead);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data, refetch } = useQuery({
    queryKey: ["leads", search],
    queryFn: () => fn({ data: { search, limit: 100 } }),
  });

  useEffect(() => {
    const ch = supabase
      .channel("leads-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  async function removeLead(id: string) {
    try {
      await deleteFn({ data: { id } });
      toast.success("Lead deleted");
      qc.removeQueries({ queryKey: ["lead", id] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete lead");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">{data?.leads.length ?? 0} leads shown</p>
        </div>
        <div className="flex gap-2">
          <Link to="/leads/import"><Button variant="outline" size="sm" className="gap-1.5"><Upload className="h-4 w-4"/>Import CSV</Button></Link>
          <Link to="/leads/new"><Button size="sm" className="gap-1.5"><Plus className="h-4 w-4"/>New lead</Button></Link>
        </div>
      </div>

      <Card className="p-3 shadow-soft">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, mobile, email, lead code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      <Card className="overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Lead ID</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">WhatsApp</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data?.leads ?? []).map((l) => (
                <tr key={l.id} className="transition hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    <Link to="/leads/$leadId" params={{ leadId: l.id }} className="hover:text-primary hover:underline">
                      {l.lead_code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link to="/leads/$leadId" params={{ leadId: l.id }} className="font-medium hover:text-primary">
                      {l.name}
                    </Link>
                    {l.email && <div className="text-xs text-muted-foreground">{l.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{l.mobile}</td>
                  <td className="px-4 py-3"><Badge variant="secondary" className="text-[11px]">{l.source}</Badge></td>
                  <td className="px-4 py-3"><Badge variant="outline" className={statusColor(l.status)}>{l.status}</Badge></td>
                  <td className="px-4 py-3"><WaStatusPill status={l.wa_status as any} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" aria-label={`Delete ${l.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently removes {l.name} and all related WhatsApp messages, events, and retry history.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeLead(l.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete lead
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
              {!data?.leads.length && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">No leads found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
