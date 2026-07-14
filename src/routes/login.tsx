import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Stethoscope, Pill, ShieldCheck, Zap } from "lucide-react";
import { login, getUser, DEMO_CREDENTIALS } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && getUser()) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Sign in · RSP Medical Billing" },
      { name: "description", content: "Secure login for ANAM Medical Store staff to access RSP Billing." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState(DEMO_CREDENTIALS.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const u = login(email, password, remember);
      setLoading(false);
      if (u) {
        toast.success(`Welcome back, ${u.name}`);
        navigate({ to: "/" });
      } else {
        toast.error("Invalid credentials");
      }
    }, 400);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left illustration */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-[color:var(--info)] via-[color:var(--info)] to-primary text-white p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur grid place-items-center">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-semibold">RSP Medical Billing</div>
            <div className="text-xs text-white/70">ANAM Medical Store · Hindupur</div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-16 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-32 right-0 h-56 w-56 rounded-full bg-[color:var(--warning)]/40 blur-3xl" />
          <div className="relative">
            <h1 className="text-4xl xl:text-5xl font-semibold leading-tight tracking-tight">
              Fast, reliable billing for busy medical stores.
            </h1>
            <p className="mt-4 text-white/80 max-w-md">
              Barcode-ready billing, live stock, GST reports and multi-branch inventory — all
              in one keyboard-friendly workspace.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-3 max-w-md">
              {[
                { icon: Zap, label: "Bill in 20s" },
                { icon: Pill, label: "10k+ SKUs" },
                { icon: ShieldCheck, label: "GST ready" },
              ].map((f) => (
                <div key={f.label} className="rounded-xl bg-white/10 backdrop-blur p-4">
                  <f.icon className="h-5 w-5 mb-2" />
                  <div className="text-sm font-medium">{f.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-white/60">Version 1.0 · © 2026 RSP Software</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="font-semibold">RSP Medical Billing</div>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">Sign in to continue</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your credentials to access the billing workspace.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email / Username</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                />
                Remember me
              </label>
              <button type="button" className="text-[color:var(--info)] hover:underline">
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
              {loading ? "Signing in…" : "Login"}
            </Button>
          </form>

          <Card className="mt-6 p-3 bg-muted/50 border-dashed text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Demo login:</span>{" "}
            {DEMO_CREDENTIALS.email} · {DEMO_CREDENTIALS.password}
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">Version 1.0</p>
        </div>
      </div>
    </div>
  );
}
