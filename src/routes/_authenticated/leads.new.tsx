import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createLead } from "@/lib/leads.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/leads/new")({
  head: () => ({ meta: [{ title: "New lead — Pulse CRM" }] }),
  component: NewLead,
});

function NewLead() {
  const fn = useServerFn(createLead);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", mobile: "", email: "", business_name: "", city: "", source: "manual" as const, notes: "",
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fn({ data: form });
      if (res.duplicate) {
        toast.warning(`Duplicate mobile — existing lead ${(res.lead as any).lead_code}`);
        navigate({ to: "/leads/$leadId", params: { leadId: (res.lead as any).id } });
        return;
      }
      toast.success("Lead saved. WhatsApp template sending…");
      navigate({ to: "/leads/$leadId", params: { leadId: (res.lead as any).id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create lead");
    } finally {
      setLoading(false);
    }
  }

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">New lead</h1>
        <p className="text-sm text-muted-foreground">
          Saving a lead automatically triggers the default WhatsApp template via Meta Cloud API.
        </p>
      </div>
      <Card className="p-6 shadow-card">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name *" className="sm:col-span-2">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required maxLength={120} />
          </Field>
          <Field label="Mobile number *">
            <Input value={form.mobile} onChange={(e) => set("mobile", e.target.value)} required placeholder="+91 98xxx xxxxx" />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Business name">
            <Input value={form.business_name} onChange={(e) => set("business_name", e.target.value)} />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="Source" className="sm:col-span-2">
            <Select value={form.source} onValueChange={(v) => set("source", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="justdial">Justdial</SelectItem>
                <SelectItem value="website">Website form</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="csv">CSV import</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} maxLength={2000} />
          </Field>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/leads" })}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save & send WhatsApp"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={"space-y-1.5 " + (className ?? "")}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
