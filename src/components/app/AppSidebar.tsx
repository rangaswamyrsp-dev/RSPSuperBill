import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Receipt, ShoppingCart, PackageSearch, UtensilsCrossed, Users, Truck,
  UserCog, BarChart3, Percent, Wallet, ScanBarcode, Settings, DatabaseBackup, LogOut,
  ChefHat, HelpCircle, ShieldCheck, Building2, CalendarCheck, PiggyBank,
} from "lucide-react";
import { logout, getUser, CAN, type Role } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useAccount } from "@/lib/account";
import type { FeatureKey } from "@/lib/business";
import { useEffect, useState } from "react";

type Item = {
  to: string;
  label: string;
  icon: any;
  highlight?: boolean;
  cap: keyof typeof CAN["Admin"];
  feat?: FeatureKey;
};

const ALL_NAV: Item[] = [
  { to: "/superadmin", label: "Business Accounts", icon: Building2, cap: "hotels" },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, cap: "dashboard", feat: "dashboard" },
  { to: "/", label: "Billing", icon: Receipt, highlight: true, cap: "billing", feat: "billing" },
  { to: "/items", label: "Menu Items", icon: UtensilsCrossed, cap: "items", feat: "items" },
  { to: "/sales", label: "Sales", icon: ShoppingCart, cap: "sales", feat: "sales" },
  { to: "/purchase", label: "Purchase", icon: Truck, cap: "purchase", feat: "purchase" },
  { to: "/inventory", label: "Inventory", icon: PackageSearch, cap: "inventory", feat: "inventory" },
  { to: "/customers", label: "Customers", icon: Users, cap: "customers", feat: "customers" },
  { to: "/suppliers", label: "Suppliers", icon: Truck, cap: "suppliers", feat: "suppliers" },
  { to: "/employees", label: "Employees", icon: UserCog, cap: "employees", feat: "employees" },
  { to: "/attendance", label: "Attendance & Salary", icon: CalendarCheck, cap: "employees", feat: "attendance" },
  { to: "/finance", label: "Income & Expense", icon: PiggyBank, cap: "accounts", feat: "finance" },
  { to: "/reports", label: "Reports", icon: BarChart3, cap: "reports", feat: "reports" },
  { to: "/gst", label: "GST", icon: Percent, cap: "gst", feat: "gst" },
  { to: "/accounts", label: "Accounts", icon: Wallet, cap: "accounts", feat: "accounts" },
  { to: "/audit", label: "Audit Log", icon: ShieldCheck, cap: "audit", feat: "audit" },
  { to: "/barcode", label: "Barcode", icon: ScanBarcode, cap: "barcode", feat: "barcode" },
  { to: "/help", label: "Help & Guide", icon: HelpCircle, cap: "dashboard", feat: "help" },
  { to: "/settings", label: "Settings", icon: Settings, cap: "settings", feat: "settings" },
  { to: "/backup", label: "Backup", icon: DatabaseBackup, cap: "backup", feat: "backup" },
];

// Kept exported for anything still referencing NAV.
export const NAV = ALL_NAV;


function useRole(): Role {
  const [role, setRole] = useState<Role>("Cashier");
  useEffect(() => { const u = getUser(); if (u) setRole(u.role); }, []);
  return role;
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const role = useRole();
  const { has, labels } = useAccount();
  const items = ALL_NAV
    .filter((i) => CAN[role][i.cap] && (!i.feat || has(i.feat)))
    .map((i) => (i.to === "/items" ? { ...i, label: labels.items } : i));
  return (
    <nav className="flex-1 overflow-y-auto p-2">
      {items.map((item) => {
        const active = path === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.to} to={item.to} onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-[color:var(--info)] text-[color:var(--info-foreground)]"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.highlight && !active && (
              <span className="ml-auto rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">F2</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  const navigate = useNavigate();
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar print:hidden">
      <SidebarBrand />
      <SidebarNav />
      <button
        onClick={() => { logout(); navigate({ to: "/login" }); }}
        className="flex items-center gap-3 border-t border-sidebar-border px-5 py-3 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
      >
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </aside>
  );
}

export function SidebarBrand() {
  const [store, setStore] = useState("RSP Billing");
  useEffect(() => { const u = getUser(); if (u) setStore(u.store); }, []);
  return (
    <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
      <div className="grid place-items-center h-9 w-9 rounded-lg bg-primary text-primary-foreground">
        <ChefHat className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold">RSP Billing</div>
        <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">{store}</div>
      </div>
    </div>
  );

}
