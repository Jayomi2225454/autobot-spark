import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, CheckCheck, Clock, MessageCircle, Send, XCircle, Loader2 } from "lucide-react";

export type WaStatus = "pending" | "sending" | "sent" | "delivered" | "read" | "replied" | "failed";

const waStyles: Record<WaStatus, string> = {
  pending: "bg-muted text-muted-foreground border-transparent",
  sending: "bg-info/10 text-info border-transparent",
  sent: "bg-info/10 text-info border-transparent",
  delivered: "bg-info/15 text-info border-transparent",
  read: "bg-success/15 text-success border-transparent",
  replied: "bg-success/20 text-success border-transparent",
  failed: "bg-destructive/10 text-destructive border-transparent",
};

const Icon: Record<WaStatus, typeof Check> = {
  pending: Clock,
  sending: Loader2,
  sent: Send,
  delivered: Check,
  read: CheckCheck,
  replied: MessageCircle,
  failed: XCircle,
};

const labels: Record<WaStatus, string> = {
  pending: "Pending",
  sending: "Sending",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  replied: "Replied",
  failed: "Failed",
};

export function WaStatusPill({ status }: { status: WaStatus }) {
  const I = Icon[status];
  return (
    <Badge variant="outline" className={cn("gap-1 px-2 py-0.5 text-[11px] font-medium", waStyles[status])}>
      <I className={cn("h-3 w-3", status === "sending" && "animate-spin")} />
      {labels[status]}
    </Badge>
  );
}

export function statusColor(s: string): string {
  switch (s) {
    case "new":
      return "bg-info/10 text-info border-transparent";
    case "contacted":
      return "bg-warning/15 text-warning-foreground border-transparent";
    case "qualified":
      return "bg-primary/10 text-primary border-transparent";
    case "proposal":
      return "bg-accent/20 text-accent-foreground border-transparent";
    case "won":
      return "bg-success/15 text-success border-transparent";
    case "lost":
      return "bg-destructive/10 text-destructive border-transparent";
    default:
      return "";
  }
}
