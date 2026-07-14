import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/app/StubPage";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports · RSP Medical Billing" }] }),
  component: () => <StubPage title="Reports" desc="Daily / monthly sales, GST, stock and P&L reports." />,
});
