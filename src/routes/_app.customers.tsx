import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/app/StubPage";

export const Route = createFileRoute("/_app/customers")({
  head: () => ({ meta: [{ title: "Customers · RSP Medical Billing" }] }),
  component: () => <StubPage title="Customers" desc="Customer directory with outstanding balances." />,
});
