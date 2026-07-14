import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export type ColumnSpec = {
  key: string;
  label: string;
  required?: boolean;
  type?: "string" | "number";
};

type Props<T> = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  columns: ColumnSpec[];
  example: string;
  onImport: (rows: T[]) => void;
};

function parse(text: string, cols: ColumnSpec[]): Record<string, any>[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  // Detect header row
  const firstCells = splitLine(lines[0]);
  const hasHeader = cols.every((c) =>
    firstCells.some((h) => h.toLowerCase().replace(/\s+/g, "") === c.label.toLowerCase().replace(/\s+/g, "") ||
                          h.toLowerCase() === c.key.toLowerCase()),
  );
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const headerMap = hasHeader
    ? firstCells.map((h) => {
        const clean = h.toLowerCase().replace(/\s+/g, "");
        return cols.find((c) => c.label.toLowerCase().replace(/\s+/g, "") === clean || c.key.toLowerCase() === clean)?.key ?? null;
      })
    : cols.map((c) => c.key);

  return dataLines.map((ln) => {
    const cells = splitLine(ln);
    const row: Record<string, any> = {};
    headerMap.forEach((key, i) => {
      if (!key) return;
      const raw = (cells[i] ?? "").trim();
      const col = cols.find((c) => c.key === key)!;
      row[key] = col.type === "number" ? Number(raw) || 0 : raw;
    });
    return row;
  });
}

function splitLine(l: string): string[] {
  // TSV first, else CSV
  if (l.includes("\t")) return l.split("\t");
  return l.split(",");
}

export function BulkImportDialog<T>({ open, onOpenChange, title, columns, example, onImport }: Props<T>) {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const rows = text.trim() ? parse(text, columns) : [];
  const invalid = rows.filter((r) => columns.some((c) => c.required && !r[c.key]));

  const copyTemplate = () => {
    navigator.clipboard.writeText(example);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const doImport = () => {
    if (rows.length === 0) return toast.error("Paste some rows first");
    if (invalid.length) return toast.error(`${invalid.length} row(s) missing required fields`);
    onImport(rows as T[]);
    toast.success(`Imported ${rows.length} row(s)`);
    setText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" /> {title}
          </DialogTitle>
          <DialogDescription>
            Paste rows copied from Excel or Google Sheets. Tab or comma separated. First row can be a header.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium">Expected columns</div>
              <Button size="sm" variant="ghost" onClick={copyTemplate} className="h-7">
                {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                Copy template
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {columns.map((c) => (
                <Badge key={c.key} variant={c.required ? "default" : "secondary"} className="text-[10px]">
                  {c.label}{c.required && " *"}
                </Badge>
              ))}
            </div>
            <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono">{example}</pre>
          </div>

          <div className="space-y-1.5">
            <Label>Paste data</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              className="font-mono text-xs"
              placeholder="Paste from Excel or type rows here…"
            />
          </div>

          {rows.length > 0 && (
            <div className="text-xs text-muted-foreground flex items-center gap-3">
              <span><b className="text-foreground">{rows.length}</b> row(s) detected</span>
              {invalid.length > 0 && (
                <span className="text-destructive"><b>{invalid.length}</b> invalid (missing required)</span>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={doImport}>Import {rows.length > 0 && `(${rows.length})`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
