import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search, ScanBarcode, QrCode, Plus, Trash2, Save, Printer, PauseCircle, X,
  Percent, Keyboard, User, Phone, Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { MEDICINES, type Medicine } from "@/data/medicines";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Billing · RSP Medical Billing" },
      { name: "description", content: "Fast keyboard-driven billing counter for medical stores." },
    ],
  }),
  component: BillingPage,
});

type LineItem = Medicine & { qty: number; discount: number };

function invoiceNo() {
  return "INV" + Math.floor(10000 + Math.random() * 89999);
}

function BillingPage() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [customer, setCustomer] = useState({ name: "", phone: "", doctor: "" });
  const [payment, setPayment] = useState("cash");
  const [inv, setInv] = useState(invoiceNo);
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return MEDICINES.filter(
      (m) => m.name.toLowerCase().includes(q) || m.batch.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [query]);

  const addItem = (m: Medicine) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === m.id);
      if (found) return prev.map((i) => (i.id === m.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { ...m, qty: 1, discount: 0 }];
    });
    setQuery("");
  };

  const updateItem = (id: string, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const totals = useMemo(() => {
    let sub = 0, disc = 0, gst = 0;
    for (const it of items) {
      const line = it.mrp * it.qty;
      const d = (line * it.discount) / 100;
      const taxable = line - d;
      const g = (taxable * it.gst) / 100;
      sub += line;
      disc += d;
      gst += g;
    }
    const beforeRound = sub - disc + gst;
    const grand = Math.round(beforeRound);
    return { sub, disc, gst, round: grand - beforeRound, grand };
  }, [items]);

  const clear = () => {
    setItems([]);
    setCustomer({ name: "", phone: "", doctor: "" });
    setInv(invoiceNo());
    setPayment("cash");
  };

  const saveBill = () => {
    if (items.length === 0) return toast.error("Add at least one medicine");
    toast.success(`Bill ${inv} saved · ₹${totals.grand.toLocaleString("en-IN")}`);
    clear();
  };

  return (
    <div className="p-4 lg:p-6 grid gap-4 xl:grid-cols-[1fr_360px]">
      {/* MAIN COLUMN */}
      <div className="space-y-4 min-w-0">
        {/* Header meta */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 grid place-items-center rounded-lg bg-primary/10 text-primary">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Invoice No.</div>
                <div className="font-semibold tracking-tight">{inv}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Date</div>
              <div className="font-medium">{today}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Counter</div>
              <div className="font-medium">Counter 1 · Manjju</div>
            </div>
            <Badge variant="secondary" className="gap-1.5">
              <Keyboard className="h-3.5 w-3.5" /> F2 New · F9 Save · F10 Print
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 mt-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Customer</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Walk-in customer"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="+91"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Doctor</Label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Dr. Referred by"
                  value={customer.doctor}
                  onChange={(e) => setCustomer({ ...customer, doctor: e.target.value })}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Search */}
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                className="pl-9 h-11 text-base"
                placeholder="Search medicine name, salt or batch…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && suggestions[0]) addItem(suggestions[0]);
                }}
              />
            </div>
            <Button variant="outline" className="h-11" onClick={() => toast("Point scanner at barcode")}>
              <ScanBarcode className="h-4 w-4 mr-1.5" /> Barcode
            </Button>
            <Button variant="outline" className="h-11" onClick={() => toast("Open QR scanner")}>
              <QrCode className="h-4 w-4 mr-1.5" /> QR
            </Button>
          </div>

          {suggestions.length > 0 && (
            <div className="mt-2 rounded-lg border bg-card divide-y">
              {suggestions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => addItem(m)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted text-left"
                >
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.company} · Batch {m.batch} · Exp {m.expiry}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded",
                        m.stock < 20
                          ? "bg-[color:var(--warning)]/15 text-[color:var(--warning)]"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      Stock {m.stock}
                    </span>
                    <span className="text-sm font-semibold">₹{m.mrp}</span>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Line items */}
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Medicine</TableHead>
                <TableHead className="w-24">Batch</TableHead>
                <TableHead className="w-20 text-center">Qty</TableHead>
                <TableHead className="w-24 text-right">MRP</TableHead>
                <TableHead className="w-24 text-center">Disc %</TableHead>
                <TableHead className="w-20 text-center">GST</TableHead>
                <TableHead className="w-28 text-right">Total</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    Search or scan a medicine to add to the bill.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((it) => {
                  const line = it.mrp * it.qty;
                  const d = (line * it.discount) / 100;
                  const tax = ((line - d) * it.gst) / 100;
                  const total = line - d + tax;
                  return (
                    <TableRow key={it.id}>
                      <TableCell>
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-muted-foreground">{it.company}</div>
                      </TableCell>
                      <TableCell className="text-sm">{it.batch}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={it.qty}
                          onChange={(e) =>
                            updateItem(it.id, { qty: Math.max(1, Number(e.target.value) || 1) })
                          }
                          className="h-8 text-center"
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">₹{it.mrp}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={it.discount}
                          onChange={(e) =>
                            updateItem(it.id, { discount: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })
                          }
                          className="h-8 text-center"
                        />
                      </TableCell>
                      <TableCell className="text-center text-sm">{it.gst}%</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        ₹{total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(it.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* SUMMARY / SIDEBAR */}
      <div className="space-y-4 xl:sticky xl:top-0 xl:self-start">
        <Card className="p-5">
          <div className="text-sm font-semibold mb-3">Bill Summary</div>
          <div className="space-y-2 text-sm">
            <Row label="Sub Total" value={totals.sub} />
            <Row label="Discount" value={-totals.disc} accent="warning" />
            <Row label="GST" value={totals.gst} />
            <Row label="Round Off" value={totals.round} muted />
            <div className="border-t pt-3 mt-2 flex items-center justify-between">
              <span className="font-semibold">Grand Total</span>
              <span className="text-2xl font-bold tracking-tight text-primary tabular-nums">
                ₹{totals.grand.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-semibold mb-3">Payment Method</div>
          <RadioGroup value={payment} onValueChange={setPayment} className="grid grid-cols-2 gap-2">
            {[
              { v: "cash", l: "Cash" },
              { v: "upi", l: "UPI" },
              { v: "phonepe", l: "PhonePe" },
              { v: "gpay", l: "Google Pay" },
              { v: "paytm", l: "Paytm" },
              { v: "card", l: "Card" },
            ].map((p) => (
              <label
                key={p.v}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors",
                  payment === p.v ? "border-primary bg-primary/5" : "hover:bg-muted",
                )}
              >
                <RadioGroupItem value={p.v} />
                {p.l}
              </label>
            ))}
          </RadioGroup>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Button className="h-11" onClick={saveBill}>
            <Save className="h-4 w-4 mr-1.5" /> Save Bill
          </Button>
          <Button variant="outline" className="h-11" onClick={() => toast("Sent to printer")}>
            <Printer className="h-4 w-4 mr-1.5" /> Print
          </Button>
          <Button variant="outline" className="h-11" onClick={() => toast("Bill held")}>
            <PauseCircle className="h-4 w-4 mr-1.5" /> Hold
          </Button>
          <Button variant="ghost" className="h-11 text-destructive hover:text-destructive" onClick={clear}>
            <X className="h-4 w-4 mr-1.5" /> Cancel
          </Button>
        </div>

        <Card className="p-4 bg-[color:var(--warning)]/10 border-[color:var(--warning)]/30">
          <div className="flex items-start gap-2 text-sm">
            <Percent className="h-4 w-4 mt-0.5 text-[color:var(--warning)]" />
            <div>
              <div className="font-medium">GST auto-applied per medicine</div>
              <div className="text-muted-foreground text-xs mt-0.5">
                Rates are pulled from Medicine Master. Change in Settings → GST.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label, value, accent, muted,
}: { label: string; value: number; accent?: "warning"; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span
        className={cn(
          "tabular-nums",
          accent === "warning" && "text-[color:var(--warning)]",
          muted && "text-muted-foreground",
        )}
      >
        ₹{value.toFixed(2)}
      </span>
    </div>
  );
}
