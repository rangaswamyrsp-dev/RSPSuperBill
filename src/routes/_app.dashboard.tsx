import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IndianRupee, Receipt, TrendingUp, Boxes, AlertTriangle, CalendarClock,
  Users, Plus, Printer, DatabaseBackup, UserPlus, Package, Truck, PiggyBank,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useStore, useHydrated } from "@/lib/store";
import { getUser } from "@/lib/auth";
import { useAccount } from "@/lib/account";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · RSP SuperBill" },
      { name: "description", content: "Today's sales, bills, profit and stock summary for your business." },
      { property: "og:title", content: "Dashboard · RSP SuperBill" },
      { property: "og:description", content: "Daily business summary: sales, bills, income and expenses." },
    ],
  }),
  component: Dashboard,
});

const TONE: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  info: "bg-[color:var(--info)]/10 text-[color:var(--info)]",
  warning: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
};

const money = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

function Dashboard() {
  const hydrated = useHydrated();
  const { account, labels, has, businessType } = useAccount();
  const sales = useStore((s) => s.sales);
  const menuItems = useStore((s) => s.menuItems);
  const medicines = useStore((s) => s.medicines);
  const finance = useStore((s) => s.finance);
  const [me, setMe] = useState<ReturnType<typeof getUser>>(null);
  useEffect(() => setMe(getUser()), []);

  const hotelId = me?.hotelId ?? "";
  const today = new Date().toISOString().slice(0, 10);

  const mySales = useMemo(
    () => sales.filter((s) => (!hotelId || s.hotelId === hotelId) && s.status !== "cancelled"),
    [sales, hotelId],
  );
  const todaySales = mySales.filter((s) => (s.date ?? "").slice(0, 10) === today);
  const revenue = todaySales.reduce((t, s) => t + s.grand, 0);
  const myItems = menuItems.filter((m) => !hotelId || m.hotelId === hotelId);
  const myFinance = finance.filter((f) => !hotelId || f.hotelId === hotelId);
  const monthKey = today.slice(0, 7);
  const income = myFinance.filter((f) => f.kind === "income" && f.date.startsWith(monthKey))
    .reduce((t, f) => t + f.amount, 0);
  const expense = myFinance.filter((f) => f.kind === "expense" && f.date.startsWith(monthKey))
    .reduce((t, f) => t + f.amount, 0);
  const customersToday = new Set(todaySales.map((s) => s.phone || s.id)).size;

  const stockMode = false;
  const lowStock: never[] = [];

  const stats: { label: string; value: string; icon: any; tone: keyof typeof TONE }[] = [
    { label: "Today's Sales", value: money(revenue), icon: IndianRupee, tone: "primary" },
    { label: "Today's Bills", value: String(todaySales.length), icon: Receipt, tone: "info" },
    { label: `${labels.items} listed`, value: String(myItems.length), icon: Boxes, tone: "info" },
    { label: "Today's Customers", value: String(customersToday), icon: Users, tone: "primary" },
  ];
  if (has("finance")) {
    stats.push({ label: "Income (this month)", value: money(income), icon: TrendingUp, tone: "primary" });
    stats.push({ label: "Expense (this month)", value: money(expense), icon: PiggyBank, tone: "warning" });
  }

  if (!hydrated) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {account?.name ?? me?.store ?? "Your business"}
            {account?.city ? ` · ${account.city}` : ""} · {businessType} · Today
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {has("billing") && <Button asChild><Link to="/"><Plus className="h-4 w-4 mr-1.5" /> New Bill</Link></Button>}
          {has("purchase") && <Button asChild variant="outline"><Link to="/purchase"><Truck className="h-4 w-4 mr-1.5" /> Purchase</Link></Button>}
          {has("items") && (
            <Button asChild variant="outline">
              <Link to="/items"><Package className="h-4 w-4 mr-1.5" /> {labels.items}</Link>
            </Button>
          )}
          {has("customers") && <Button asChild variant="outline"><Link to="/customers"><UserPlus className="h-4 w-4 mr-1.5" /> Customer</Link></Button>}
          {has("reports") && <Button asChild variant="outline"><Link to="/reports"><Printer className="h-4 w-4 mr-1.5" /> Reports</Link></Button>}
          {has("backup") && <Button asChild variant="outline"><Link to="/backup"><DatabaseBackup className="h-4 w-4 mr-1.5" /> Backup</Link></Button>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className={`h-9 w-9 grid place-items-center rounded-lg ${TONE[s.tone]}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Recent bills — its own section */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Recent Bills</div>
          {has("sales") && <Button size="sm" variant="ghost" asChild><Link to="/sales">View all</Link></Button>}
        </div>
        {mySales.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No bills yet. Open Billing to make your first bill.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill No</TableHead>
                <TableHead>Table / Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...mySales].reverse().slice(0, 8).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.id}</TableCell>
                  <TableCell>{s.table ? `Table ${s.table}` : s.customerName || "—"}</TableCell>
                  <TableCell className="tabular-nums">{money(s.grand)}</TableCell>
                  <TableCell><Badge variant="secondary">{s.payment}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{(s.date ?? "").slice(0, 16).replace("T", " ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

    </div>
  );
}
