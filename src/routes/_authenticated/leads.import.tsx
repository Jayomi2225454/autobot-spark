import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { importLeadsCsv } from "@/lib/leads.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Papa from "papaparse";

export const Route = createFileRoute("/_authenticated/leads/import")({
  head: () => ({ meta: [{ title: "Import leads — Pulse CRM" }] }),
  component: ImportPage,
});

function ImportPage() {
  const fn = useServerFn(importLeadsCsv);
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  function onFile(file: File) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const cleaned = (res.data as any[])
          .map((r) => ({
            name: String(r.name ?? r.Name ?? "").trim(),
            mobile: String(r.mobile ?? r.Mobile ?? r.phone ?? r.Phone ?? "").trim(),
            email: String(r.email ?? r.Email ?? "").trim() || undefined,
            business_name: String(r.business_name ?? r.business ?? r.Business ?? "").trim() || undefined,
            city: String(r.city ?? r.City ?? "").trim() || undefined,
            notes: String(r.notes ?? r.Notes ?? "").trim() || undefined,
          }))
          .filter((r) => r.name && r.mobile);
        setRows(cleaned);
        toast.success(`Parsed ${cleaned.length} rows`);
      },
      error: (e) => toast.error(e.message),
    });
  }

  async function upload() {
    if (!rows || rows.length === 0) return;
    setLoading(true);
    try {
      const res = await fn({ data: { rows } });
      toast.success(`${res.inserted} imported · ${res.duplicates} duplicates skipped`);
      if (res.errors.length) toast.warning(`${res.errors.length} errors. Check console.`);
      console.warn("CSV errors:", res.errors);
      navigate({ to: "/leads" });
    } catch (e: any) {
      toast.error(e?.message ?? "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Import leads from CSV</h1>
        <p className="text-sm text-muted-foreground">
          Required columns: <code className="rounded bg-muted px-1">name</code>,{" "}
          <code className="rounded bg-muted px-1">mobile</code>. Optional:{" "}
          <code className="rounded bg-muted px-1">email</code>, <code className="rounded bg-muted px-1">business_name</code>,{" "}
          <code className="rounded bg-muted px-1">city</code>, <code className="rounded bg-muted px-1">notes</code>.
        </p>
      </div>
      <Card className="space-y-4 p-6 shadow-card">
        <div className="space-y-1.5">
          <Label>CSV file</Label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            className="block w-full rounded-md border border-input bg-background p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
          />
        </div>
        {rows && (
          <div className="text-sm text-muted-foreground">
            {rows.length} valid rows ready. Max 500 per import.
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate({ to: "/leads" })}>Cancel</Button>
          <Button onClick={upload} disabled={!rows || rows.length === 0 || loading}>
            {loading ? "Importing…" : `Import ${rows?.length ?? 0} leads`}
          </Button>
        </div>
      </Card>
    </div>
  );
}
