import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Building2, Plus, Search, Trash2, Copy, Power, RefreshCw, KeyRound, SlidersHorizontal } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { actions, useStore, useHydrated, type Hotel } from "@/lib/store";
import { getUser, generatePassword } from "@/lib/auth";
import {
  BUSINESS_TYPES, DEFAULT_FEATURES, FEATURE_LIST, labelsFor,
  type BusinessType, type FeatureKey,
} from "@/lib/business";

export const Route = createFileRoute("/_app/superadmin")({
  head: () => ({
    meta: [
      { title: "Business Accounts · RSP Billing SaaS" },
      { name: "description", content: "Super admin console to create hotel, medical, supermarket and retail accounts, pick their features, and issue user IDs and passwords." },
      { property: "og:title", content: "Business Accounts · RSP Billing SaaS" },
      { property: "og:description", content: "Create customer accounts, choose their business type and features, and issue login credentials." },
    ],
  }),
  component: SuperAdminPage,
});

const EMPTY = {
  name: "", ownerName: "", phone: "", city: "", state: "Andhra Pradesh",
  loginId: "", password: "", plan: "Monthly" as Hotel["plan"],
  businessType: "Hotel" as BusinessType,
  features: DEFAULT_FEATURES.Hotel as FeatureKey[],
};


