import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { UtensilsCrossed, Plus, Search, Trash2, Pencil, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { actions, useStore, useHydrated, type MenuItem } from "@/lib/store";
import { MENU_CATEGORIES } from "@/data/menu";
import { getUser } from "@/lib/auth";

export const Route = createFileRoute("/_app/items")({
  head: () => ({
    meta: [
      { title: "Menu Items · RSP Hotel Billing" },
      { name: "description", content: "Add hotel menu items with photos and prices, and update your own rates any time." },
      { property: "og:title", content: "Menu Items · RSP Hotel Billing" },
      { property: "og:description", content: "Manage your hotel menu with photos and prices." },
    ],
  }),
  component: ItemsPage,
});

const EMPTY = { name: "", category: "Tiffins", price: "", photo: "", active: true };

async function fileToDataUrl(file: File, max = 480): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.8);
}

function ItemsPage() {
  const hydrated = useHydrated();
  const menuItems = useStore((s) => s.menuItems);
  const [me, setMe] = useState<ReturnType<typeof getUser>>(null);
  useEffect(() => setMe(getUser()), []);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const fileRef = useRef<HTMLInputElement>(null);

  const hotelId = me?.hotelId ?? "";
  const mine = useMemo(
    () => menuItems.filter((m) => !hotelId || m.hotelId === hotelId),
    [menuItems, hotelId],
  );
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return mine;
    return mine.filter((m) => `${m.name} ${m.category}`.toLowerCase().includes(t));
  }, [mine, q]);

  const openNew = () => { setEditId(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (m: MenuItem) => {
    setEditId(m.id);
    setForm({ name: m.name, category: m.category, price: String(m.price), photo: m.photo ?? "", active: m.active ?? true });
    setOpen(true);
  };

  const pickPhoto = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file");
    if (file.size > 8 * 1024 * 1024) return toast.error("Image must be under 8 MB");
    try {
      setForm((f) => ({ ...f, photo: "" }));
      const url = await fileToDataUrl(file);
      setForm((f) => ({ ...f, photo: url }));
    } catch {
      toast.error("Could not read that image");
    }
  };

  const save = () => {
    const price = Number(form.price);
    if (!form.name.trim()) return toast.error("Item name is required");
    if (!Number.isFinite(price) || price <= 0) return toast.error("Enter a valid price");
    const actor = me ? { id: me.id, name: me.name } : undefined;
    if (editId) {
      actions.updateMenuItem(editId, {
        name: form.name.trim(), category: form.category, price,
        photo: form.photo || undefined, active: form.active,
      }, actor);
      toast.success("Item updated");
    } else {
      actions.addMenuItem({
        hotelId: hotelId || "H001", name: form.name.trim(), category: form.category,
        price, photo: form.photo || undefined, active: form.active,
      }, actor);
      toast.success("Item added");
    }
    setOpen(false);
  };

  if (!hydrated) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" /> Menu Items
          </h1>
          <p className="text-sm text-muted-foreground">
            Add your items with a photo and price. You can change your own rates any time.
          </p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add item</Button>
      </div>

      <Card className="p-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search item or category" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {list.map((m) => (
          <Card key={m.id} className="overflow-hidden">
            <div className="aspect-square w-full bg-muted grid place-items-center overflow-hidden">
              {m.photo ? (
                <img src={m.photo} alt={m.name} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="p-3 space-y-1">
              <div className="font-medium text-sm truncate" title={m.name}>{m.name}</div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">₹{m.price}</span>
                <Badge variant="secondary" className="text-[10px]">{m.category}</Badge>
              </div>
              {!(m.active ?? true) && <div className="text-[11px] text-destructive">Hidden from billing</div>}
              <div className="flex gap-1 pt-1">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(m)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <Button
                  size="icon" variant="ghost"
                  onClick={() => {
                    if (!confirm(`Delete ${m.name}?`)) return;
                    actions.deleteMenuItem(m.id, me ? { id: me.id, name: me.name } : undefined);
                    toast.success("Item deleted");
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {list.length === 0 && (
          <Card className="col-span-full p-8 text-center text-sm text-muted-foreground">
            No items yet. Click “Add item” to build your menu.
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit item" : "Add item"}</DialogTitle>
            <DialogDescription>Photo, name and price appear on the billing screen.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-20 w-20 shrink-0 rounded-lg bg-muted overflow-hidden grid place-items-center">
                {form.photo ? (
                  <img src={form.photo} alt="Item preview" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => pickPhoto(e.target.files?.[0])}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <ImagePlus className="h-4 w-4 mr-1" /> {form.photo ? "Change photo" : "Upload photo"}
                </Button>
                {form.photo && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, photo: "" })}>
                    <X className="h-4 w-4 mr-1" /> Remove
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Item name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Masala Dosa" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price (₹)</Label>
                <Input inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MENU_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>Show on billing screen</span>
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editId ? "Save changes" : "Add item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
