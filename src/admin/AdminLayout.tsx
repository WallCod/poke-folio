import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, CreditCard, Settings, LogOut } from "lucide-react";
import { AdminLogo } from "./AdminLogo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Usuários", icon: Users },
  { to: "/admin/plans", label: "Planos", icon: CreditCard },
  { to: "/admin/settings", label: "Configurações", icon: Settings },
];

export const AdminLayout = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-[260px] shrink-0 border-r border-border/60 bg-[hsl(240_17%_8%)] flex flex-col fixed inset-y-0 left-0 z-40">
        <div className="px-5 py-5 border-b border-border/60">
          <AdminLogo />
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-[hsl(28_85%_44%)]/15 text-[hsl(28_85%_60%)] border border-[hsl(28_85%_44%)]/40 shadow-[inset_0_0_0_1px_hsl(28_85%_44%/0.2)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                )
              }
            >
              <it.icon className="h-4 w-4" />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border/60">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 ml-[260px] min-h-screen">
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
