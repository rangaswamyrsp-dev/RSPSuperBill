import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/app/StubPage";

export const Route = createFileRoute("/_app/accounts")({
  head: () => ({ meta: [{ title: "Accounts · RSP Medical Billing" }] }),
  component: () => <StubPage title="Accounts" desc="Income, expense, cash book and daily collection." />,
});
