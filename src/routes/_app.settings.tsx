import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/app/StubPage";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings · RSP Medical Billing" }] }),
  component: () => <StubPage title="Settings" desc="Company, GST, printer, backup and permissions." />,
});
