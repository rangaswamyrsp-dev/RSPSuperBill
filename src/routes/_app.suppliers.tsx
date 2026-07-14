import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/app/StubPage";

export const Route = createFileRoute("/_app/suppliers")({
  head: () => ({ meta: [{ title: "Suppliers · RSP Medical Billing" }] }),
  component: () => <StubPage title="Suppliers" desc="Suppliers, contact info and pending payments." />,
});
