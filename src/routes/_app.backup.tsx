import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/app/StubPage";

export const Route = createFileRoute("/_app/backup")({
  head: () => ({ meta: [{ title: "Backup & Restore · RSP Medical Billing" }] }),
  component: () => <StubPage title="Backup & Restore" desc="Backup your database or restore from file." />,
});