function SuperAdminPage() {
  const hydrated = useHydrated();
  const hotels = useStore((s) => s.hotels);
  const sales = useStore((s) => s.sales);
  const [me, setMe] = useState<ReturnType<typeof getUser>>(null);
  useEffect(() => setMe(getUser()), []);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [created, setCreated] = useState<Hotel | null>(null);
  const [featFor, setFeatFor] = useState<Hotel | null>(null);
  const [featSel, setFeatSel] = useState<FeatureKey[]>([]);

  const toggleNew = (k: FeatureKey) =>
    setForm((f) => ({
      ...f,
      features: f.features.includes(k) ? f.features.filter((x) => x !== k) : [...f.features, k],
    }));

  const pickType = (t: BusinessType) =>
    setForm((f) => ({ ...f, businessType: t, features: DEFAULT_FEATURES[t] }));

  const openFeatures = (h: Hotel) => {
    setFeatFor(h);
    setFeatSel(h.features?.length ? h.features : DEFAULT_FEATURES[h.businessType ?? "Hotel"]);
  };


  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return hotels;
    return hotels.filter((h) =>
      [h.name, h.ownerName, h.phone, h.loginId, h.city].some((v) => (v ?? "").toLowerCase().includes(t)),
    );
  }, [hotels, q]);

  const isSuper = me?.role === "SuperAdmin";

  const create = () => {
    if (!form.name.trim() || !form.loginId.trim() || !form.password.trim()) {
      toast.error("Hotel name, User ID and Password are required");
      return;
    }
    const id = form.loginId.trim().toLowerCase();
    if (hotels.some((h) => h.loginId.toLowerCase() === id)) {
      toast.error("That User ID is already taken");
      return;
    }
    const rec = actions.addHotel(
      { ...form, loginId: id, active: true },
      me ? { id: me.id, name: me.name } : undefined,
    );
    setCreated(rec);
    setForm(EMPTY);
    setOpen(false);
  };

  const copyCreds = (h: Hotel) => {
    navigator.clipboard
      ?.writeText(`${h.name}\nUser ID: ${h.loginId}\nPassword: ${h.password}`)
      .then(() => toast.success("Login details copied"))
      .catch(() => toast.error("Could not copy"));
  };

  if (!hydrated) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  if (!isSuper) {
    return (
      <div className="p-6">
        <Card className="p-6 max-w-lg">
          <h1 className="text-lg font-semibold">Super Admin only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This console is used by RSP Software to create and manage hotel accounts.
          </p>
        </Card>
      </div>
    );
  }

  const active = hotels.filter((h) => h.active ?? true).length;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> Business Accounts
          </h1>
          <p className="text-sm text-muted-foreground">
            Create an account, pick the business type and the exact features they need. Each customer's data stays separate.
          </p>

        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> New hotel account
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total hotels</div>
          <div className="text-2xl font-semibold">{hotels.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Active subscriptions</div>
          <div className="text-2xl font-semibold">{active}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Bills across all hotels</div>
          <div className="text-2xl font-semibold">{sales.length}</div>
        </Card>
      </div>

      <Card className="p-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search hotel, owner, phone, user ID" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((h) => (
              <TableRow key={h.id}>
                <TableCell>
                  <div className="font-medium">{h.name}</div>
                  <div className="text-xs text-muted-foreground">{h.city}{h.state ? ` · ${h.state}` : ""}</div>
                </TableCell>
                <TableCell>
                  <div>{h.ownerName}</div>
                  <div className="text-xs text-muted-foreground">{h.phone}</div>
                </TableCell>
                <TableCell className="font-mono text-xs">{h.loginId}</TableCell>
                <TableCell className="font-mono text-xs">{h.password}</TableCell>
                <TableCell>
                  <div>{normalizeBusinessType(h.businessType)}</div>
                  <div className="text-xs text-muted-foreground">
                    {(h.features?.length ?? DEFAULT_FEATURES[normalizeBusinessType(h.businessType)].length)} modules
                  </div>
                </TableCell>
                <TableCell>{h.plan}</TableCell>
                <TableCell>
                  <Badge variant={(h.active ?? true) ? "default" : "secondary"}>
                    {(h.active ?? true) ? "Active" : "Suspended"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button size="icon" variant="ghost" title="Choose features" onClick={() => openFeatures(h)}>
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" title="Copy login details" onClick={() => copyCreds(h)}>
                    <Copy className="h-4 w-4" />
                  </Button>

                  <Button
                    size="icon" variant="ghost" title="Reset password"
                    onClick={() => {
                      const pw = generatePassword();
                      actions.updateHotel(h.id, { password: pw }, me ? { id: me.id, name: me.name } : undefined);
                      toast.success(`New password: ${pw}`);
                    }}
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon" variant="ghost" title={(h.active ?? true) ? "Suspend" : "Activate"}
                    onClick={() => {
                      actions.updateHotel(h.id, { active: !(h.active ?? true) }, me ? { id: me.id, name: me.name } : undefined);
                      toast.success((h.active ?? true) ? "Account suspended" : "Account activated");
                    }}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon" variant="ghost" title="Delete account"
                    onClick={() => {
                      if (!confirm(`Delete ${h.name} and all its data?`)) return;
                      actions.deleteHotel(h.id, me ? { id: me.id, name: me.name } : undefined);
                      toast.success("Hotel account deleted");
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                  No hotel accounts yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New business account</DialogTitle>
            <DialogDescription>The owner will use this User ID and Password to open the software.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Business name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Hotel Vaishali" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Business type</Label>
              <Select value={form.businessType} onValueChange={(v) => pickType(v as BusinessType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Billing shows dish photos in a 10-item grid — fast for hotels, restaurants and cafes.
              </p>
            </div>
            <div className="sm:col-span-2 space-y-2 rounded-md border p-3">
              <div className="text-sm font-medium">Features for this customer</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {FEATURE_LIST.map((f) => (
                  <label key={f.key} className="flex items-start gap-2 text-sm">
                    <Checkbox checked={form.features.includes(f.key)} onCheckedChange={() => toggleNew(f.key)} />
                    <span>
                      {f.label}
                      <span className="block text-xs text-muted-foreground">{f.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Owner name</Label>
              <Input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>User ID</Label>
              <Input value={form.loginId} onChange={(e) => setForm({ ...form, loginId: e.target.value })} placeholder="vaishali" />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <div className="flex gap-2">
                <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <Button type="button" variant="outline" size="icon" title="Generate"
                  onClick={() => setForm({ ...form, password: generatePassword() })}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v as Hotel["plan"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Trial">Trial</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!created} onOpenChange={(v) => !v && setCreated(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account created</DialogTitle>
            <DialogDescription>Share these details with the owner.</DialogDescription>
          </DialogHeader>
          {created && (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-1">
              <div className="font-medium">{created.name}</div>
              <div>User ID: <span className="font-mono">{created.loginId}</span></div>
              <div>Password: <span className="font-mono">{created.password}</span></div>
              <div className="text-xs text-muted-foreground">
                {created.businessType ?? "Hotel"} · Plan: {created.plan}
              </div>
            </div>
          )}
          <DialogFooter>
            {created && <Button variant="outline" onClick={() => copyCreds(created)}><Copy className="h-4 w-4 mr-1" /> Copy</Button>}
            <Button onClick={() => setCreated(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!featFor} onOpenChange={(v) => !v && setFeatFor(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Features — {featFor?.name}</DialogTitle>
            <DialogDescription>Tick only the modules this customer needs. Unticked modules disappear from their menu.</DialogDescription>
          </DialogHeader>
          {featFor && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Business type</Label>
                <Select
                  value={featFor.businessType ?? "Hotel"}
                  onValueChange={(v) => {
                    setFeatFor({ ...featFor, businessType: v as BusinessType });
                    setFeatSel(DEFAULT_FEATURES[v as BusinessType]);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 rounded-md border p-3">
                {FEATURE_LIST.map((f) => (
                  <label key={f.key} className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={featSel.includes(f.key)}
                      onCheckedChange={() =>
                        setFeatSel((s) => (s.includes(f.key) ? s.filter((x) => x !== f.key) : [...s, f.key]))
                      }
                    />
                    <span>
                      {f.label}
                      <span className="block text-xs text-muted-foreground">{f.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeatFor(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!featFor) return;
                actions.updateHotel(
                  featFor.id,
                  { businessType: featFor.businessType ?? "Hotel", features: featSel },
                  me ? { id: me.id, name: me.name } : undefined,
                );
                toast.success("Features updated");
                setFeatFor(null);
              }}
            >
              Save features
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
