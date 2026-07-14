import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BarChart3, IndianRupee, Receipt, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports · RSP Medical Billing" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const sales = useStore((s) => s.sales);
  const purchases = useStore((s) => s.purchases);

  const daily = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    sales.filter((s) => s.status !== "cancelled").forEach((s) => {
      const k = s.date.slice(0, 10);
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + s.grand);
    });
    return Array.from(map, ([date, amount]) => ({
      date: new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      amount,
    }));
  }, [sales]);

  const payments = useMemo(() => {
    const map: Record<string, number> = {};
    sales.filter((s) => s.status !== "cancelled").forEach((s) => {
      map[s.payment] = (map[s.payment] ?? 0) + s.grand;
    });
    return Object.entries(map).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, [sales]);

  const topItems = useMemo(() => {
    const map = new Map<string, { qty: number; revenue: number }>();
    sales.filter((s) => s.status !== "cancelled").forEach((s) => {
      s.items.forEach((it) => {
        const cur = map.get(it.name) ?? { qty: 0, revenue: 0 };
        cur.qty += it.qty;
        cur.revenue += it.total;
        map.set(it.name, cur);
      });
    });
    return Array.from(map, ([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [sales]);

  const totalRev = sales.filter((s) => s.status !== "cancelled").reduce((n, s) => n + s.grand, 0);
  const totalPurchase = purchases.reduce((n, p) => n + p.total, 0);
  const profit = totalRev - totalPurchase;

  const COLORS = ["#22C55E", "#2563EB", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Reports
        </h1>
        <p className="text-sm text-muted-foreground">Sales, payment mix, top medicines and P&L.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPI icon={IndianRupee} label="Total Revenue" value={`₹${totalRev.toLocaleString("en-IN")}`} tone="primary" />
        <KPI icon={Receipt} label="Bills" value={sales.filter((s) => s.status !== "cancelled").length.toString()} tone="info" />
        <KPI icon={TrendingUp} label="Purchases" value={`₹${totalPurchase.toLocaleString("en-IN")}`} tone="info" />
        <KPI icon={TrendingUp} label="Gross Profit" value={`₹${profit.toLocaleString("en-IN")}`} tone={profit >= 0 ? "primary" : "warning"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="font-semibold mb-3">Last 7 days sales</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={daily}>
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                <Bar dataKey="amount" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="font-semibold mb-3">Payment mix</div>
          <div className="h-64">
            {payments.length ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={payments} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80}>
                    {payments.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="text-sm text-muted-foreground grid place-items-center h-full">No bills yet.</div>}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="font-semibold mb-3">Top selling medicines</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine</TableHead>
              <TableHead className="text-center">Units sold</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topItems.map((t) => (
              <TableRow key={t.name}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-center">{t.qty}</TableCell>
                <TableCell className="text-right tabular-nums">₹{t.revenue.toLocaleString("en-IN")}</TableCell>
              </TableRow>
            ))}
            {topItems.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Save a few bills to see reports.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function KPI({ icon: Icon, label, value, tone }: any) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    info: "bg-[color:var(--info)]/10 text-[color:var(--info)]",
    warning: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
  };
  return (
    <Card className="p-4">
      <div className={"h-9 w-9 grid place-items-center rounded-lg " + tones[tone]}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}
