// SaaS auth for RSP SuperBill.
// 1) Super Admin (us) — creates hotel accounts and hands out User ID + Password.
// 2) Hotel Admin — the hotel owner, logs in with the User ID we created.
// 3) Hotel staff (Manager / Cashier / Waiter) — created by the hotel admin in Employees.
// All data is stored per hotel (hotelId) so one hotel never sees another hotel's data.

export type Role = "SuperAdmin" | "Admin" | "Manager" | "Cashier" | "Waiter" | "Pharmacist";

export type AuthUser = {
  id: string; // "SUPER", hotel id, or employee id
  phone: string; // login id
  name: string;
  role: Role;
  store: string; // hotel / business name
  hotelId: string; // "" for super admin
  isMainAdmin?: boolean;
};

const KEY = "rsp_auth_user";

// Software owner account (Super Admin).
export const SUPER_ADMIN = {
  id: "SUPER",
  loginId: "superadmin",
  password: "rsp@super2026",
  name: "RSP Super Admin",
  role: "SuperAdmin" as Role,
};

type HotelRecord = {
  id: string;
  name: string;
  loginId: string;
  password: string;
  ownerName: string;
  active?: boolean;
};

type EmployeeRecord = {
  id: string;
  name: string;
  role: string;
  phone: string;
  password?: string;
  active?: boolean;
  hotelId?: string;
};

function readStore(): { hotels: HotelRecord[]; employees: EmployeeRecord[] } {
  try {
    const raw = localStorage.getItem("rsp_store_v1");
    if (!raw) return { hotels: [], employees: [] };
    const parsed = JSON.parse(raw);
    return { hotels: parsed?.hotels ?? [], employees: parsed?.employees ?? [] };
  } catch {
    return { hotels: [], employees: [] };
  }
}

export function login(loginId: string, password: string, remember: boolean): AuthUser | null {
  const u = loginId.trim().toLowerCase();
  const save = (user: AuthUser) => {
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(user));
    return user;
  };

  if (u === SUPER_ADMIN.loginId && password === SUPER_ADMIN.password) {
    return save({
      id: SUPER_ADMIN.id, phone: SUPER_ADMIN.loginId, name: SUPER_ADMIN.name,
      role: "SuperAdmin", store: "RSP Software", hotelId: "", isMainAdmin: true,
    });
  }

  const { hotels, employees } = readStore();

  const hotel = hotels.find(
    (h) => h.loginId?.trim().toLowerCase() === u && h.password === password && (h.active ?? true),
  );
  if (hotel) {
    return save({
      id: hotel.id, phone: hotel.loginId, name: hotel.ownerName || hotel.name,
      role: "Admin", store: hotel.name, hotelId: hotel.id, isMainAdmin: true,
    });
  }

  const emp = employees.find(
    (e) => e.phone?.trim().toLowerCase() === u && (e.password ?? "") === password && (e.active ?? true),
  );
  if (emp) {
    const hotelId = emp.hotelId ?? hotels[0]?.id ?? "H001";
    const h = hotels.find((x) => x.id === hotelId);
    return save({
      id: emp.id, phone: emp.phone, name: emp.name, role: normalizeRole(emp.role),
      store: h?.name ?? "My Hotel", hotelId,
    });
  }
  return null;
}

function normalizeRole(r: string): Role {
  const x = (r || "").toLowerCase();
  if (x.includes("super")) return "Manager"; // never grant super admin from employees
  if (x.includes("admin")) return "Admin";
  if (x.includes("manag")) return "Manager";
  if (x.includes("wait") || x.includes("steward")) return "Waiter";
  return "Cashier";
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as AuthUser;
    return { ...u, hotelId: u.hotelId ?? "" };
  } catch {
    return null;
  }
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
  hotels: boolean;
  billing: boolean;
  sales: boolean;
  cancelBill: boolean;
  purchase: boolean;
  inventory: boolean;
  items: boolean;
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
  SuperAdmin: { hotels: true, billing: false, sales: false, cancelBill: false, purchase: false, inventory: false, items: false, medicines: false, customers: false, suppliers: false, employees: false, reports: false, gst: false, accounts: false, barcode: false, qr: false, settings: true, backup: true, audit: true, dashboard: false },
  Admin:      { hotels: false, billing: true, sales: true, cancelBill: true, purchase: true, inventory: true, items: true, medicines: false, customers: true, suppliers: true, employees: true, reports: true, gst: true, accounts: true, barcode: true, qr: false, settings: true, backup: true, audit: true, dashboard: true },
  Manager:    { hotels: false, billing: true, sales: true, cancelBill: true, purchase: true, inventory: true, items: true, medicines: false, customers: true, suppliers: true, employees: false, reports: true, gst: true, accounts: true, barcode: true, qr: false, settings: false, backup: true, audit: true, dashboard: true },
  Waiter:     { hotels: false, billing: true, sales: true, cancelBill: false, purchase: false, inventory: false, items: false, medicines: false, customers: true, suppliers: false, employees: false, reports: false, gst: false, accounts: false, barcode: false, qr: false, settings: false, backup: false, audit: false, dashboard: true },
  Cashier:    { hotels: false, billing: true, sales: true, cancelBill: false, purchase: false, inventory: false, items: false, medicines: false, customers: true, suppliers: false, employees: false, reports: false, gst: false, accounts: false, barcode: false, qr: false, settings: false, backup: false, audit: false, dashboard: true },
  Pharmacist: { hotels: false, billing: true, sales: true, cancelBill: false, purchase: true, inventory: true, items: true, medicines: false, customers: true, suppliers: false, employees: false, reports: false, gst: false, accounts: false, barcode: true, qr: false, settings: false, backup: false, audit: false, dashboard: true },
};

export const DEMO_CREDENTIALS = { phone: SUPER_ADMIN.loginId, password: SUPER_ADMIN.password };
export const HOTEL_DEMO = { loginId: "vaishali", password: "hotel@2026" };
