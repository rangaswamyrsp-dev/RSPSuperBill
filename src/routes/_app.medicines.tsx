import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Search, Trash2, Pencil, FileSpreadsheet, Pill } from "lucide-react";
import { actions, useStore } from "@/lib/store";
import type { Medicine } from "@/data/medicines";
import { BulkImportDialog } from "@/components/app/BulkImportDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/medicines")({
  head: () => ({ meta: [{ title: "Medicine Master · RSP Medical Billing" }] }),
  component: MedicinesPage,
});

const EMPTY: Omit<Medicine, "id"> = {
  name: "", batch: "", mrp: 0, gst: 5, stock: 0, expiry: "", company: "",
};

function MedicinesPage() {
  const meds = useStore((s) => s.medicines);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [form, setForm] = useState<Omit<Medicine, "id">>(EMPTY);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return meds;
    return meds.filter((m) =>
      [m.name, m.batch, m.company, m.id].some((v) => v.toLowerCase().includes(q)),
    );
  }, [meds, query]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (m: Medicine) => { setEditing(m); setForm(m); setOpen(true); };

  const save = () => {
    if (!form.name || !form.batch) return toast.error("Name and batch required");
    if (editing) {
      actions.updateMedicine(editing.id, form);
      toast.success("Medicine updated");
    } else {
      actions.addMedicine(form);
      toast.success("Medicine added");
    }
    setOpen(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" /> Medicine Master
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage medicines, batch, MRP, GST and stock — {meds.length} items
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Bulk Import (Excel)
          </Button>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Medicine
          </Button>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, batch, company…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead className="text-right">MRP</TableHead>
              <TableHead className="text-center">GST</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{m.id}</TableCell>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell className="text-sm">{m.company}</TableCell>
                <TableCell className="text-sm">{m.batch}</TableCell>
                <TableCell className="text-right tabular-nums">₹{m.mrp}</TableCell>
                <TableCell className="text-center">{m.gst}%</TableCell>
                <TableCell className="text-center">
                  <Badge variant={m.stock < 20 ? "destructive" : "secondary"}>{m.stock}</Badge>
                </TableCell>
                <TableCell className="text-sm">{m.expiry}</TableCell>
                <TableCell className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(m)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon" variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => { actions.deleteMedicine(m.id); toast.success("Deleted"); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                No medicines match the search.
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </Card>

      {/* Add/Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit medicine" : "Add medicine"}</DialogTitle>
            <DialogDescription>Fill in the details below.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} full />
            <Field label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
            <Field label="Batch" value={form.batch} onChange={(v) => setForm({ ...form, batch: v })} />
            <Field label="Expiry (YYYY-MM)" value={form.expiry} onChange={(v) => setForm({ ...form, expiry: v })} />
            <Field label="MRP (₹)" type="number" value={form.mrp} onChange={(v) => setForm({ ...form, mrp: Number(v) })} />
            <Field label="GST %" type="number" value={form.gst} onChange={(v) => setForm({ ...form, gst: Number(v) })} />
            <Field label="Stock" type="number" value={form.stock} onChange={(v) => setForm({ ...form, stock: Number(v) })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkImportDialog<Omit<Medicine, "id">>
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title="Bulk import medicines"
        columns={[
          { key: "name", label: "Name", required: true },
          { key: "company", label: "Company" },
          { key: "batch", label: "Batch", required: true },
          { key: "mrp", label: "MRP", type: "number", required: true },
          { key: "gst", label: "GST", type: "number" },
          { key: "stock", label: "Stock", type: "number" },
          { key: "expiry", label: "Expiry" },
        ]}
        example={`Name\tCompany\tBatch\tMRP\tGST\tStock\tExpiry
Paracetamol 500mg\tCipla\tB12A\t25\t5\t240\t2027-06
Azithromycin 500mg\tSun Pharma\tAZ88\t78\t12\t60\t2026-11`}
        onImport={(rows) => actions.bulkAddMedicines(rows)}
      />
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", full,
}: { label: string; value: string | number; onChange: (v: string) => void; type?: string; full?: boolean }) {
  return (
    <div className={"space-y-1.5 " + (full ? "col-span-2" : "")}>
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value as any} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
