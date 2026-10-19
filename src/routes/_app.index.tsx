import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { LOOSE_UNITS } from "@/lib/business";
import {
  UtensilsCrossed, Search, ScanBarcode, Plus, Minus, Trash2, Printer, ChevronLeft, ChevronRight, Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { actions, useStore, useHydrated, type MenuItem, type SaleItem } from "@/lib/store";
import { getUser } from "@/lib/auth";
import { useAccount } from "@/lib/account";
import { printReceipt } from "@/lib/print";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Billing · RSP SuperBill" },
      { name: "description", content: "Tap an item to bill it. Instant totals, cash or UPI payment, and fast thermal receipt printing." },
      { property: "og:title", content: "Billing · RSP SuperBill" },
      { property: "og:description", content: "Fast billing with instant totals and one-tap receipt printing." },
    ],
  }),
  component: BillingPage,
});

const PAGE_SIZE = 10;

type Line = { item: MenuItem; qty: number };

function BillingPage() {
  const hydrated = useHydrated();
  const menuItems = useStore((s) => s.menuItems);
  const printer = useStore((s) => s.printer);
  const { labels } = useAccount();
  const photoMode = labels.billingMode === "photo";
  const scanRef = useRef<HTMLInputElement>(null);
  const [me, setMe] = useState<ReturnType<typeof getUser>>(null);
  useEffect(() => setMe(getUser()), []);

  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);
  const [table, setTable] = useState("");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState("Cash");
  const [discPct, setDiscPct] = useState("0");
  const [lastBill, setLastBill] = useState<string | null>(null);

  const hotelId = me?.hotelId ?? "";

  const available = useMemo(
    () => menuItems.filter((m) => (m.active ?? true) && (!hotelId || m.hotelId === hotelId)),
    [menuItems, hotelId],
  );
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(available.map((m) => m.category)))],
    [available],
  );
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return available.filter(
      (m) => (cat === "All" || m.category === cat) && (!t || m.name.toLowerCase().includes(t) || (m.barcode ?? "") === q.trim()),
    );
  }, [available, cat, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => setPage(0), [cat, q]);

  const add = (item: MenuItem) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.item.id === item.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + 1 };
        return next;
      }
      return [...prev, { item, qty: 1 }];
    });
    if (!photoMode) setTimeout(() => scanRef.current?.focus(), 0);
  };
  const setQty = (id: string, delta: number) =>
    setLines((prev) =>
      prev
        .map((l) => (l.item.id === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  const remove = (id: string) => setLines((prev) => prev.filter((l) => l.item.id !== id));

  const sub = lines.reduce((t, l) => t + l.item.price * l.qty, 0);
  const disc = Math.round(sub * (Number(discPct) || 0)) / 100;
  const grand = Math.max(0, Math.round(sub - disc));

  const saveBill = (print: boolean) => {
    if (lines.length === 0) return toast.error("Add at least one item");
    const items: SaleItem[] = lines.map((l) => ({
      id: l.item.id, name: l.item.name, batch: l.item.category, qty: l.qty,
      mrp: l.item.price, gst: 0, discount: 0, total: l.item.price * l.qty,
    }));
    const sale = actions.saveSale(
      {
        customerId: null,
        customerName: photoMode ? (table.trim() ? `Table ${table.trim()}` : "Counter") : (customer.trim() || "Walk-in"),
        phone: photoMode ? "" : phone.trim(),
        table: table.trim() || undefined,
        items, sub, disc, gst: 0, grand, payment,
        hotelId: hotelId || undefined,
      },
      me ? { id: me.id, name: me.name } : undefined,
    );
    setLastBill(sale.id);
    setLines([]);
    setTable("");
    setCustomer("");
    setPhone("");
    setDiscPct("0");
    toast.success(`Bill ${sale.id} saved · ₹${grand}`);
    if (print) printReceipt(sale, { ...printer, storeName: me?.store || printer.storeName });
  };

  // Fast print: F10 saves and prints straight away.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F10") { e.preventDefault(); saveBill(true); }
      if (e.key === "F9") { e.preventDefault(); saveBill(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!hydrated) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-0">
      {/* Item grid — scrolls when there are many items */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <div className="p-4 sm:p-6 pb-3 flex flex-wrap items-center justify-between gap-3 border-b">
          <div>
            <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" /> Billing
            </h1>
            <p className="text-sm text-muted-foreground">
              {photoMode ? "Tap an item photo to add it to the bill." : "Search or scan an item to add it to the bill."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              {photoMode ? <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /> : <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />}
              <Input
                ref={scanRef}
                autoFocus={!photoMode}
                className={photoMode ? "pl-9 w-44" : "pl-9 w-64 h-11 text-base"}
                placeholder={photoMode ? "Search item" : "Scan barcode or type name"}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  const code = q.trim();
                  const hit = available.find((m) => m.barcode && m.barcode === code) ?? filtered[0];
                  if (hit) { add(hit); setQ(""); }
                  else if (code) { toast.error(`No item for "${code}"`); setQ(""); }
                }}
              />
            </div>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {visible.map((m) => (
              <button
                key={m.id} type="button" onClick={() => add(m)}
                className="group text-left rounded-xl border bg-card overflow-hidden transition hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {photoMode && (
                  <div className="h-28 w-full bg-muted grid place-items-center overflow-hidden">
                    {m.photo ? (
                      <img src={m.photo} alt={m.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                    ) : (
                      <UtensilsCrossed className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>
                )}
                <div className="p-2.5">
                  <div className="text-sm font-medium truncate" title={m.name}>{m.name}</div>
                  <div className="mt-0.5 flex items-center justify-between">
                    <span className="text-sm font-semibold">₹{m.price}<span className="text-xs font-normal text-muted-foreground">/{m.size || m.unit || "pcs"}</span></span>
                    <Badge variant="secondary" className="text-[10px]">{m.category}</Badge>
                  </div>
                </div>
              </button>
            ))}
            {visible.length === 0 && (
              <Card className="col-span-full p-8 text-center text-sm text-muted-foreground">
                No items yet. Add them from {labels.items}.
              </Card>
            )}
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-3 pt-1">
              <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground">Page {current + 1} of {pages} · 10 per page</span>
              <Button variant="outline" size="sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bill panel */}
      <aside className="w-full lg:w-[380px] shrink-0 border-t lg:border-t-0 lg:border-l bg-card flex flex-col min-h-0">
        <div className="p-4 border-b space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">{photoMode ? "Table / Room" : "Table / Ref"}</Label>
              <Input value={table} onChange={(e) => setTable(e.target.value)} placeholder="T1" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Payment</Label>
              <Select value={payment} onValueChange={setPayment}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Razorpay">Razorpay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {!photoMode && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Customer</Label>
                <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Walk-in" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone</Label>
                <Input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          <div className="divide-y">
            {lines.map((l) => (
              <div key={l.item.id} className="flex items-center gap-2 p-3">
                <div className="h-10 w-10 shrink-0 rounded-md bg-muted overflow-hidden grid place-items-center">
                  {l.item.photo ? (
                    <img src={l.item.photo} alt={l.item.name} className="h-full w-full object-cover" />
                  ) : (
                    <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{l.item.name}</div>
                  <div className="text-xs text-muted-foreground">₹{l.item.price}/{l.item.unit || "pcs"} × {l.qty} {LOOSE_UNITS.includes(l.item.unit ?? "") ? l.item.unit : ""}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(l.item.id, -1)}>
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <input
                    aria-label={`Quantity of ${l.item.name}`}
                    inputMode="decimal"
                    className="w-12 rounded border bg-background text-center text-sm h-7"
                    value={l.qty}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isFinite(v) || v < 0) return;
                      setLines((prev) => prev.map((x) => (x.item.id === l.item.id ? { ...x, qty: v } : x)));
                    }}
                    onBlur={() => setLines((prev) => prev.filter((x) => x.qty > 0))}
                  />
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(l.item.id, 1)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="w-16 text-right text-sm font-semibold">₹{Math.round(l.item.price * l.qty * 100) / 100}</div>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(l.item.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          {/* Empty space is used for quick-add items */}
          {lines.length === 0 && (
            <div className="p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Quick add
              </div>
              <div className="mt-2 grid gap-2">
                {available.slice(0, 8).map((m) => (
                  <button
                    key={m.id} type="button" onClick={() => add(m)}
                    className="flex items-center gap-2 rounded-lg border p-2 text-left hover:border-primary hover:bg-accent/40 transition"
                  >
                    <div className="h-9 w-9 shrink-0 rounded-md bg-muted overflow-hidden grid place-items-center">
                      {m.photo ? (
                        <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
                      ) : (
                        <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.category}</div>
                    </div>
                    <div className="text-sm font-semibold">₹{m.price}</div>
                  </button>
                ))}
                {available.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No items yet. Add them from {labels.items}.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Items</span>
            <span>{lines.reduce((t, l) => t + l.qty, 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span><span>₹{sub.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Discount %</span>
            <Input
              className="h-8 w-20 text-right" inputMode="decimal"
              value={discPct} onChange={(e) => setDiscPct(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-baseline border-t pt-2">
            <span className="font-medium">Amount</span>
            <span className="text-3xl font-semibold">₹{grand.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="outline" className="h-11" onClick={() => saveBill(false)}>Save (F9)</Button>
            <Button className="h-11 text-base" onClick={() => saveBill(true)}>
              <Printer className="h-4 w-4 mr-1" /> Print (F10)
            </Button>
          </div>
          {lastBill && (
            <p className="text-center text-xs text-muted-foreground">Last bill: {lastBill}</p>
          )}
        </div>
      </aside>
    </div>
  );
}
