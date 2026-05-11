import { useState } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Shield, Receipt, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { clearSession } from "@/lib/auth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const items = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Usuários", icon: Users },
  { to: "/admin/plans", label: "Planos", icon: CreditCard },
  { to: "/admin/payments", label: "Pagamentos", icon: Receipt },
  { to: "/admin/settings", label: "Configurações", icon: Settings },
];

export const AdminLayout = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    clearSession();
    localStorage.removeItem("adminToken");
    navigate("/");
  };

  const W = collapsed ? "w-[60px]" : "w-[260px]";
  const ML = collapsed ? "ml-[60px]" : "ml-[260px]";

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside
        className={cn(
          "shrink-0 border-r border-border/60 bg-[hsl(240_17%_8%)] flex flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300",
          W
        )}
      >
        {/* Header do sidebar */}
        <div className="px-3 py-5 border-b border-border/60 flex items-center justify-between min-h-[68px]">
          {!collapsed && (
            <Link to="/admin/dashboard" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-[hsl(28_85%_44%)]/15 border border-[hsl(28_85%_44%)]/40 flex items-center justify-center text-[hsl(28_85%_60%)]">
                <Shield className="h-4 w-4" />
              </div>
              <div className="leading-tight overflow-hidden">
                <p className="font-display font-bold text-sm whitespace-nowrap">Pokéfolio</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(28_85%_60%)] whitespace-nowrap">Admin</p>
              </div>
            </Link>
          )}

          {collapsed && (
            <Link to="/admin/dashboard" className="mx-auto">
              <div className="h-8 w-8 rounded-lg bg-[hsl(28_85%_44%)]/15 border border-[hsl(28_85%_44%)]/40 flex items-center justify-center text-[hsl(28_85%_60%)]">
                <Shield className="h-4 w-4" />
              </div>
            </Link>
          )}

          {/* Botão retrair */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="h-7 w-7 rounded-md border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors shrink-0"
              title="Retrair sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className={cn("flex-1 py-4", collapsed ? "flex flex-col items-center gap-1 w-full" : "px-2 space-y-1")}>
          {items.map((it) =>
            collapsed ? (
              <div key={it.to} className="flex justify-center w-full">
                <NavLink
                  to={it.to}
                  title={it.label}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center justify-center rounded-lg transition-all h-9 w-9",
                      isActive
                        ? "bg-[hsl(28_85%_44%)]/15 text-[hsl(28_85%_60%)] border border-[hsl(28_85%_44%)]/40"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                    )
                  }
                >
                  <it.icon className="h-[18px] w-[18px]" />
                </NavLink>
              </div>
            ) : (
              <NavLink
                key={it.to}
                to={it.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-[hsl(28_85%_44%)]/15 text-[hsl(28_85%_60%)] border border-[hsl(28_85%_44%)]/40 shadow-[inset_0_0_0_1px_hsl(28_85%_44%/0.2)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                  )
                }
              >
                <it.icon className="h-4 w-4 shrink-0" />
                <span>{it.label}</span>
              </NavLink>
            )
          )}
        </nav>

        {/* Footer */}
        <div className={cn("p-2 border-t border-border/60 space-y-1", collapsed && "flex flex-col w-full")}>
          {/* Expandir quando colapsado */}
          {collapsed ? (
            <>
              <div className="flex justify-center w-full">
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setCollapsed(false)}
                      className="h-9 w-9 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
                    >
                      <ChevronRight className="h-[18px] w-[18px]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Expandir</TooltipContent>
                </Tooltip>
              </div>

              <div className="flex justify-center w-full">
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate("/")}
                      className="h-9 w-9 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-[18px] w-[18px]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Voltar à home</TooltipContent>
                </Tooltip>
              </div>

              <div className="flex justify-center w-full">
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleLogout}
                      className="h-9 w-9 rounded-lg flex items-center justify-center text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-[18px] w-[18px]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sair</TooltipContent>
                </Tooltip>
              </div>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground border-border/60 hover:border-border"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar à home
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start gap-3 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </>
          )}
        </div>
      </aside>

      <main className={cn("flex-1 min-h-screen transition-all duration-300", ML)}>
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
