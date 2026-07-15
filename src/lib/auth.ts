// Role-based auth. Phone = user ID. Manjju is main admin.
// Employees added via /employees get an auto-generated password.

export type Role = "Admin" | "Manager" | "Cashier" | "Pharmacist";

export type AuthUser = {
  id: string;         // Employee ID e.g. E001 or "ADMIN"
  phone: string;      // login username
  name: string;
  role: Role;
  store: string;
  isMainAdmin?: boolean;
};

const KEY = "rsp_auth_user";

// Main admin (Manjju) — always available regardless of employees list.
export const MAIN_ADMIN = {
  id: "ADMIN",
  phone: "9876543210",
  password: "anam@2026",
  name: "Manjju",
  role: "Admin" as Role,
  store: "ANAM Medical Store",
};

// Legacy email support so old demo login (manjju@anam.com) still works
const LEGACY_EMAIL = "manjju@anam.com";

type EmployeeRecord = { id: string; name: string; role: string; phone: string; password?: string; active?: boolean };

function readEmployees(): EmployeeRecord[] {
  try {
    const raw = localStorage.getItem("rsp_store_v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return (parsed?.employees ?? []) as EmployeeRecord[];
  } catch {
    return [];
  }
}

export function login(usernameOrPhone: string, password: string, remember: boolean): AuthUser | null {
  const u = usernameOrPhone.trim().toLowerCase();

  // Main admin: phone or legacy email
  if ((u === MAIN_ADMIN.phone || u === LEGACY_EMAIL) && password === MAIN_ADMIN.password) {
    const user: AuthUser = {
      id: MAIN_ADMIN.id, phone: MAIN_ADMIN.phone, name: MAIN_ADMIN.name,
      role: MAIN_ADMIN.role, store: MAIN_ADMIN.store, isMainAdmin: true,
    };
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(user));
    return user;
  }

  // Employees table
  const emps = readEmployees();
  const match = emps.find(
    (e) => e.phone.trim() === u && (e.password ?? "") === password && (e.active ?? true),
  );
  if (match) {
    const role = normalizeRole(match.role);
    const user: AuthUser = {
      id: match.id, phone: match.phone, name: match.name, role,
      store: MAIN_ADMIN.store,
    };
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(user));
    return user;
  }
  return null;
}

function normalizeRole(r: string): Role {
  const x = r.toLowerCase();
  if (x.includes("admin")) return "Admin";
  if (x.includes("manag")) return "Manager";
  if (x.includes("pharm")) return "Pharmacist";
  return "Cashier";
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function logout() {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
}

export function updateStoredUser(patch: Partial<AuthUser>) {
  const u = getUser();
  if (!u) return;
  const next = { ...u, ...patch };
  const store = localStorage.getItem(KEY) ? localStorage : sessionStorage;
  store.setItem(KEY, JSON.stringify(next));
}

export function generatePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// Role-based capability map
export const CAN: Record<Role, {
  billing: boolean;
  sales: boolean;
  cancelBill: boolean;
  purchase: boolean;
  inventory: boolean;
  medicines: boolean;
  customers: boolean;
  suppliers: boolean;
  employees: boolean;
  reports: boolean;
  gst: boolean;
  accounts: boolean;
  barcode: boolean;
  qr: boolean;
  settings: boolean;
  backup: boolean;
  audit: boolean;
  dashboard: boolean;
}> = {
  Admin:      { billing: true, sales: true, cancelBill: true, purchase: true, inventory: true, medicines: true, customers: true, suppliers: true, employees: true, reports: true, gst: true, accounts: true, barcode: true, qr: true, settings: true, backup: true, audit: true, dashboard: true },
  Manager:    { billing: true, sales: true, cancelBill: true, purchase: true, inventory: true, medicines: true, customers: true, suppliers: true, employees: false, reports: true, gst: true, accounts: true, barcode: true, qr: true, settings: false, backup: true, audit: true, dashboard: true },
  Pharmacist: { billing: true, sales: true, cancelBill: false, purchase: true, inventory: true, medicines: true, customers: true, suppliers: false, employees: false, reports: false, gst: false, accounts: false, barcode: true, qr: true, settings: false, backup: false, audit: false, dashboard: true },
  Cashier:    { billing: true, sales: true, cancelBill: false, purchase: false, inventory: false, medicines: false, customers: true, suppliers: false, employees: false, reports: false, gst: false, accounts: false, barcode: false, qr: true, settings: false, backup: false, audit: false, dashboard: true },
};

export const DEMO_CREDENTIALS = { phone: MAIN_ADMIN.phone, password: MAIN_ADMIN.password };
