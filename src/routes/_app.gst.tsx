import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/app/StubPage";

export const Route = createFileRoute("/_app/gst")({
  head: () => ({ meta: [{ title: "GST · RSP Medical Billing" }] }),
  component: () => <StubPage title="GST" desc="GST sales, purchase, summary and export." />,
});
