import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/app/StubPage";

export const Route = createFileRoute("/_app/employees")({
  head: () => ({ meta: [{ title: "Employees · RSP Medical Billing" }] }),
  component: () => <StubPage title="Employees" desc="Staff, attendance, salaries and permissions." />,
});
