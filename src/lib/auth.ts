// SaaS auth for RSP SuperBill.
// 1) Super Admin (us) — creates business accounts and hands out User ID + Password.
// 2) Business Admin — the shop/hotel owner, logs in with the User ID created.
// 3) Business staff (Manager / Cashier / Waiter / Pharmacist) — created in Employees.
// All data is stored per tenant (hotelId/tenantId) so one business never sees another's data.

import { supabase } from "@/lib/supabase";

export type Role = "SuperAdmin" | "Admin" | "Manager" | "Cashier" | "Waiter" | "Pharmacist";

export type AuthUser = {
  id: string; // "SUPER", tenant id, or employee id
  phone: string; // login id
  name: string;
  role: Role;
  store: string; // hotel / business name
  hotelId: string; // "" for super admin, tenantId for businesses
  isMainAdmin?: boolean;
};

export type LoginResult = {
  user: AuthUser | null;
  error?: string;
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
  businessType?: string;
  features?: any;
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

export async function login(loginId: string, password: string, remember: boolean): Promise<LoginResult> {
  const u = loginId.trim();
  const lower = u.toLowerCase();

  const save = (user: AuthUser): LoginResult => {
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(user));
    return { user };
  };

  // 1. Super Admin authentication
  if (lower === SUPER_ADMIN.loginId && password === SUPER_ADMIN.password) {
    return save({
      id: SUPER_ADMIN.id,
      phone: SUPER_ADMIN.loginId,
      name: SUPER_ADMIN.name,
      role: "SuperAdmin",
      store: "RSP Software",
      hotelId: "",
      isMainAdmin: true,
    });
  }

  // 2. Authenticate against Supabase Database
  try {
    // Try server-side secure auth RPC first
    const { data: rpcRes, error: rpcErr } = await supabase.rpc("superbill_auth_login", {
      p_login: u,
      p_password: password,
    });

    if (!rpcErr && rpcRes) {
      if (rpcRes.success && rpcRes.user) {
        // Enforce medical billing separation on RPC response (defense-in-depth)
        const u = rpcRes.user;
        const rawFeatures = u.features || {};
        const isExplicitSuperBill =
          rawFeatures.superbill === true ||
          (Array.isArray(rawFeatures.apps) && rawFeatures.apps.includes("superbill"));
        const isNonMedicalBusiness =
          u.businessType &&
          u.businessType.toLowerCase() !== "medical" &&
          u.businessType.toLowerCase() !== "medical store";

        if (!isExplicitSuperBill && !isNonMedicalBusiness) {
          return {
            user: null,
            error:
              "Unauthorized: This account is registered for RSP Medical Billing only and is not provisioned for RSP SuperBill. Please contact RSP Super Admin.",
          };
        }

        return save({
          id: rpcRes.user.id,
          phone: rpcRes.user.phone,
          name: rpcRes.user.name,
          role: "Admin",
          store: rpcRes.user.store,
          hotelId: rpcRes.user.hotelId,
          isMainAdmin: true,
        });
      } else if (!rpcRes.success) {
        return { user: null, error: rpcRes.message || "Login failed." };
      }
    }

    // Direct database query fallback (if RPC migration not yet executed)
    const { data: tenants, error: tErr } = await supabase
      .from("tenants")
      .select("*")
      .or(`admin_phone.eq.${u},id.eq.${u}`)
      .limit(1);

    if (!tErr && tenants && tenants.length > 0) {
      const tenant = tenants[0];

      // Password verification
      if (tenant.admin_password !== password) {
        return { user: null, error: "Invalid password for this account." };
      }

      // Check account activation
      if (tenant.active === false) {
        return { user: null, error: "This business account has been suspended. Please contact Super Admin." };
      }

      // CRITICAL AUTHORIZATION REQUIREMENT:
      // Separate RSP SuperBill from RSP Medical Billing:
      // A medical shop owner registered in RSP Medical Billing must NOT automatically
      // be able to log in to RSP SuperBill unless explicitly authorized and provisioned.
      const rawFeatures = tenant.features || {};
      const isExplicitSuperBill =
        rawFeatures.superbill === true ||
        (Array.isArray(rawFeatures.apps) && rawFeatures.apps.includes("superbill"));

      const isNonMedicalBusiness =
        tenant.type &&
        tenant.type.toLowerCase() !== "medical" &&
        tenant.type.toLowerCase() !== "medical store";

      const isAuthorizedForSuperBill = isExplicitSuperBill || isNonMedicalBusiness;

      if (!isAuthorizedForSuperBill) {
        return {
          user: null,
          error:
            "Unauthorized: This account is registered for RSP Medical Billing only and is not provisioned for RSP SuperBill. Please contact RSP Super Admin.",
        };
      }

      return save({
        id: tenant.id,
        phone: tenant.admin_phone || tenant.id,
        name: tenant.admin_name || tenant.name,
        role: "Admin",
        store: tenant.name,
        hotelId: tenant.id,
        isMainAdmin: true,
      });
    }
  } catch (err) {
    console.warn("Supabase auth check error, falling back:", err);
  }

  // 3. Fallback / local store check (for employees or demo accounts)
  const { hotels, employees } = readStore();

  const hotel = hotels.find(
    (h) => (h.loginId?.trim().toLowerCase() === lower || h.id?.toLowerCase() === lower) && h.password === password && (h.active ?? true),
  );
  if (hotel) {
    // Check medical isolation for local accounts too
    const isMed = hotel.businessType === "Medical Store" || (hotel as any).businessType === "Medical";
    const hasSuperBill = (hotel.features as any)?.superbill === true || !isMed;
    if (!hasSuperBill) {
      return {
        user: null,
        error: "Unauthorized: This account is registered for RSP Medical Billing only.",
      };
    }

    return save({
      id: hotel.id,
      phone: hotel.loginId,
      name: hotel.ownerName || hotel.name,
      role: "Admin",
      store: hotel.name,
      hotelId: hotel.id,
      isMainAdmin: true,
    });
  }

  const emp = employees.find(
    (e) => e.phone?.trim().toLowerCase() === lower && (e.password ?? "") === password && (e.active ?? true),
  );
  if (emp) {
    const hotelId = emp.hotelId ?? hotels[0]?.id ?? "H001";
    const h = hotels.find((x) => x.id === hotelId);
    return save({
      id: emp.id,
      phone: emp.phone,
      name: emp.name,
      role: normalizeRole(emp.role),
      store: h?.name ?? "My Business",
      hotelId,
    });
  }

  return { user: null, error: "Invalid phone (User ID) or password." };
}

function normalizeRole(r: string): Role {
  const x = (r || "").toLowerCase();
  if (x.includes("super")) return "Manager";
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
export const HOTEL_DEMO = { loginId: "8885848601", password: "RSP123" };
