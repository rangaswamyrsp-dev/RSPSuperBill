import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/app/StubPage";

export const Route = createFileRoute("/_app/barcode")({
  head: () => ({ meta: [{ title: "Barcode · RSP Medical Billing" }] }),
  component: () => <StubPage title="Barcode" desc="Generate, print and scan medicine barcodes." />,
});
