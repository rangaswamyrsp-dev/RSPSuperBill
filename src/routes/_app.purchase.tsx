import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/app/StubPage";

export const Route = createFileRoute("/_app/purchase")({
  head: () => ({ meta: [{ title: "Purchase · RSP Medical Billing" }] }),
  component: () => <StubPage title="Purchase" desc="Record purchases from suppliers with GST and batch." />,
});
