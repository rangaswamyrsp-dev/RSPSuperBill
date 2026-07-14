import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/app/StubPage";

export const Route = createFileRoute("/_app/sales")({
  head: () => ({ meta: [{ title: "Sales · RSP Medical Billing" }] }),
  component: () => <StubPage title="Sales" desc="Invoice history, filters, print, cancel and returns." />,
});
