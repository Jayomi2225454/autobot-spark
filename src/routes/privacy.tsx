import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — JB Design" },
      { name: "description", content: "JB Design privacy policy for WhatsApp Business API lead messaging." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="font-display text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="space-y-3 text-foreground">
          <p>
            JB Design uses the WhatsApp Business API (via Meta Cloud API) to send automated
            welcome and follow-up messages to leads who contact us through Justdial, our website,
            or other inquiry channels.
          </p>
          <p>
            We collect basic contact information (name, mobile number, email, city, and inquiry
            details) solely for the purpose of responding to your inquiry and providing our
            services. We do <strong>not</strong> sell, rent, or share your data with any third
            parties for marketing purposes.
          </p>
          <p>
            Your information is stored securely and accessed only by authorized JB Design staff.
            Messages are delivered through Meta's WhatsApp Business Platform under their standard
            terms.
          </p>
          <p>
            For data deletion requests, please visit our{" "}
            <a href="/data-deletion" className="text-primary underline">Data Deletion</a> page or
            email us at{" "}
            <a href="mailto:kathan21042007@gmail.com" className="text-primary underline">
              kathan21042007@gmail.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
