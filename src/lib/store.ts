import { useEffect, useState, useSyncExternalStore } from "react";
import { MEDICINES as SEED_MEDICINES, type Medicine } from "@/data/medicines";

export type { Medicine };

export type Customer = {
  id: string;
  name: string;
  phone: string;
  doctor?: string;
  address?: string;
  balance: number;
  createdAt: string;
};

export type Supplier = {
  id: string;
  name: string;
  phone: string;
  gstin?: string;
  city?: string;
  balance: number;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: number;
};

export type SaleItem = {
  id: string;
  name: string;
  batch: string;
  qty: number;
  mrp: number;
  gst: number;
  discount: number;
  total: number;
};

export type Sale = {
  id: string;
  date: string;
  customerId: string | null;
  customerName: string;
  phone: string;
  doctor?: string;
  items: SaleItem[];
  sub: number;
  disc: number;
  gst: number;
  grand: number;
  payment: string;
  status: "paid" | "held" | "cancelled";
};

export type Purchase = {
  id: string;
  date: string;
  supplier: string;
  invoiceNo: string;
  items: { name: string; batch: string; qty: number; rate: number; gst: number }[];
  total: number;
};

export type PrinterSettings = {
  paperSize: "58mm" | "80mm" | "A4";
  storeName: string;
  storeAddress: string;
  storePhone: string;
  gstin: string;
  drugLicense: string;
  footer: string;
  showLogo: boolean;
  copies: number;
  autoPrint: boolean;
};

const DEFAULT_PRINTER: PrinterSettings = {
  paperSize: "80mm",
  storeName: "ANAM Medical Store",
  storeAddress: "KL Road, Hindupur - 515201",
  storePhone: "+91 98765 43210",
  gstin: "37ABCDE1234F1Z5",
  drugLicense: "AP/HND/20B-21B/1234",
  footer: "Thank you! Get well soon.",
  showLogo: true,
  copies: 1,
  autoPrint: false,
};

const SEED_CUSTOMERS: Customer[] = [
  { id: "C001", name: "Ravi Kumar", phone: "9876500001", doctor: "Dr. Rao", balance: 0, createdAt: "2026-06-01" },
  { id: "C002", name: "Sujatha S.", phone: "9876500002", doctor: "Dr. Latha", balance: 250, createdAt: "2026-06-02" },
  { id: "C003", name: "K. Mohan", phone: "9876500003", balance: 0, createdAt: "2026-06-03" },
  { id: "C004", name: "Priya R.", phone: "9876500004", doctor: "Dr. Sharma", balance: 120, createdAt: "2026-06-05" },
];

const SEED_SUPPLIERS: Supplier[] = [
  { id: "S001", name: "MedPlus Distribution", phone: "9000011111", gstin: "37AAAAA0000A1Z5", city: "Hindupur", balance: 12500 },
  { id: "S002", name: "Cipla Wholesale", phone: "9000022222", gstin: "27BBBBB0000B1Z5", city: "Bengaluru", balance: 0 },
  { id: "S003", name: "Sun Pharma Depot", phone: "9000033333", gstin: "27CCCCC0000C1Z5", city: "Bengaluru", balance: 4200 },
];

const SEED_EMPLOYEES: Employee[] = [
  { id: "E001", name: "Manjju", role: "Admin", phone: "9876543210", salary: 35000 },
  { id: "E002", name: "Ramesh", role: "Cashier", phone: "9876543211", salary: 18000 },
  { id: "E003", name: "Lakshmi", role: "Pharmacist", phone: "9876543212", salary: 22000 },
];

const SEED_PURCHASES: Purchase[] = [
  {
    id: "P001", date: "2026-07-10", supplier: "MedPlus Distribution", invoiceNo: "MP-4421",
    items: [
      { name: "Paracetamol 500mg", batch: "B12A", qty: 200, rate: 18, gst: 5 },
      { name: "Cetirizine 10mg", batch: "CT09", qty: 150, rate: 12, gst: 5 },
    ], total: 5400,
  },
  {
    id: "P002", date: "2026-07-12", supplier: "Sun Pharma Depot", invoiceNo: "SP-9982",
    items: [{ name: "Azithromycin 500mg", batch: "AZ88", qty: 60, rate: 55, gst: 12 }],
    total: 3696,
  },
];

type State = {
  medicines: Medicine[];
  customers: Customer[];
  suppliers: Supplier[];
  employees: Employee[];
  sales: Sale[];
  purchases: Purchase[];
  printer: PrinterSettings;
};

const KEY = "rsp_store_v1";

const DEFAULT: State = {
  medicines: SEED_MEDICINES,
  customers: SEED_CUSTOMERS,
  suppliers: SEED_SUPPLIERS,
  employees: SEED_EMPLOYEES,
  sales: [],
  purchases: SEED_PURCHASES,
  printer: DEFAULT_PRINTER,
};

let state: State = DEFAULT;
let hydrated = false;
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<State>;
    return { ...DEFAULT, ...parsed, printer: { ...DEFAULT.printer, ...(parsed.printer ?? {}) } };
  } catch {
    return DEFAULT;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

function emit() {
  listeners.forEach((l) => l());
}

export function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  state = load();
  hydrated = true;
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useStore<T>(selector: (s: State) => T): T {
  useEffect(() => hydrate(), []);
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(DEFAULT),
  );
}

