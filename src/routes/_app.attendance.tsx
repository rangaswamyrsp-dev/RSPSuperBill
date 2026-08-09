import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarCheck, Wallet, Users, Trash2, IndianRupee, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { actions, useStore, useHydrated, type Employee } from "@/lib/store";
import { useAccount } from "@/lib/account";

export const Route = createFileRoute("/_app/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance & Salary · RSP Billing" },
      { name: "description", content: "Mark daily staff attendance, track leave and pay monthly salary with bonus and deductions for any business." },
      { property: "og:title", content: "Attendance & Salary · RSP Billing" },
      { property: "og:description", content: "Daily attendance register and monthly salary payouts for your staff." },
    ],
  }),
  component: AttendancePage,
});

const STATUS: { value: "full" | "half" | "absent" | "leave"; label: string }[] = [
  { value: "full", label: "Present (full day)" },
  { value: "half", label: "Half day" },
  { value: "leave", label: "Paid leave" },
  { value: "absent", label: "Absent" },
];
const PAYMENTS = ["Cash", "UPI", "Bank", "Card"];

const money = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const today = () => new Date().toISOString().slice(0, 10);

function AttendancePage() {
  const hydrated = useHydrated();
  const employees = useStore((s) => s.employees);
  const attendance = useStore((s) => s.attendance);
  const salaries = useStore((s) => s.salaries);
  const { me, account, has } = useAccount();
  const hotelId = me?.hotelId ?? "";
  const actor = me ? { id: me.id, name: me.name } : undefined;

  const [date, setDate] = useState(today());
  const [month, setMonth] = useState(today().slice(0, 7));
  const [payFor, setPayFor] = useState<Employee | null>(null);
  const [pay, setPay] = useState({ amount: "", bonus: "0", deduction: "0", payment: "Cash", paidOn: today() });

  const staff = useMemo(
    () => employees.filter((e) => (e.active ?? true) && (!hotelId || (e.hotelId ?? "H001") === hotelId)),
    [employees, hotelId],
  );
  const mineAtt = useMemo(
    () => attendance.filter((a) => !hotelId || a.hotelId === hotelId),
    [attendance, hotelId],
  );
  const dayMap = useMemo(() => {
    const m = new Map<string, (typeof mineAtt)[number]>();
    mineAtt.filter((a) => a.date === date).forEach((a) => m.set(a.employeeId, a));
    return m;
  }, [mineAtt, date]);

  const monthAtt = useMemo(() => mineAtt.filter((a) => a.date.startsWith(month)), [mineAtt, month]);
  const log = useMemo(
    () => mineAtt.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60),
    [mineAtt],
  );
  const mineSalaries = useMemo(
    () => salaries.filter((s) => (!hotelId || s.hotelId === hotelId) && s.month === month),
    [salaries, hotelId, month],
  );

  const presentToday = staff.filter((e) => {
    const s = dayMap.get(e.id)?.status;
    return s === "full" || s === "half";
  }).length;

  const daysWorked = (empId: string) =>
    monthAtt
      .filter((a) => a.employeeId === empId)
      .reduce((t, a) => t + (a.status === "full" || a.status === "leave" ? 1 : a.status === "half" ? 0.5 : 0), 0);

  const mark = (e: Employee, status: "full" | "half" | "absent" | "leave") => {
    actions.markAttendance(
      { hotelId: hotelId || "H001", employeeId: e.id, employeeName: e.name, date, status },
      actor,
    );
    toast.success(`${e.name} — ${STATUS.find((s) => s.value === status)!.label}`);
  };

  const openPay = (e: Employee) => {
    setPayFor(e);
    setPay({ amount: String(e.salary || ""), bonus: "0", deduction: "0", payment: "Cash", paidOn: today() });
  };

  const savePay = () => {
    if (!payFor) return;
    const amount = Number(pay.amount);
    if (!Number.isFinite(amount) || amount <= 0) return toast.error("Enter a valid salary amount");
    actions.paySalary(
      {
        hotelId: hotelId || "H001", employeeId: payFor.id, employeeName: payFor.name,
        month, amount, bonus: Number(pay.bonus) || 0, deduction: Number(pay.deduction) || 0,
        paidOn: pay.paidOn, payment: pay.payment,
      },
      actor,
    );
    toast.success(`Salary paid to ${payFor.name}`);
    setPayFor(null);
  };

  if (!hydrated) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  if (!has("attendance")) {
    return (
      <div className="p-6">
        <Card className="p-6 max-w-lg">
          <h1 className="text-lg font-semibold">Not enabled</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Attendance &amp; Salary is not part of your plan. Ask RSP Software to enable it.
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
            <CalendarCheck className="h-5 w-5 text-primary" /> Attendance &amp; Salary
          </h1>
          <p className="text-sm text-muted-foreground">
            {account?.name ?? "Your business"} — mark daily attendance and pay monthly salary.
          </p>
        </div>
        <Button variant="outline" className="print:hidden" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> Print
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">Staff <Users className="h-4 w-4" /></div>
          <div className="text-2xl font-semibold">{staff.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">Present on {date} <CalendarCheck className="h-4 w-4" /></div>
          <div className="text-2xl font-semibold">{presentToday}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">Salary paid ({month}) <Wallet className="h-4 w-4" /></div>
          <div className="text-2xl font-semibold">
            {money(mineSalaries.reduce((t, s) => t + s.amount + s.bonus - s.deduction, 0))}
          </div>
        </Card>
      </div>

      <Tabs defaultValue="register">
        <TabsList className="print:hidden">
          <TabsTrigger value="register">Attendance register</TabsTrigger>
          <TabsTrigger value="salary">Salary / payroll</TabsTrigger>
          <TabsTrigger value="log">Attendance log</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="space-y-3">
          <Card className="p-3 flex flex-wrap items-end gap-3 print:hidden">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
            </div>
          </Card>
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="print:hidden">Mark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((e) => {
                  const cur = dayMap.get(e.id)?.status;
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="font-medium">{e.name}</div>
                        <div className="text-xs text-muted-foreground">{e.phone}</div>
                      </TableCell>
                      <TableCell>{e.role}</TableCell>
                      <TableCell>
                        {cur
                          ? <Badge variant={cur === "absent" ? "destructive" : "secondary"}>{STATUS.find((s) => s.value === cur)!.label}</Badge>
                          : <span className="text-xs text-muted-foreground">Not marked</span>}
                      </TableCell>
                      <TableCell className="print:hidden">
                        <div className="flex flex-wrap gap-1">
                          {STATUS.map((s) => (
                            <Button
                              key={s.value} size="sm"
                              variant={cur === s.value ? "default" : "outline"}
                              onClick={() => mark(e, s.value)}
                            >
                              {s.value === "full" ? "P" : s.value === "half" ? "½" : s.value === "leave" ? "L" : "A"}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {staff.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                      Add staff in Employees first.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="salary" className="space-y-3">
          <Card className="p-3 flex flex-wrap items-end gap-3 print:hidden">
            <div className="space-y-1.5">
              <Label>Salary month</Label>
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" />
            </div>
          </Card>
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead className="text-right">Monthly salary</TableHead>
                  <TableHead className="text-right">Days worked</TableHead>
                  <TableHead>Paid this month</TableHead>
                  <TableHead className="text-right print:hidden">Payroll</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((e) => {
                  const paid = mineSalaries.filter((s) => s.employeeId === e.id);
                  const total = paid.reduce((t, s) => t + s.amount + s.bonus - s.deduction, 0);
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="font-medium">{e.name}</div>
                        <div className="text-xs text-muted-foreground">{e.role}</div>
                      </TableCell>
                      <TableCell className="text-right">{money(e.salary || 0)}</TableCell>
                      <TableCell className="text-right">{daysWorked(e.id)}</TableCell>
                      <TableCell>
                        {total > 0 ? <Badge>{money(total)}</Badge> : <span className="text-xs text-muted-foreground">Not paid</span>}
                      </TableCell>
                      <TableCell className="text-right print:hidden">
                        <Button size="sm" onClick={() => openPay(e)}>
                          <IndianRupee className="h-3.5 w-3.5 mr-1" /> Pay salary
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {mineSalaries.length > 0 && (
            <Card className="overflow-x-auto">
              <div className="p-3 border-b font-semibold text-sm">Salary payments · {month}</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Paid on</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Salary</TableHead>
                    <TableHead className="text-right">Bonus</TableHead>
                    <TableHead className="text-right">Deduction</TableHead>
                    <TableHead className="text-right">Net paid</TableHead>
                    <TableHead className="text-right print:hidden">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mineSalaries.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.employeeName}</TableCell>
                      <TableCell>{s.paidOn}</TableCell>
                      <TableCell>{s.payment}</TableCell>
                      <TableCell className="text-right">{money(s.amount)}</TableCell>
                      <TableCell className="text-right">{money(s.bonus)}</TableCell>
                      <TableCell className="text-right">{money(s.deduction)}</TableCell>
                      <TableCell className="text-right font-semibold">{money(s.amount + s.bonus - s.deduction)}</TableCell>
                      <TableCell className="text-right print:hidden">
                        <Button
                          size="icon" variant="ghost"
                          onClick={() => {
                            if (!confirm("Remove this salary payment?")) return;
                            actions.deleteSalary(s.id);
                            toast.success("Removed");
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="log">
          <Card className="overflow-x-auto">
            <div className="p-3 border-b font-semibold text-sm">Attendance log history</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right print:hidden">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {log.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.date}</TableCell>
                    <TableCell className="font-medium">{a.employeeName}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === "absent" ? "destructive" : "secondary"}>
                        {STATUS.find((s) => s.value === a.status)!.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right print:hidden">
                      <Button size="icon" variant="ghost" onClick={() => actions.deleteAttendance(a.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {log.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                      No attendance marked yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!payFor} onOpenChange={(v) => !v && setPayFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay salary — {payFor?.name}</DialogTitle>
            <DialogDescription>Salary month {month}. This is also recorded as a business expense.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Salary (₹)</Label>
              <Input inputMode="decimal" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Paid on</Label>
              <Input type="date" value={pay.paidOn} onChange={(e) => setPay({ ...pay, paidOn: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Bonus (₹)</Label>
              <Input inputMode="decimal" value={pay.bonus} onChange={(e) => setPay({ ...pay, bonus: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Deduction (₹)</Label>
              <Input inputMode="decimal" value={pay.deduction} onChange={(e) => setPay({ ...pay, deduction: e.target.value })} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Payment mode</Label>
              <Select value={pay.payment} onValueChange={(v) => setPay({ ...pay, payment: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayFor(null)}>Cancel</Button>
            <Button onClick={savePay}>Pay salary</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
