import { useEffect, useState, useSyncExternalStore } from "react";
import { MEDICINES as SEED_MEDICINES, type Medicine } from "@/data/medicines";
import { SEED_MENU, type MenuItem } from "@/data/menu";
import { DEFAULT_FEATURES, normalizeBusinessType, type BusinessType, type FeatureKey } from "@/lib/business";
import { db } from "@/lib/supabase-service";
import { getUser } from "@/lib/auth";

export type { Medicine, MenuItem };

export type Hotel = {
  id: string;
  name: string;
  loginId: string;
  password: string;
  ownerName: string;
  phone: string;
  city?: string;
  state?: string;
  plan: "Monthly" | "Yearly" | "Trial";
  businessType?: BusinessType;
  features?: FeatureKey[];
  active?: boolean;
  createdAt: string;
};

export type FinanceEntry = {
  id: string;
  hotelId: string;
  date: string; // yyyy-mm-dd
  kind: "income" | "expense";
  title: string;
  category: string;
  amount: number;
  payment: string; // Cash / UPI / Card / Bank
  note?: string;
};

export type Attendance = {
  id: string;
  hotelId: string;
  employeeId: string;
  employeeName: string;
  date: string; // yyyy-mm-dd
  status: "full" | "half" | "absent" | "leave";
  note?: string;
};

export type SalaryPayment = {
  id: string;
  hotelId: string;
  employeeId: string;
  employeeName: string;
  month: string; // yyyy-mm
  amount: number;
  bonus: number;
  deduction: number;
  paidOn: string;
  payment: string;
};

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
  password?: string;
  active?: boolean;
  createdAt?: string;
  hotelId?: string;
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
  table?: string;
  items: SaleItem[];
  sub: number;
  disc: number;
  gst: number;
  grand: number;
  payment: string;
  status: "paid" | "held" | "cancelled";
  cashierId?: string;
  cashierName?: string;
  hotelId?: string;
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

export type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  action:
    | "bill.save"
    | "bill.cancel"
    | "bill.hold"
    | "bill.resume"
    | "stock.adjust"
    | "medicine.add"
    | "medicine.update"
    | "medicine.delete"
    | "employee.add"
    | "employee.delete"
    | "purchase.add"
    | "login"
    | "hotel.add"
    | "hotel.update"
    | "hotel.delete"
    | "item.add"
    | "item.update"
    | "item.delete"
    | "finance.add"
    | "finance.delete"
    | "attendance.mark"
    | "salary.pay";
  target?: string;
  detail?: string;
};

export type HeldBill = {
  id: string;
  at: string;
  customerName: string;
  phone: string;
  doctor?: string;
  items: { id: string; name: string; batch: string; qty: number; mrp: number; gst: number; discount: number; company?: string }[];
  cashierId?: string;
  cashierName?: string;
};

