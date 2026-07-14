import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PackageSearch, Search, AlertTriangle, CalendarClock, Boxes } from "lucide-react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_app/inventory")({
  head: () => ({ meta: [{ title: "Inventory · RSP Medical Billing" }] }),
  component: InventoryPage,
});

function InventoryPage() {
  const meds = useStore((s) => s.medicines);
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const total = meds.reduce((n, m) => n + m.stock, 0);
    const value = meds.reduce((n, m) => n + m.stock * m.mrp, 0);
    const low = meds.filter((m) => m.stock < 20).length;
    const soon = meds.filter((m) => {
      const [y, mo] = m.expiry.split("-").map(Number);
      const exp = new Date(y, (mo ?? 1) - 1, 1).getTime();
      return exp - Date.now() < 1000 * 60 * 60 * 24 * 180; // 6 months
    }).length;
    return { total, value, low, soon };
  }, [meds]);

  const filter = (list: typeof meds) => {
    const q = query.toLowerCase().trim();
    if (!q) return list;
    return list.filter((m) => [m.name, m.batch, m.company].some((v) => v.toLowerCase().includes(q)));
  };

  const all = filter(meds);
  const low = filter(meds.filter((m) => m.stock < 20));
  const expiring = filter(
    meds.filter((m) => {
      const [y, mo] = m.expiry.split("-").map(Number);
      return new Date(y, (mo ?? 1) - 1, 1).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 180;
    }),
  );

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <PackageSearch className="h-6 w-6 text-primary" /> Inventory
        </h1>
        <p className="text-sm text-muted-foreground">Live stock, batches, expiry alerts and stock value.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Boxes} label="SKUs" value={meds.length.toString()} tone="info" />
        <Stat icon={Boxes} label="Units in stock" value={stats.total.toLocaleString("en-IN")} tone="primary" />
        <Stat icon={AlertTriangle} label="Low stock" value={stats.low.toString()} tone="warning" />
        <Stat icon={CalendarClock} label="Expiring < 6 mo" value={stats.soon.toString()} tone="warning" />
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search inventory…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="text-sm text-muted-foreground">
            Total value: <b className="text-foreground tabular-nums">₹{stats.value.toLocaleString("en-IN")}</b>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({all.length})</TabsTrigger>
            <TabsTrigger value="low">Low Stock ({low.length})</TabsTrigger>
            <TabsTrigger value="expiring">Expiring ({expiring.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all"><StockTable list={all} /></TabsContent>
          <TabsContent value="low"><StockTable list={low} /></TabsContent>
          <TabsContent value="expiring"><StockTable list={expiring} /></TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

function StockTable({ list }: { list: any[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Medicine</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead className="text-center">Stock</TableHead>
            <TableHead className="text-right">MRP</TableHead>
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.company}</div>
              </TableCell>
              <TableCell className="text-sm">{m.batch}</TableCell>
              <TableCell className="text-sm">{m.expiry}</TableCell>
              <TableCell className="text-center">
                <Badge variant={m.stock < 20 ? "destructive" : "secondary"}>{m.stock}</Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">₹{m.mrp}</TableCell>
              <TableCell className="text-right tabular-nums">₹{(m.mrp * m.stock).toLocaleString("en-IN")}</TableCell>
            </TableRow>
          ))}
          {list.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No items.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: any) {
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
      <div className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}
