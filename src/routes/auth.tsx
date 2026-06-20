import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Pulse CRM" },
      { name: "description", content: "Sign in to your Pulse CRM workspace." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created. You can sign in now.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          Pulse CRM
        </div>
        <div className="space-y-4">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Every lead, contacted on WhatsApp in seconds.
          </h1>
          <p className="max-w-md text-sm text-sidebar-foreground/80">
            Capture leads from Justdial, your website, webhooks or CSV. Pulse auto-sends an
            approved WhatsApp template via Meta Cloud API, tracks delivery & replies, and
            updates your dashboard in real time.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-4 text-xs">
            <Stat n="< 5s" l="To first message" />
            <Stat n="3x" l="Auto-retry on failure" />
            <Stat n="Live" l="Delivery + read tracking" />
          </div>
        </div>
        <p className="text-xs text-sidebar-foreground/60">© Pulse CRM</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md p-8 shadow-card">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold">
              {mode === "signin" ? "Sign in" : "Create your workspace"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signin" ? "Welcome back. Enter your credentials." : "The first user becomes the workspace admin."}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={120} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create workspace"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <button type="button" onClick={() => setMode("signup")} className="font-medium text-primary hover:underline">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have one?{" "}
                <button type="button" onClick={() => setMode("signin")} className="font-medium text-primary hover:underline">
                  Sign in
                </button>
              </>
            )}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">← Back home</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-lg bg-sidebar-accent/40 p-3">
      <div className="font-display text-lg font-bold text-primary">{n}</div>
      <div className="mt-0.5 text-[11px] text-sidebar-foreground/70">{l}</div>
    </div>
  );
}
