import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { LayoutDashboard, Library, BookOpen, Tag, User, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/store/useCollection";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/collection", label: "Coleção", icon: Library },
  { to: "/catalog", label: "Catálogo", icon: BookOpen },
  { to: "/prices", label: "Preços", icon: Tag },
  { to: "/pricing", label: "Planos", icon: Crown },
  { to: "/profile", label: "Perfil", icon: User },
];

export const AppLayout = () => {
  const user = useUser();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navbar — desktop */}
      <header className="hidden md:block sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="container flex h-16 items-center justify-between gap-6">
          <button onClick={() => navigate("/dashboard")} className="shrink-0">
            <Logo />
          </button>

          <nav className="flex items-center gap-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "relative px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors",
                    isActive
                      ? "text-foreground nav-active"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right leading-tight hidden lg:block">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="h-10 w-10 rounded-full bg-gradient-gold text-background font-display font-bold flex items-center justify-center shadow-glow-gold hover:scale-105 transition-transform"
            >
              {user.name.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/60">
        <div className="container flex h-14 items-center justify-between">
          <button onClick={() => navigate("/dashboard")}>
            <Logo />
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="h-9 w-9 rounded-full bg-gradient-gold text-background font-display font-bold text-sm flex items-center justify-center"
          >
            {user.name.charAt(0).toUpperCase()}
          </button>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-12">
        <Outlet />
      </main>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl bg-background/85 border-t border-border/60">
        <div className="grid grid-cols-5">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium relative",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                  {isActive && (
                    <span className="absolute -top-px left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-gradient-gold shadow-[0_0_8px_hsl(var(--primary))]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};