const DEFAULT_PRINTER: PrinterSettings = {
  paperSize: "80mm",
  storeName: "your business",
  storeAddress: "KL Road, Hindupur - 515201",
  storePhone: "+91 98765 43210",
  gstin: "37ABCDE1234F1Z5",
  drugLicense: "AP/HND/20B-21B/1234",
  footer: "Thank you! Visit again.",
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

const SEED_HOTELS: Hotel[] = [
  {
    id: "T392320",
    name: "VAISALY",
    loginId: "8885848601",
    password: "RAMU",
    ownerName: "RAMU",
    phone: "8885848601",
    city: "Hindupur",
    state: "Andhra Pradesh",
    plan: "Monthly",
    businessType: "Hotel",
    features: DEFAULT_FEATURES.Hotel,
    active: true,
    createdAt: "2026-08-26",
  },
];

const SEED_EMPLOYEES: Employee[] = [
  { id: "E001", name: "Ramesh", role: "Admin", phone: "7569790229", salary: 0, password: "hotel@2026", active: true, createdAt: "2026-01-01", hotelId: "T392320" },
  { id: "E002", name: "Suresh", role: "Cashier", phone: "9876543211", salary: 18000, password: "cashier1", active: true, createdAt: "2026-02-01", hotelId: "T392320" },
  { id: "E003", name: "Lakshmi", role: "Waiter", phone: "9876543212", salary: 14000, password: "waiter1", active: true, createdAt: "2026-02-01", hotelId: "T392320" },
];

const SEED_PURCHASES: Purchase[] = [];

type State = {
  hotels: Hotel[];
  menuItems: MenuItem[];
  medicines: Medicine[];
  customers: Customer[];
  suppliers: Supplier[];
  employees: Employee[];
  sales: Sale[];
  purchases: Purchase[];
  finance: FinanceEntry[];
  attendance: Attendance[];
  salaries: SalaryPayment[];
  printer: PrinterSettings;
  audit: AuditEntry[];
  held: HeldBill[];
};

const KEY = "rsp_store_v1";

const DEFAULT: State = {
  hotels: SEED_HOTELS,
  menuItems: SEED_MENU,
  medicines: SEED_MEDICINES,
  customers: SEED_CUSTOMERS,
  suppliers: SEED_SUPPLIERS,
  employees: SEED_EMPLOYEES,
  sales: [],
  purchases: SEED_PURCHASES,
  finance: [],
  attendance: [],
  salaries: [],
  printer: DEFAULT_PRINTER,
  audit: [],
  held: [],
};

let state: State = DEFAULT;
let hydrated = false;
let syncing = false;
const listeners = new Set<() => void>();

function getActiveTenantId(): string {
  if (typeof window === "undefined") return "";
  const u = getUser();
  return u?.hotelId || "";
}

function load(): State {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<State>;
    const hotels = (parsed.hotels?.length ? parsed.hotels : DEFAULT.hotels).map((h) => ({
      ...h,
      businessType: normalizeBusinessType(h.businessType),
      features: Array.isArray(h.features) ? h.features : DEFAULT_FEATURES[normalizeBusinessType(h.businessType)],
    }));
    const menuItems = parsed.menuItems?.length ? parsed.menuItems : DEFAULT.menuItems;
    return {
      ...DEFAULT,
      ...parsed,
      hotels,
      menuItems,
      employees: parsed.employees ?? DEFAULT.employees,
      finance: parsed.finance ?? [],
      attendance: parsed.attendance ?? [],
      salaries: parsed.salaries ?? [],
      audit: parsed.audit ?? [],
      held: parsed.held ?? [],
      printer: { ...DEFAULT.printer, ...(parsed.printer ?? {}) },
    };
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

export async function syncFromSupabase() {
  if (typeof window === "undefined" || syncing) return;
  const user = getUser();
  if (!user) return;

  syncing = true;
  try {
    if (user.role === "SuperAdmin") {
      const tenants = await db.getTenants();
      if (tenants.length > 0) {
        setState((s) => {
          s.hotels = tenants;
        });
      }
    } else if (user.hotelId) {
      const tenantId = user.hotelId;
      const [prods, custs, supps, sales, purchases, fin, att] = await Promise.all([
        db.getProducts(tenantId),
        db.getCustomers(tenantId),
        db.getSuppliers(tenantId),
        db.getSales(tenantId),
        db.getPurchases(tenantId),
        db.getFinance(tenantId),
        db.getAttendance(tenantId),
      ]);

      setState((s) => {
        if (prods.menuItems.length > 0) s.menuItems = prods.menuItems;
        if (prods.medicines.length > 0) s.medicines = prods.medicines;
        if (custs.length > 0) s.customers = custs;
        if (supps.length > 0) s.suppliers = supps;
        if (sales.length > 0) s.sales = sales;
        if (purchases.length > 0) s.purchases = purchases;
        if (fin.length > 0) s.finance = fin;
        if (att.length > 0) s.attendance = att;
      });
    }
  } catch (err) {
    console.warn("Background Supabase sync error:", err);
  } finally {
    syncing = false;
  }
}

export function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  state = load();
  hydrated = true;
  emit();
  syncFromSupabase();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useStore<T>(selector: (s: State) => T): T {
  useEffect(() => hydrate(), []);
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(DEFAULT));
}

function setState(mut: (s: State) => void) {
  const next = structuredClone(state);
  mut(next);
  state = next;
  persist();
  emit();
}

function audit(entry: Omit<AuditEntry, "id" | "at">) {
  setState((s) => {
    s.audit.unshift({
      ...entry,
      id: "A" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100),
      at: new Date().toISOString(),
    });
    if (s.audit.length > 500) s.audit = s.audit.slice(0, 500);
  });
}

