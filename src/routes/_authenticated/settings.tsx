import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTeam, setUserRole } from "@/lib/admin.functions";
import { getMe } from "@/lib/me.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Pulse CRM" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const teamFn = useServerFn(listTeam);
  const meFn = useServerFn(getMe);
  const setRoleFn = useServerFn(setUserRole);
  const { data: team } = useQuery({ queryKey: ["team"], queryFn: () => teamFn() });
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });
  const isAdmin = me?.roles?.includes("admin");

  async function change(uid: string, role: string) {
    try {
      await setRoleFn({ data: { user_id: uid, role: role as any } });
      qc.invalidateQueries({ queryKey: ["team"] });
      toast.success("Role updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your workspace and team.</p>
      </div>

      <Card className="overflow-hidden shadow-card">
        <div className="border-b border-border px-5 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-display font-semibold">Team members</h2>
            <p className="text-xs text-muted-foreground">{team?.members.length ?? 0} members</p>
          </div>
          {!isAdmin && <Badge variant="outline">Admin only — read</Badge>}
        </div>
        <div className="divide-y divide-border">
          {(team?.members ?? []).map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{m.full_name || m.email}</div>
                <div className="truncate text-xs text-muted-foreground">{m.email}</div>
              </div>
              <div className="flex items-center gap-3">
                {m.roles.map((r) => (
                  <Badge key={r} variant="secondary" className="text-[11px]">{r}</Badge>
                ))}
                {isAdmin && (
                  <Select defaultValue={m.roles[0] ?? "sales_executive"} onValueChange={(v) => change(m.id, v)}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="sales_executive">Sales executive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
