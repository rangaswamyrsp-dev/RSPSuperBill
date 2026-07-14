const KEY = "rsp_auth_user";
const DEMO = { email: "manjju@anam.com", password: "anam@2026", name: "Manjju", role: "Admin", store: "ANAM Medical Store" };

export type AuthUser = { email: string; name: string; role: string; store: string };

export function login(email: string, password: string, remember: boolean): AuthUser | null {
  if (email.trim().toLowerCase() === DEMO.email && password === DEMO.password) {
    const user: AuthUser = { email: DEMO.email, name: DEMO.name, role: DEMO.role, store: DEMO.store };
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(user));
    return user;
  }
  return null;
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

export const DEMO_CREDENTIALS = { email: DEMO.email, password: DEMO.password };
