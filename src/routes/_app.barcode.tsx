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

// Return a stable bar pattern (widths in units) for a code — like Code128-ish visual.
function barsFor(code: string): { w: number; solid: boolean }[] {
  const s = code.padEnd(12, "0");
  const out: { w: number; solid: boolean }[] = [];
  // Start guard
  out.push({ w: 2, solid: true }, { w: 1, solid: false }, { w: 1, solid: true }, { w: 1, solid: false });
  for (let i = 0; i < s.length; i++) {
    const n = s.charCodeAt(i);
    const widths = [((n >> 0) & 3) + 1, ((n >> 2) & 3) + 1, ((n >> 4) & 3) + 1, ((n >> 6) & 3) + 1];
    widths.forEach((w, idx) => out.push({ w, solid: idx % 2 === 0 }));
  }
  // End guard
  out.push({ w: 1, solid: false }, { w: 2, solid: true }, { w: 1, solid: false }, { w: 1, solid: true });
  return out;
}

// SVG barcode — prints reliably (paths, not backgrounds).
function BarcodeSVG({ code, width = 220, height = 60 }: { code: string; width?: number; height?: number }) {
  const bars = barsFor(code);
  const totalUnits = bars.reduce((n, b) => n + b.w, 0);
  const unit = width / totalUnits;
  let x = 0;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
      {bars.map((b, i) => {
        const w = b.w * unit;
        const rect = b.solid ? <rect key={i} x={x} y={0} width={w} height={height} fill="#000" /> : null;
        x += w;
        return rect;
      })}
    </svg>
  );
}

function BarcodePage() {
  const meds = useStore((s) => s.medicines);
  const [selected, setSelected] = useState<string[]>([]);
  const [qty, setQty] = useState(1);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const labelHTML = (m: (typeof meds)[number]) => {
    const bars = barsFor(m.id);
    const totalUnits = bars.reduce((n, b) => n + b.w, 0);
    const W = 260, H = 80;
    const unit = W / totalUnits;
    let x = 0;
    const rects = bars
      .map((b) => {
        const w = b.w * unit;
        const rect = b.solid ? `<rect x="${x.toFixed(2)}" y="0" width="${w.toFixed(2)}" height="${H}" fill="#000"/>` : "";
        x += w;
        return rect;
      })
      .join("");
    return `
      <div class="lbl">
        <div class="nm">${m.name}</div>
        <div class="tiny">${m.company}</div>
        <svg viewBox="0 0 ${W} ${H}" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">${rects}</svg>
        <div class="code">${m.id}</div>
        <div class="tiny">B ${m.batch} · Rs.${m.mrp}</div>
      </div>`;
  };

  const printAll = () => {
    if (selected.length === 0) return toast.error("Select medicines to print labels");
    const chosen = meds.filter((m) => selected.includes(m.id));
    const labels = Array.from({ length: qty }).flatMap(() => chosen.map(labelHTML)).join("");

    const html = `<!doctype html><html><head><title>Barcode Labels</title>
      <style>
        @page { margin: 6mm; }
        *{ -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing:border-box; }
        body{ font-family: Arial, sans-serif; margin:0; padding:8px; color:#000; }
        .grid{ display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; }
        .lbl{ border:1px dashed #666; padding:6px 8px; text-align:center; page-break-inside:avoid; }
        .nm{ font-size:10px; font-weight:600; line-height:1.1; }
        .tiny{ font-size:8px; color:#000; margin-top:1px; }
        .code{ font-family: "Courier New", monospace; font-size:14px; font-weight:700; letter-spacing:1px; margin-top:2px; }
        svg{ display:block; margin: 2px auto 0; }
      </style></head><body>
      <div class="grid">${labels}</div>
      <script>window.onload=()=>{setTimeout(()=>window.print(),250)}</script>
      </body></html>`;
    const w = window.open("", "_blank", "width=800,height=900");
    if (w) { w.document.open(); w.document.write(html); w.document.close(); }
    else toast.error("Popup blocked — allow popups for printing.");
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <ScanBarcode className="h-6 w-6 text-primary" /> Barcode Labels
        </h1>
        <p className="text-sm text-muted-foreground">Select medicines and print scannable label sheets — code is bold, names and price are small.</p>
      </div>

      <Card className="p-4 flex items-end gap-3 flex-wrap">
        <div className="space-y-1.5">
          <Label className="text-xs">Copies per medicine</Label>
          <Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="w-32" />
        </div>
        <div className="text-sm text-muted-foreground ml-auto">{selected.length} selected</div>
        <Button variant="outline" onClick={() => setSelected(meds.map((m) => m.id))}>Select all</Button>
        <Button variant="outline" onClick={() => setSelected([])}>Clear</Button>
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
              <div className="text-[11px] font-semibold leading-tight">{m.name}</div>
              <div className="text-[10px] text-muted-foreground">{m.company}</div>
              <div className="mt-2">
                <BarcodeSVG code={m.id} width={240} height={56} />
              </div>
              <div className="font-mono text-base font-bold tracking-wider text-center mt-1">{m.id}</div>
              <div className="text-[10px] text-center text-muted-foreground">Batch {m.batch} · ₹{m.mrp}</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
