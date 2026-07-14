import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, MoreVertical, LogOut, UserCog, Bell, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUser, logout } from "@/lib/auth";
import { toast } from "sonner";

export function AppHeader() {
  const [user, setUser] = useState(() => getUser());
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const navigate = useNavigate();

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="h-16 shrink-0 border-b bg-card flex items-center gap-3 px-4 lg:px-6">
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Global search — medicines, invoices, customers…  (Ctrl+K)"
          className="pl-9 h-10 bg-background"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[color:var(--warning)]" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-muted transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[color:var(--info)] text-[color:var(--info-foreground)] text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left leading-tight">
                <div className="text-sm font-medium">{user?.name}</div>
                <div className="text-[11px] text-muted-foreground">{user?.role}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <UserCog className="h-4 w-4 mr-2" /> Edit profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
              <Settings2 className="h-4 w-4 mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.success("Backup started")}>
              Backup database
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast("Printing test page…")}>
              Printer test page
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast("Cache cleared")}>
              Clear cache
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
              Preferences
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Update your display name for this device.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input value={user?.role ?? ""} disabled />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (user) {
                  const next = { ...user, name };
                  const key = "rsp_auth_user";
                  const store = localStorage.getItem(key) ? localStorage : sessionStorage;
                  store.setItem(key, JSON.stringify(next));
                  setUser(next);
                  setEditOpen(false);
                  toast.success("Profile updated");
                }
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
