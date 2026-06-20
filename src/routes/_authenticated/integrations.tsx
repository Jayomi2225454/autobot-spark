import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Webhook, Mail, Globe, ListChecks } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({ meta: [{ title: "Integrations — Pulse CRM" }] }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const webhookUrl = `${origin}/api/public/webhooks/lead-intake`;
  const metaWebhookUrl = `${origin}/api/public/webhooks/meta`;

  function copy(s: string) {
    navigator.clipboard.writeText(s);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Lead intake & integrations</h1>
        <p className="text-sm text-muted-foreground">All channels feed into the same automatic WhatsApp workflow.</p>
      </div>

      <Card className="space-y-3 p-6 shadow-card">
        <div className="flex items-center gap-2"><Webhook className="h-5 w-5 text-primary" /><h2 className="font-display font-semibold">Universal lead webhook</h2><Badge className="bg-success text-success-foreground">Live</Badge></div>
        <p className="text-sm text-muted-foreground">
          POST a JSON body to this URL from Justdial email automation, Zapier, your website forms,
          or any other tool. New leads instantly trigger the default WhatsApp template.
        </p>
        <code className="block break-all rounded-md bg-muted p-3 text-xs">{webhookUrl}</code>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => copy(webhookUrl)}>Copy URL</Button>
          <Button size="sm" variant="outline" onClick={() => copy(`curl -X POST ${webhookUrl} \\\n  -H 'Content-Type: application/json' \\\n  -d '{"name":"Rahul Patel","mobile":"+919876543210","email":"rahul@example.com","city":"Ahmedabad","source":"website"}'`)}>
            Copy cURL example
          </Button>
        </div>
        <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Required fields:</strong> name, mobile.{" "}
          <strong className="text-foreground">Optional:</strong> email, business_name, city, notes, source.
          <br />
          <strong className="text-foreground">Optional security:</strong> set the <code>LEAD_WEBHOOK_TOKEN</code> secret,
          then include <code>?token=YOUR_TOKEN</code> or header <code>X-Webhook-Token</code>.
        </div>
      </Card>

      <Card className="space-y-3 p-6 shadow-card">
        <div className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /><h2 className="font-display font-semibold">Meta WhatsApp webhook</h2></div>
        <p className="text-sm text-muted-foreground">
          Configure this URL in your Meta App → WhatsApp → Configuration. Subscribe to{" "}
          <code>messages</code> events to receive delivery, read, and reply events.
        </p>
        <code className="block break-all rounded-md bg-muted p-3 text-xs">{metaWebhookUrl}</code>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => copy(metaWebhookUrl)}>Copy URL</Button>
        </div>
        <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Verify token:</strong> use the value of your <code>META_WHATSAPP_VERIFY_TOKEN</code> secret.
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="space-y-2 p-5 shadow-soft">
          <div className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /><h3 className="font-semibold">Justdial</h3></div>
          <p className="text-sm text-muted-foreground">
            Justdial doesn't expose a public lead API. Forward Justdial lead emails to a tool like
            Zapier / Make / Pabbly Connect and POST extracted fields into the universal webhook above
            with <code>source: "justdial"</code>.
          </p>
        </Card>
        <Card className="space-y-2 p-5 shadow-soft">
          <div className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /><h3 className="font-semibold">Email parsing</h3></div>
          <p className="text-sm text-muted-foreground">
            Use Mailgun Routes, SendGrid Inbound Parse, or a parser like Parserr to extract fields
            from emails and POST them into the universal webhook with <code>source: "email"</code>.
          </p>
        </Card>
      </div>
    </div>
  );
}
