import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import {
  IndianRupee, Receipt, ShoppingCart, TrendingUp, Boxes, AlertTriangle, CalendarClock,
  Users, Plus, Printer, DatabaseBackup, UserPlus, Pill, Truck,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · RSP Medical Billing" }] }),
  component: Dashboard,
});

const STATS = [
  { label: "Today's Sales", value: "₹52,450", icon: IndianRupee, tone: "primary" as const, delta: "+12%" },
  { label: "Today's Bills", value: "48", icon: Receipt, tone: "info" as const, delta: "+6" },
  { label: "Purchase", value: "₹32,000", icon: ShoppingCart, tone: "info" as const },
  { label: "Today's Profit", value: "₹20,450", icon: TrendingUp, tone: "primary" as const, delta: "+8%" },
  { label: "Stock Items", value: "5,820", icon: Boxes, tone: "info" as const },
  { label: "Low Stock", value: "12", icon: AlertTriangle, tone: "warning" as const },
  { label: "Expiry Medicines", value: "18", icon: CalendarClock, tone: "warning" as const },
  { label: "Today's Customers", value: "45", icon: Users, tone: "primary" as const },
];

const TONE: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  info: "bg-[color:var(--info)]/10 text-[color:var(--info)]",
  warning: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
};

const RECENT_BILLS = [
  ["INV10254", "Ravi Kumar", "₹1,250", "UPI", "12:42 PM"],
  ["INV10253", "Walk-in", "₹340", "Cash", "12:31 PM"],
  ["INV10252", "Sujatha S.", "₹2,890", "PhonePe", "12:12 PM"],
  ["INV10251", "K. Mohan", "₹560", "Cash", "11:55 AM"],
  ["INV10250", "Priya R.", "₹1,120", "GPay", "11:20 AM"],
];

const LOW_STOCK = [
  ["Amlodipine 5mg", "AM55", 8, "Torrent"],
  ["Ranitidine 150mg", "RN15", 4, "GSK"],
  ["Azithromycin 500mg", "AZ88", 12, "Sun"],
];

function Dashboard() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview for ANAM Medical Store · KL Road branch · Today
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild><Link to="/"><Plus className="h-4 w-4 mr-1.5" /> New Bill</Link></Button>
          <Button asChild variant="outline"><Link to="/purchase"><Truck className="h-4 w-4 mr-1.5" /> Purchase</Link></Button>
          <Button asChild variant="outline"><Link to="/medicines"><Pill className="h-4 w-4 mr-1.5" /> Add Medicine</Link></Button>
          <Button asChild variant="outline"><Link to="/customers"><UserPlus className="h-4 w-4 mr-1.5" /> Customer</Link></Button>
          <Button asChild variant="outline"><Link to="/reports"><Printer className="h-4 w-4 mr-1.5" /> Reports</Link></Button>
          <Button asChild variant="outline"><Link to="/backup"><DatabaseBackup className="h-4 w-4 mr-1.5" /> Backup</Link></Button>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-start justify-between">
              <div className={`h-9 w-9 grid place-items-center rounded-lg ${TONE[s.tone]}`}>
                <s.icon className="h-5 w-5" />
              </div>
              {s.delta && (
                <Badge variant="secondary" className="text-[10px]">{s.delta}</Badge>
              )}
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Recent Bills</div>
            <Button size="sm" variant="ghost">View all</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RECENT_BILLS.map((r) => (
                <TableRow key={r[0]}>
                  <TableCell className="font-medium">{r[0]}</TableCell>
                  <TableCell>{r[1]}</TableCell>
                  <TableCell className="tabular-nums">{r[2]}</TableCell>
                  <TableCell><Badge variant="secondary">{r[3]}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{r[4]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-[color:var(--warning)]" />
            <div className="font-semibold">Low Stock Alerts</div>
          </div>
          <ul className="space-y-2 text-sm">
            {LOW_STOCK.map((r) => (
              <li key={r[1] as string} className="flex items-center justify-between rounded-md border p-2.5">
                <div>
                  <div className="font-medium">{r[0]}</div>
                  <div className="text-xs text-muted-foreground">Batch {r[1]} · {r[3]}</div>
                </div>
                <span className="text-[color:var(--warning)] font-semibold">{r[2]} left</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
