import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/app/StubPage";

export const Route = createFileRoute("/_app/medicines")({
  head: () => ({ meta: [{ title: "Medicine Master · RSP Medical Billing" }] }),
  component: () => <StubPage title="Medicine Master" desc="Manage medicines, salts, HSN, MRP and GST." />,
});
