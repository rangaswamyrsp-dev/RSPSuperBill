import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Stethoscope, Pill, ShieldCheck, Zap, Phone } from "lucide-react";
import { login, getUser, DEMO_CREDENTIALS } from "@/lib/auth";
import { actions } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && getUser()) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Sign in · RSP SuperBill" },
      { name: "description", content: "Role-based login for your business staff." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [phone, setPhone] = useState(DEMO_CREDENTIALS.phone);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const u = login(phone, password, remember);
      setLoading(false);
      if (u) {
        actions.logLogin({ id: u.id, name: u.name });
        toast.success(`Welcome, ${u.name} · ${u.role}`);
        navigate({ to: "/" });
      } else {
        toast.error("Invalid phone or password");
      }
    }, 300);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-[color:var(--info)] via-[color:var(--info)] to-primary text-white p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur grid place-items-center">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-semibold">RSP SuperBill</div>
            <div className="text-xs text-white/70">your business · Hindupur</div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-16 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-32 right-0 h-56 w-56 rounded-full bg-[color:var(--warning)]/40 blur-3xl" />
          <div className="relative">
            <h1 className="text-4xl xl:text-5xl font-semibold leading-tight tracking-tight">
              Role-based billing for your whole team.
            </h1>
            <p className="mt-4 text-white/80 max-w-md">
              Admin, Manager, Pharmacist and Cashier — each staff logs in with their phone number
              and every bill is tied to their Employee ID.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-3 max-w-md">
              {[
                { icon: Zap, label: "Bill in 20s" },
                { icon: Pill, label: "FEFO stock" },
                { icon: ShieldCheck, label: "Audit trail" },
              ].map((f) => (
                <div key={f.label} className="rounded-xl bg-white/10 backdrop-blur p-4">
                  <f.icon className="h-5 w-5 mb-2" />
                  <div className="text-sm font-medium">{f.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="text-xs text-white/60">Version 1.1 · © 2026 RSP Software</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="font-semibold">RSP SuperBill</div>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">Sign in to continue</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Use your phone number and password given by the admin.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone (User ID)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  className="pl-9"
                  inputMode="tel"
                  autoComplete="username"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password" type="password" autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
                Remember me
              </label>
              <button type="button" className="text-[color:var(--info)] hover:underline"
                onClick={() => toast("Ask the Admin (Manjju) to reset your password.")}>
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
              {loading ? "Signing in…" : "Login"}
            </Button>
          </form>

          <Card className="mt-6 p-3 bg-muted/50 border-dashed text-xs text-muted-foreground">
            <div><span className="font-medium text-foreground">Admin demo:</span> {DEMO_CREDENTIALS.phone} · {DEMO_CREDENTIALS.password}</div>
            <div className="mt-1"><span className="font-medium text-foreground">Cashier demo:</span> 9876543211 · cashier1</div>
            <div><span className="font-medium text-foreground">Pharmacist demo:</span> 9876543212 · pharma1</div>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">Version 1.1</p>
        </div>
      </div>
    </div>
  );
}
