import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/app/StubPage";

export const Route = createFileRoute("/_app/qr")({
  head: () => ({ meta: [{ title: "QR Code · RSP Medical Billing" }] }),
  component: () => <StubPage title="QR Code" desc="Generate UPI and medicine QR codes." />,
});