function actorLabel(actor?: { id: string; name: string }) {
  if (!actor) return "system";
  return `${actor.id} · ${actor.name}`;
}

export const actions = {
  // ---- SaaS: business accounts (super admin only) ----
  addHotel(h: Omit<Hotel, "id" | "createdAt">, actor?: { id: string; name: string }): Hotel {
    const id = "T" + Math.floor(100000 + Math.random() * 900000);
    const rec: Hotel = {
      ...h,
      id,
      active: h.active ?? true,
      createdAt: new Date().toISOString(),
    };
    setState((s) => {
      s.hotels.unshift(rec);
    });
    audit({ actor: actorLabel(actor), action: "hotel.add", target: rec.id, detail: `${rec.name} · ${rec.loginId}` });
    db.createTenant(rec).catch((err) => console.error("Supabase createTenant error:", err));
    return rec;
  },

  updateHotel(id: string, patch: Partial<Hotel>, actor?: { id: string; name: string }) {
    setState((s) => {
      const i = s.hotels.findIndex((x) => x.id === id);
      if (i >= 0) s.hotels[i] = { ...s.hotels[i], ...patch };
    });
    audit({ actor: actorLabel(actor), action: "hotel.update", target: id });
    db.updateTenant(id, patch).catch((err) => console.error("Supabase updateTenant error:", err));
  },

  deleteHotel(id: string, actor?: { id: string; name: string }) {
    setState((s) => {
      s.hotels = s.hotels.filter((h) => h.id !== id);
      s.menuItems = s.menuItems.filter((m) => m.hotelId !== id);
      s.employees = s.employees.filter((e) => e.hotelId !== id);
    });
    audit({ actor: actorLabel(actor), action: "hotel.delete", target: id });
    db.deleteTenant(id).catch((err) => console.error("Supabase deleteTenant error:", err));
  },

  // ---- Menu items / Products (Hotel / Shop Admin) ----
  addMenuItem(m: Omit<MenuItem, "id">, actor?: { id: string; name: string }): MenuItem {
    const rec: MenuItem = { ...m, active: m.active ?? true, id: "IT" + Date.now().toString().slice(-7) };
    setState((s) => {
      s.menuItems.unshift(rec);
    });
    audit({ actor: actorLabel(actor), action: "item.add", target: rec.name, detail: `₹${rec.price}` });
    const tenantId = m.hotelId || getActiveTenantId();
    if (tenantId) {
      db.saveProduct(tenantId, rec).catch((err) => console.error("Supabase saveProduct error:", err));
    }
    return rec;
  },

  updateMenuItem(id: string, patch: Partial<MenuItem>, actor?: { id: string; name: string }) {
    setState((s) => {
      const i = s.menuItems.findIndex((x) => x.id === id);
      if (i >= 0) s.menuItems[i] = { ...s.menuItems[i], ...patch };
    });
    audit({ actor: actorLabel(actor), action: "item.update", target: id });
    const tenantId = patch.hotelId || getActiveTenantId();
    if (tenantId) {
      const existing = state.menuItems.find((m) => m.id === id);
      if (existing) {
        db.saveProduct(tenantId, { ...existing, ...patch }).catch((err) => console.error("Supabase saveProduct update error:", err));
      }
    }
  },

  deleteMenuItem(id: string, actor?: { id: string; name: string }) {
    const item = state.menuItems.find((m) => m.id === id);
    setState((s) => {
      s.menuItems = s.menuItems.filter((m) => m.id !== id);
    });
    audit({ actor: actorLabel(actor), action: "item.delete", target: id });
    const tenantId = item?.hotelId || getActiveTenantId();
    if (tenantId) {
      db.deleteProduct(tenantId, id).catch((err) => console.error("Supabase deleteProduct error:", err));
    }
  },

  // ---- Income & expense ----
  addFinance(e: Omit<FinanceEntry, "id">, actor?: { id: string; name: string }): FinanceEntry {
    const rec: FinanceEntry = { ...e, id: "F" + Date.now().toString().slice(-8) };
    setState((s) => {
      s.finance.unshift(rec);
    });
    audit({ actor: actorLabel(actor), action: "finance.add", target: rec.title, detail: `${rec.kind} ₹${rec.amount}` });
    const tenantId = e.hotelId || getActiveTenantId();
    if (tenantId) {
      db.addFinance(tenantId, rec).catch((err) => console.error("Supabase addFinance error:", err));
    }
    return rec;
  },

  deleteFinance(id: string, actor?: { id: string; name: string }) {
    setState((s) => {
      s.finance = s.finance.filter((f) => f.id !== id);
    });
    audit({ actor: actorLabel(actor), action: "finance.delete", target: id });
    const tenantId = getActiveTenantId();
    if (tenantId) {
      db.deleteFinance(tenantId, id).catch((err) => console.error("Supabase deleteFinance error:", err));
    }
  },

  // ---- Attendance & salary ----
  markAttendance(a: Omit<Attendance, "id">, actor?: { id: string; name: string }): Attendance {
    const rec: Attendance = { ...a, id: "AT" + Date.now().toString().slice(-8) };
    setState((s) => {
      s.attendance = s.attendance.filter(
        (x) => !(x.employeeId === a.employeeId && x.date === a.date),
      );
      s.attendance.unshift(rec);
    });
    audit({ actor: actorLabel(actor), action: "attendance.mark", target: a.employeeName, detail: `${a.date} · ${a.status}` });
    const tenantId = a.hotelId || getActiveTenantId();
    if (tenantId) {
      db.markAttendance(tenantId, rec).catch((err) => console.error("Supabase markAttendance error:", err));
    }
    return rec;
  },

  deleteAttendance(id: string) {
    setState((s) => {
      s.attendance = s.attendance.filter((a) => a.id !== id);
    });
    const tenantId = getActiveTenantId();
    if (tenantId) {
      db.deleteAttendance(tenantId, id).catch((err) => console.error("Supabase deleteAttendance error:", err));
    }
  },

  paySalary(p: Omit<SalaryPayment, "id">, actor?: { id: string; name: string }): SalaryPayment {
    const rec: SalaryPayment = { ...p, id: "SL" + Date.now().toString().slice(-8) };
    const finRec: FinanceEntry = {
      id: "F" + Date.now().toString().slice(-8),
      hotelId: p.hotelId,
      date: p.paidOn.slice(0, 10),
      kind: "expense",
      title: `Salary · ${p.employeeName}`,
      category: "Salary",
      amount: p.amount + p.bonus - p.deduction,
      payment: p.payment,
      note: `Month ${p.month}`,
    };

    setState((s) => {
      s.salaries.unshift(rec);
      s.finance.unshift(finRec);
    });
    audit({ actor: actorLabel(actor), action: "salary.pay", target: p.employeeName, detail: `${p.month} · ₹${p.amount}` });

    const tenantId = p.hotelId || getActiveTenantId();
    if (tenantId) {
      db.addFinance(tenantId, finRec).catch((err) => console.error("Supabase paySalary finance error:", err));
    }
    return rec;
  },

  deleteSalary(id: string) {
    setState((s) => {
      s.salaries = s.salaries.filter((x) => x.id !== id);
    });
  },

  // ---- Medicines / Stock Management ----
  addMedicine(m: Omit<Medicine, "id">, actor?: { id: string; name: string }) {
    const id = "M" + Date.now().toString().slice(-6);
    const rec: Medicine = { ...m, id };
    setState((s) => {
      s.medicines.unshift(rec);
    });
    audit({ actor: actorLabel(actor), action: "medicine.add", target: m.name });
    const tenantId = getActiveTenantId();
    if (tenantId) {
      db.saveProduct(tenantId, {
        id,
        name: m.name,
        batch: m.batch || "STANDARD",
        price: m.mrp,
        cost: m.cost,
        gst: m.gst,
        stock: m.stock,
        category: m.category,
        barcode: m.code,
        unit: m.units,
      }).catch((err) => console.error("Supabase addMedicine error:", err));
    }
  },

  updateMedicine(id: string, patch: Partial<Medicine>, actor?: { id: string; name: string }) {
    setState((s) => {
      const i = s.medicines.findIndex((x) => x.id === id);
      if (i >= 0) s.medicines[i] = { ...s.medicines[i], ...patch };
    });
    audit({ actor: actorLabel(actor), action: "medicine.update", target: id, detail: JSON.stringify(patch) });
    const tenantId = getActiveTenantId();
    if (tenantId) {
      const existing = state.medicines.find((m) => m.id === id);
      if (existing) {
        db.saveProduct(tenantId, {
          id,
          name: patch.name || existing.name,
          batch: patch.batch || existing.batch,
          price: patch.mrp ?? existing.mrp,
          cost: patch.cost ?? existing.cost,
          gst: patch.gst ?? existing.gst,
          stock: patch.stock ?? existing.stock,
          category: patch.category || existing.category,
        }).catch((err) => console.error("Supabase updateMedicine error:", err));
      }
    }
  },

  deleteMedicine(id: string, actor?: { id: string; name: string }) {
    setState((s) => {
      s.medicines = s.medicines.filter((x) => x.id !== id);
    });
    audit({ actor: actorLabel(actor), action: "medicine.delete", target: id });
    const tenantId = getActiveTenantId();
    if (tenantId) {
      db.deleteProduct(tenantId, id).catch((err) => console.error("Supabase deleteMedicine error:", err));
    }
  },

  bulkAddMedicines(list: Omit<Medicine, "id">[]) {
    list.forEach((m) => actions.addMedicine(m));
  },

  adjustStock(id: string, delta: number, reason: string, actor?: { id: string; name: string }) {
    setState((s) => {
      const m = s.medicines.find((x) => x.id === id);
      if (m) m.stock = Math.max(0, m.stock + delta);
    });
    audit({ actor: actorLabel(actor), action: "stock.adjust", target: id, detail: `${delta > 0 ? "+" : ""}${delta} · ${reason}` });
    const tenantId = getActiveTenantId();
    if (tenantId) {
      db.adjustStock(tenantId, id, delta).catch((err) => console.error("Supabase adjustStock error:", err));
    }
  },

  // ---- Customers ----
  upsertCustomerByPhone(input: { name: string; phone: string; doctor?: string }): Customer {
    const phone = input.phone.trim();
    if (!phone) {
      return { id: "WALK", name: input.name || "Walk-in", phone: "", doctor: input.doctor, balance: 0, createdAt: new Date().toISOString() };
    }
    const existing = state.customers.find((c) => c.phone === phone);
    if (existing) {
      if (input.name && input.name !== existing.name) {
        setState((s) => {
          const c = s.customers.find((x) => x.phone === phone);
          if (c) {
            c.name = input.name;
            if (input.doctor) c.doctor = input.doctor;
          }
        });
        const tenantId = getActiveTenantId();
        if (tenantId) {
          db.saveCustomer(tenantId, { ...existing, name: input.name, doctor: input.doctor }).catch((err) => console.error("Supabase saveCustomer error:", err));
        }
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
    setState((s) => {
      s.customers.unshift(created);
    });
    const tenantId = getActiveTenantId();
    if (tenantId) {
      db.saveCustomer(tenantId, created).catch((err) => console.error("Supabase saveCustomer error:", err));
    }
    return created;
  },

  addCustomer(c: Omit<Customer, "id" | "createdAt" | "balance"> & { balance?: number }) {
    const rec: Customer = {
      ...c,
      id: "C" + Date.now().toString().slice(-6),
      balance: c.balance ?? 0,
      createdAt: new Date().toISOString(),
    };
    setState((s) => {
      s.customers.unshift(rec);
    });
    const tenantId = getActiveTenantId();
    if (tenantId) {
      db.saveCustomer(tenantId, rec).catch((err) => console.error("Supabase addCustomer error:", err));
    }
  },

  bulkAddCustomers(list: (Omit<Customer, "id" | "createdAt" | "balance"> & { balance?: number })[]) {
    list.forEach((c) => actions.addCustomer(c));
  },

  deleteCustomer(id: string) {
    setState((s) => {
      s.customers = s.customers.filter((c) => c.id !== id);
    });
    const tenantId = getActiveTenantId();
    if (tenantId) {
      db.deleteCustomer(tenantId, id).catch((err) => console.error("Supabase deleteCustomer error:", err));
    }
  },

  // ---- Suppliers ----
  addSupplier(s: Omit<Supplier, "id">) {
    const rec: Supplier = { ...s, id: "S" + Date.now().toString().slice(-6) };
    setState((st) => {
      st.suppliers.unshift(rec);
    });
    const tenantId = getActiveTenantId();
    if (tenantId) {
      db.saveSupplier(tenantId, rec).catch((err) => console.error("Supabase saveSupplier error:", err));
    }
  },

  // ---- Employees ----
  addEmployee(e: Omit<Employee, "id" | "createdAt">, actor?: { id: string; name: string }): Employee {
    const id = "E" + (100 + state.employees.length + 1).toString().padStart(3, "0");
    const rec: Employee = { ...e, id, active: e.active ?? true, createdAt: new Date().toISOString() };
    setState((s) => {
      s.employees.unshift(rec);
    });
    audit({ actor: actorLabel(actor), action: "employee.add", target: id, detail: `${rec.name} · ${rec.role}` });
    return rec;
  },

  updateEmployee(id: string, patch: Partial<Employee>) {
    setState((s) => {
      const i = s.employees.findIndex((x) => x.id === id);
      if (i >= 0) s.employees[i] = { ...s.employees[i], ...patch };
    });
  },

  deleteEmployee(id: string, actor?: { id: string; name: string }) {
    setState((s) => {
      s.employees = s.employees.filter((e) => e.id !== id);
    });
    audit({ actor: actorLabel(actor), action: "employee.delete", target: id });
  },

  // ---- Purchases ----
  addPurchase(p: Omit<Purchase, "id">, actor?: { id: string; name: string }) {
    const rec: Purchase = { ...p, id: "P" + Date.now().toString().slice(-6) };
    setState((s) => {
      s.purchases.unshift(rec);
      p.items.forEach((it) => {
        const m =
          s.medicines.find((x) => x.name.toLowerCase() === it.name.toLowerCase() && x.batch === it.batch) ||
          s.medicines.find((x) => x.name.toLowerCase() === it.name.toLowerCase());
        if (m) m.stock += it.qty;

        const mi = s.menuItems.find((x) => x.name.toLowerCase() === it.name.toLowerCase());
        if (mi) (mi as any).stock = ((mi as any).stock || 0) + it.qty;
      });
    });
    audit({ actor: actorLabel(actor), action: "purchase.add", target: p.invoiceNo, detail: `${p.supplier} · ₹${p.total}` });
    const tenantId = getActiveTenantId();
    if (tenantId) {
      db.savePurchase(tenantId, rec).catch((err) => console.error("Supabase addPurchase error:", err));
    }
  },

  // ---- Sales & Billing ----
  saveSale(
    sale: Omit<Sale, "id" | "date" | "status">,
    actor?: { id: string; name: string },
  ): Sale {
    const record: Sale = {
      ...sale,
      cashierId: actor?.id,
      cashierName: actor?.name,
      id: "INV" + Date.now().toString().slice(-6),
      date: new Date().toISOString(),
      status: "paid",
    };
    setState((s) => {
      s.sales.unshift(record);
      // Stock deduction in local state
      sale.items.forEach((it) => {
        let remaining = it.qty;
        const candidates = s.medicines
          .filter((m) => m.name.toLowerCase() === it.name.toLowerCase() && m.stock > 0)
          .sort((a, b) => a.expiry.localeCompare(b.expiry));
        for (const m of candidates) {
          if (remaining <= 0) break;
          const take = Math.min(m.stock, remaining);
          m.stock -= take;
          remaining -= take;
        }
        if (remaining > 0) {
          const exact = s.medicines.find((x) => x.name.toLowerCase() === it.name.toLowerCase());
          if (exact) exact.stock = Math.max(0, exact.stock - remaining);
        }

        const mi = s.menuItems.find((x) => x.name.toLowerCase() === it.name.toLowerCase() || x.id === it.id);
        if (mi) (mi as any).stock = Math.max(0, ((mi as any).stock || 0) - it.qty);
      });
    });
    audit({ actor: actorLabel(actor), action: "bill.save", target: record.id, detail: `₹${record.grand} · ${record.payment}` });

    const tenantId = sale.hotelId || getActiveTenantId();
    if (tenantId) {
      db.saveSale(tenantId, record).catch((err) => console.error("Supabase saveSale error:", err));
    }
    return record;
  },

  cancelSale(id: string, actor?: { id: string; name: string }) {
    setState((s) => {
      const sale = s.sales.find((x) => x.id === id);
      if (!sale || sale.status === "cancelled") return;
      sale.status = "cancelled";
      sale.items.forEach((it) => {
        const m =
          s.medicines.find((x) => x.name.toLowerCase() === it.name.toLowerCase() && x.batch === it.batch) ??
          s.medicines.find((x) => x.name.toLowerCase() === it.name.toLowerCase());
        if (m) m.stock += it.qty;

        const mi = s.menuItems.find((x) => x.name.toLowerCase() === it.name.toLowerCase() || x.id === it.id);
        if (mi) (mi as any).stock = ((mi as any).stock || 0) + it.qty;
      });
    });
    audit({ actor: actorLabel(actor), action: "bill.cancel", target: id });
    const tenantId = getActiveTenantId();
    if (tenantId) {
      db.cancelSale(tenantId, id).catch((err) => console.error("Supabase cancelSale error:", err));
    }
  },

  holdBill(bill: Omit<HeldBill, "id" | "at">, actor?: { id: string; name: string }): HeldBill {
    const rec: HeldBill = {
      ...bill,
      id: "H" + Date.now().toString().slice(-6),
      at: new Date().toISOString(),
      cashierId: actor?.id,
      cashierName: actor?.name,
    };
    setState((s) => {
      s.held.unshift(rec);
    });
    audit({ actor: actorLabel(actor), action: "bill.hold", target: rec.id });
    return rec;
  },

  resumeHeld(id: string): HeldBill | null {
    const found = state.held.find((h) => h.id === id) ?? null;
    if (found) {
      setState((s) => {
        s.held = s.held.filter((h) => h.id !== id);
      });
    }
    return found;
  },

  deleteHeld(id: string) {
    setState((s) => {
      s.held = s.held.filter((h) => h.id !== id);
    });
  },

  updatePrinter(patch: Partial<PrinterSettings>) {
    setState((s) => {
      s.printer = { ...s.printer, ...patch };
    });
  },

  logLogin(actor: { id: string; name: string }) {
    audit({ actor: actorLabel(actor), action: "login" });
  },

  resetAll() {
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
  useEffect(() => {
    hydrate();
    setOk(true);
  }, []);
  return ok;
}