function setState(mut: (s: State) => void) {
  const next = structuredClone(state);
  mut(next);
  state = next;
  persist();
  emit();
}

// --- actions ---
export const actions = {
  addMedicine(m: Omit<Medicine, "id">) {
    setState((s) => {
      s.medicines.unshift({ ...m, id: "M" + Date.now().toString().slice(-6) });
    });
  },
  updateMedicine(id: string, patch: Partial<Medicine>) {
    setState((s) => {
      const i = s.medicines.findIndex((x) => x.id === id);
      if (i >= 0) s.medicines[i] = { ...s.medicines[i], ...patch };
    });
  },
  deleteMedicine(id: string) {
    setState((s) => { s.medicines = s.medicines.filter((x) => x.id !== id); });
  },
  bulkAddMedicines(list: Omit<Medicine, "id">[]) {
    setState((s) => {
      list.forEach((m, i) => s.medicines.unshift({ ...m, id: "M" + (Date.now() + i).toString().slice(-6) }));
    });
  },

  upsertCustomerByPhone(input: { name: string; phone: string; doctor?: string }): Customer {
    const phone = input.phone.trim();
    if (!phone) {
      const c: Customer = {
        id: "WALK", name: input.name || "Walk-in", phone: "", doctor: input.doctor,
        balance: 0, createdAt: new Date().toISOString(),
      };
      return c;
    }
    const existing = state.customers.find((c) => c.phone === phone);
    if (existing) {
      if (input.name && input.name !== existing.name) {
        setState((s) => {
          const c = s.customers.find((x) => x.phone === phone);
          if (c) { c.name = input.name; if (input.doctor) c.doctor = input.doctor; }
        });
      }
      return state.customers.find((c) => c.phone === phone)!;
    }
    const created: Customer = {
      id: "C" + Date.now().toString().slice(-6),
      name: input.name || "Walk-in",
      phone,
      doctor: input.doctor,
      balance: 0,
      createdAt: new Date().toISOString(),
    };
    setState((s) => { s.customers.unshift(created); });
    return created;
  },
  addCustomer(c: Omit<Customer, "id" | "createdAt" | "balance"> & { balance?: number }) {
    setState((s) => {
      s.customers.unshift({
        ...c, id: "C" + Date.now().toString().slice(-6),
        balance: c.balance ?? 0, createdAt: new Date().toISOString(),
      });
    });
  },
  bulkAddCustomers(list: (Omit<Customer, "id" | "createdAt" | "balance"> & { balance?: number })[]) {
    setState((s) => {
      list.forEach((c, i) => s.customers.unshift({
        ...c, id: "C" + (Date.now() + i).toString().slice(-6),
        balance: c.balance ?? 0, createdAt: new Date().toISOString(),
      }));
    });
  },
  deleteCustomer(id: string) {
    setState((s) => { s.customers = s.customers.filter((c) => c.id !== id); });
  },

  addSupplier(s: Omit<Supplier, "id">) {
    setState((st) => { st.suppliers.unshift({ ...s, id: "S" + Date.now().toString().slice(-6) }); });
  },
  addEmployee(e: Omit<Employee, "id">) {
    setState((st) => { st.employees.unshift({ ...e, id: "E" + Date.now().toString().slice(-6) }); });
  },
  addPurchase(p: Omit<Purchase, "id">) {
    setState((s) => { s.purchases.unshift({ ...p, id: "P" + Date.now().toString().slice(-6) }); });
  },

  saveSale(sale: Omit<Sale, "id" | "date" | "status">): Sale {
    const record: Sale = {
      ...sale,
      id: sale.customerId === null && !sale.phone ? "INV" + Date.now().toString().slice(-6) : "INV" + Date.now().toString().slice(-6),
      date: new Date().toISOString(),
      status: "paid",
    };
    setState((s) => {
      s.sales.unshift(record);
      // decrement stock
      sale.items.forEach((it) => {
        const m = s.medicines.find((x) => x.name === it.name && x.batch === it.batch);
        if (m) m.stock = Math.max(0, m.stock - it.qty);
      });
    });
    return record;
  },
  cancelSale(id: string) {
    setState((s) => {
      const sale = s.sales.find((x) => x.id === id);
      if (!sale || sale.status === "cancelled") return;
      sale.status = "cancelled";
      // restore stock
      sale.items.forEach((it) => {
        const m = s.medicines.find((x) => x.name === it.name && x.batch === it.batch);
        if (m) m.stock += it.qty;
      });
    });
  },

  updatePrinter(patch: Partial<PrinterSettings>) {
    setState((s) => { s.printer = { ...s.printer, ...patch }; });
  },

  resetAll() {
    setState(() => {
      Object.assign(state, DEFAULT);
    });
    state = structuredClone(DEFAULT);
    persist();
    emit();
  },

  exportJSON(): string {
    return JSON.stringify(state, null, 2);
  },
  importJSON(json: string) {
    const parsed = JSON.parse(json) as State;
    state = { ...DEFAULT, ...parsed };
    persist();
    emit();
  },
};

export function useHydrated() {
  const [ok, setOk] = useState(false);
  useEffect(() => { hydrate(); setOk(true); }, []);
  return ok;
}
