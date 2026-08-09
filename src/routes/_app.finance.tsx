import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PiggyBank, Plus, Trash2, TrendingUp, TrendingDown, Wallet, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { actions, useStore, useHydrated } from "@/lib/store";
import { useAccount } from "@/lib/account";

export const Route = createFileRoute("/_app/finance")({
  head: () => ({
    meta: [
      { title: "Income & Expense · RSP Billing" },
      { name: "description", content: "Track every income and expense of your business with monthly and yearly totals, net profit and printable reports." },
      { property: "og:title", content: "Income & Expense · RSP Billing" },
      { property: "og:description", content: "Business income, expenses, net profit and printable monthly or yearly reports." },
    ],
  }),
  component: FinancePage,
});

const INCOME_CATEGORIES = ["Sales", "Counter Sale", "Online Order", "Other Income"];
const EXPENSE_CATEGORIES = ["Purchase", "Salary", "Rent", "Electricity", "Gas / Fuel", "Transport", "Maintenance", "Marketing", "Tax", "Other Expense"];
const PAYMENTS = ["Cash", "UPI", "Card", "Bank"];

const money = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const today = () => new Date().toISOString().slice(0, 10);

function FinancePage() {
  const hydrated = useHydrated();
  const finance = useStore((s) => s.finance);
  const sales = useStore((s) => s.sales);
  const { me, account, has } = useAccount();
  const hotelId = me?.hotelId ?? "";

  const [range, setRange] = useState<"month" | "year">("month");
  const [period, setPeriod] = useState(today().slice(0, 7)); // yyyy-mm
  const [year, setYear] = useState(today().slice(0, 4));
  const [kindFilter, setKindFilter] = useState<"all" | "income" | "expense">("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    kind: "expense" as "income" | "expense",
    title: "", category: "Other Expense", amount: "", payment: "Cash", date: today(), note: "",
  });

  const mine = useMemo(
    () => finance.filter((f) => !hotelId || f.hotelId === hotelId),
    [finance, hotelId],
  );

  const prefix = range === "month" ? period : year;
  const inPeriod = useMemo(
    () => mine.filter((f) => f.date.startsWith(prefix)),
    [mine, prefix],
  );
  const rows = useMemo(
    () => inPeriod
      .filter((f) => kindFilter === "all" || f.kind === kindFilter)
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date)),
    [inPeriod, kindFilter],
  );

  const billIncome = useMemo(
    () => sales
      .filter((s) => s.status === "paid" && (!hotelId || s.hotelId === hotelId) && s.date.startsWith(prefix))
      .reduce((t, s) => t + s.grand, 0),
    [sales, hotelId, prefix],
  );
  const income = inPeriod.filter((f) => f.kind === "income").reduce((t, f) => t + f.amount, 0) + billIncome;
  const expense = inPeriod.filter((f) => f.kind === "expense").reduce((t, f) => t + f.amount, 0);
  const net = income - expense;

  const save = () => {
    const amount = Number(form.amount);
    if (!form.title.trim()) return toast.error("Enter a title");
    if (!Number.isFinite(amount) || amount <= 0) return toast.error("Enter a valid amount");
    actions.addFinance(
      {
        hotelId: hotelId || "H001", date: form.date, kind: form.kind,
        title: form.title.trim(), category: form.category, amount,
        payment: form.payment, note: form.note.trim() || undefined,
      },
      me ? { id: me.id, name: me.name } : undefined,
    );
    toast.success(form.kind === "income" ? "Income added" : "Expense added");
    setForm({ ...form, title: "", amount: "", note: "" });
    setOpen(false);
  };

  const openFor = (kind: "income" | "expense") => {
    setForm({
      kind, title: "", amount: "", payment: "Cash", date: today(), note: "",
      category: kind === "income" ? "Other Income" : "Other Expense",
    });
    setOpen(true);
  };

  if (!hydrated) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  if (!has("finance")) {
    return (
      <div className="p-6">
        <Card className="p-6 max-w-lg">
          <h1 className="text-lg font-semibold">Not enabled</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Income &amp; Expense is not part of your plan. Ask RSP Software to enable it.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" /> Income &amp; Expense
          </h1>
          <p className="text-sm text-muted-foreground">
            {account?.name ?? "Your business"} — every rupee in and out, with monthly and yearly totals.
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Print report
          </Button>
          <Button variant="outline" onClick={() => openFor("income")}>
            <Plus className="h-4 w-4 mr-1" /> Income
          </Button>
          <Button onClick={() => openFor("expense")}>
            <Plus className="h-4 w-4 mr-1" /> Expense
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            Total income <TrendingUp className="h-4 w-4 text-[color:var(--success,var(--primary))]" />
          </div>
          <div className="text-2xl font-semibold">{money(income)}</div>
          <div className="text-xs text-muted-foreground">Includes {money(billIncome)} from bills</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            Total expenses <TrendingDown className="h-4 w-4 text-destructive" />
          </div>
          <div className="text-2xl font-semibold">{money(expense)}</div>
          <div className="text-xs text-muted-foreground">Purchases, salary, rent and more</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            Net profit / balance <Wallet className="h-4 w-4" />
          </div>
          <div className={"text-2xl font-semibold " + (net < 0 ? "text-destructive" : "")}>{money(net)}</div>
          <div className="text-xs text-muted-foreground">{net < 0 ? "Net loss" : "Net profit"}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            Entries <FileText className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold">{rows.length}</div>
          <div className="text-xs text-muted-foreground">In selected period</div>
        </Card>
      </div>

      <Card className="p-3 flex flex-wrap items-end gap-3 print:hidden">
        <div className="space-y-1.5">
          <Label>Report</Label>
          <Select value={range} onValueChange={(v) => setRange(v as "month" | "year")}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {range === "month" ? (
          <div className="space-y-1.5">
            <Label>Month</Label>
            <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-44" />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label>Year</Label>
            <Input inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} className="w-28" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as typeof kindFilter)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <div className="p-3 border-b">
          <div className="font-semibold text-sm">Finance &amp; transaction history</div>
          <div className="text-xs text-muted-foreground">
            {range === "month" ? `Month ${prefix}` : `Year ${prefix}`}
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Title &amp; category</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right print:hidden">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="whitespace-nowrap">{f.date}</TableCell>
                <TableCell>
                  <Badge variant={f.kind === "income" ? "default" : "secondary"}>
                    {f.kind === "income" ? "Income" : "Expense"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{f.title}</div>
                  <div className="text-xs text-muted-foreground">{f.category}{f.note ? ` · ${f.note}` : ""}</div>
                </TableCell>
                <TableCell>{f.payment}</TableCell>
                <TableCell className={"text-right font-semibold " + (f.kind === "expense" ? "text-destructive" : "")}>
                  {f.kind === "expense" ? "-" : "+"} {money(f.amount)}
                </TableCell>
                <TableCell className="text-right print:hidden">
                  <Button
                    size="icon" variant="ghost"
                    onClick={() => {
                      if (!confirm("Delete this entry?")) return;
                      actions.deleteFinance(f.id, me ? { id: me.id, name: me.name } : undefined);
                      toast.success("Entry deleted");
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  No entries in this period yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.kind === "income" ? "Add income" : "Add expense"}</DialogTitle>
            <DialogDescription>This entry is saved only for your business.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={form.kind === "income" ? "Counter collection" : "Electricity bill"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount (₹)</Label>
                <Input inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(form.kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Payment mode</Label>
                <Select value={form.payment} onValueChange={(v) => setForm({ ...form, payment: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Note (optional)</Label>
              <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
