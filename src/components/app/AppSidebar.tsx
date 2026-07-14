import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Receipt, ShoppingCart, PackageSearch, Pill, Users, Truck,
  UserCog, BarChart3, Percent, Wallet, ScanBarcode, QrCode, Settings, DatabaseBackup, LogOut,
  Stethoscope,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/", label: "Billing", icon: Receipt, highlight: true },
  { to: "/sales", label: "Sales", icon: ShoppingCart },
  { to: "/purchase", label: "Purchase", icon: Truck },
  { to: "/inventory", label: "Inventory", icon: PackageSearch },
  { to: "/medicines", label: "Medicines", icon: Pill },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/employees", label: "Employees", icon: UserCog },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/gst", label: "GST", icon: Percent },
  { to: "/accounts", label: "Accounts", icon: Wallet },
  { to: "/barcode", label: "Barcode", icon: ScanBarcode },
  { to: "/qr", label: "QR Code", icon: QrCode },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/backup", label: "Backup", icon: DatabaseBackup },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
        <div className="grid place-items-center h-9 w-9 rounded-lg bg-primary text-primary-foreground">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">RSP Billing</div>
          <div className="text-[11px] text-muted-foreground">ANAM Medical Store</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {NAV.map((item) => {
          const active = path === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
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
                <span className="ml-auto rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  F2
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => {
          logout();
          navigate({ to: "/login" });
        }}
        className="flex items-center gap-3 border-t border-sidebar-border px-5 py-3 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
      >
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </aside>
  );
}
