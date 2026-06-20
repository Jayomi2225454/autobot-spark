import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTemplates } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/templates")({
  head: () => ({ meta: [{ title: "Templates — Pulse CRM" }] }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const fn = useServerFn(listTemplates);
  const { data } = useQuery({ queryKey: ["templates"], queryFn: () => fn() });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">WhatsApp templates</h1>
        <p className="text-sm text-muted-foreground">
          The default template is sent automatically when a new lead arrives.
          Templates must first be approved by Meta in the WhatsApp Business Manager.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {(data?.templates ?? []).map((t) => (
          <Card key={t.id} className="space-y-2 p-5 shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-display text-lg font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.language}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {t.is_default && <Badge className="bg-accent text-accent-foreground">Default</Badge>}
                <Badge variant={t.is_active ? "secondary" : "outline"}>{t.is_active ? "Active" : "Inactive"}</Badge>
              </div>
            </div>
            {t.body && (
              <p className="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap">{t.body}</p>
            )}
          </Card>
        ))}
        {!data?.templates.length && (
          <Card className="p-8 text-center text-sm text-muted-foreground">No templates yet.</Card>
        )}
      </div>
    </div>
  );
}
