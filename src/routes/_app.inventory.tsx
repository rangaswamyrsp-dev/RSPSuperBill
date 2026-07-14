import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/app/StubPage";

export const Route = createFileRoute("/_app/inventory")({
  head: () => ({ meta: [{ title: "Inventory · RSP Medical Billing" }] }),
  component: () => <StubPage title="Inventory" desc="Live stock, expiry alerts, batches and pricing." />,
});
