import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

function makeStub(title: string, desc: string) {
  return function StubPage() {
    return (
      <div className="p-6 lg:p-10">
        <Card className="p-10 text-center max-w-2xl mx-auto">
          <div className="mx-auto h-14 w-14 grid place-items-center rounded-full bg-[color:var(--info)]/10 text-[color:var(--info)] mb-4">
            <Construction className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{desc}</p>
        </Card>
      </div>
    );
  };
}

export const stubs = {
  Sales: makeStub("Sales", "Invoice history, filters, print, cancel and returns."),
  Purchase: makeStub("Purchase", "Record purchases from suppliers with GST and batch."),
  Inventory: makeStub("Inventory", "Live stock, expiry alerts, batches and pricing."),
  Medicines: makeStub("Medicine Master", "Manage medicines, salts, HSN, MRP and GST."),
  Customers: makeStub("Customers", "Customer directory with outstanding balances."),
  Suppliers: makeStub("Suppliers", "Suppliers, contact info and pending payments."),
  Employees: makeStub("Employees", "Staff, attendance, salaries and permissions."),
  Reports: makeStub("Reports", "Daily / monthly sales, GST, stock and P&L reports."),
  GST: makeStub("GST", "GST sales, purchase, summary and export."),
  Accounts: makeStub("Accounts", "Income, expense, cash book and daily collection."),
  Barcode: makeStub("Barcode", "Generate, print and scan medicine barcodes."),
  QR: makeStub("QR Code", "Generate UPI and medicine QR codes."),
  Settings: makeStub("Settings", "Company, GST, printer, backup and permissions."),
  Backup: makeStub("Backup & Restore", "Backup your database or restore from file."),
};

// dummy route so this file can live under routes/ without registering a path
export const Route = createFileRoute("/_app/_stubs")({
  component: () => null,
});
