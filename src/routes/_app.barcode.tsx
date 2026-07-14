import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanBarcode, Printer } from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/barcode")({
  head: () => ({ meta: [{ title: "Barcode · RSP Medical Billing" }] }),
  component: BarcodePage,
});

// Simple visual barcode using vertical bars from an ID string
function barsFor(code: string) {
  const bars: number[] = [];
  const chars = code.padEnd(10, "0");
  for (let i = 0; i < chars.length; i++) {
    const n = chars.charCodeAt(i) % 5 + 1;
    bars.push(n);
  }
  return bars;
}

function BarcodePage() {
  const meds = useStore((s) => s.medicines);
  const [selected, setSelected] = useState<string[]>([]);
  const [qty, setQty] = useState(1);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const printAll = () => {
    if (selected.length === 0) return toast.error("Select medicines to print labels");
    const chosen = meds.filter((m) => selected.includes(m.id));
    const html = `<!doctype html><html><head><title>Barcodes</title>
      <style>
        body{font-family:Arial;margin:0;padding:8px;}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
        .lbl{border:1px dashed #999;padding:6px;text-align:center;font-size:11px;}
        .code{display:flex;justify-content:center;gap:2px;align-items:end;height:44px;margin:4px 0;}
        .b{background:#000;}
        @media print { .lbl{page-break-inside:avoid} }
      </style></head><body>
      <div class="grid">
      ${Array.from({ length: qty }).flatMap(() =>
        chosen.map((m) => `
          <div class="lbl">
            <div style="font-weight:600">${m.name}</div>
            <div>${m.company}</div>
            <div class="code">
              ${barsFor(m.id).map((h) => `<div class="b" style="width:2px;height:${8 + h * 5}px"></div>`).join("")}
            </div>
            <div style="font-family:monospace">${m.id}</div>
            <div>Batch ${m.batch} · ₹${m.mrp}</div>
          </div>`).join(""),
      ).join("")}
      </div>
      <script>window.onload=()=>{setTimeout(()=>window.print(),200)}</script>
      </body></html>`;
    const w = window.open("", "_blank", "width=600,height=800");
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <ScanBarcode className="h-6 w-6 text-primary" /> Barcode Labels
        </h1>
        <p className="text-sm text-muted-foreground">Select medicines to generate and print barcode labels.</p>
      </div>

      <Card className="p-4 flex items-end gap-3 flex-wrap">
        <div className="space-y-1.5">
          <Label className="text-xs">Copies per medicine</Label>
          <Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="w-32" />
        </div>
        <div className="text-sm text-muted-foreground ml-auto">{selected.length} selected</div>
        <Button onClick={printAll}><Printer className="h-4 w-4 mr-1.5" /> Print labels</Button>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {meds.map((m) => {
          const active = selected.includes(m.id);
          return (
            <Card
              key={m.id}
              onClick={() => toggle(m.id)}
              className={"p-4 cursor-pointer transition-all " + (active ? "ring-2 ring-primary" : "hover:bg-muted/40")}
            >
              <div className="font-medium text-sm">{m.name}</div>
              <div className="text-xs text-muted-foreground">{m.company} · Batch {m.batch}</div>
              <div className="mt-3 flex items-end gap-[2px] h-10">
                {barsFor(m.id).map((h, i) => (
                  <div key={i} className="bg-foreground" style={{ width: 2, height: `${20 + h * 8}%` }} />
                ))}
              </div>
              <div className="font-mono text-xs mt-1">{m.id}</div>
              <div className="text-xs">₹{m.mrp} · GST {m.gst}%</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
