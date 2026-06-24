import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/data-deletion")({
  head: () => ({
    meta: [
      { title: "Data Deletion — JB Design" },
      { name: "description", content: "Request deletion of your data from JB Design systems." },
    ],
  }),
  component: DataDeletionPage,
});

function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="font-display text-3xl font-bold text-foreground">Data Deletion Request</h1>
        <p className="text-foreground">
          To request deletion of your data from our systems, please email us at{" "}
          <a href="mailto:kathan21042007@gmail.com" className="text-primary underline">
            kathan21042007@gmail.com
          </a>
          . Your data will be removed within 24–48 hours.
        </p>
      </div>
    </div>
  );
}
