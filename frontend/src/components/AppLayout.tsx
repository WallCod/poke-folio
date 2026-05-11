import { NavLink, Outlet, useNavigate, Navigate, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { LayoutDashboard, Library, BookOpen, Tag, User, ShieldCheck, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSession, clearSession } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/collection", label: "Coleção", icon: Library },
  { to: "/catalog", label: "Catálogo", icon: BookOpen },
  { to: "/prices", label: "Preços", icon: Tag },
  { to: "/profile", label: "Perfil", icon: User },
];

// Exportado para reuso na Landing
export const AvatarMenu = ({
  displayName,
  isAdmin,
  size,
  onNavigate,
  onLogout,
}: {
  displayName: string;
  isAdmin: boolean;
  size: "sm" | "lg";
  onNavigate: (to: string) => void;
  onLogout: () => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        className={cn(
          "rounded-full bg-gradient-gold text-background font-display font-bold flex items-center justify-center shadow-glow-gold hover:scale-105 transition-transform relative focus:outline-none",
          size === "lg" ? "h-10 w-10" : "h-9 w-9 text-sm"
        )}
      >
        {displayName.charAt(0).toUpperCase()}
        {isAdmin && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-blue-500 border-2 border-background flex items-center justify-center">
            <ShieldCheck className="h-2.5 w-2.5 text-white" />
          </span>
        )}
      </button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" className="w-52 bg-card border-border/70">
      {/* Cabeçalho */}
      <div className="px-3 py-2.5 border-b border-border/50">
        <p className="text-sm font-semibold truncate">{displayName}</p>
        {isAdmin && (
          <p className="text-xs text-blue-400 font-medium flex items-center gap-1 mt-0.5">
            <ShieldCheck className="h-3 w-3" /> Administrador
          </p>
        )}
      </div>

      <DropdownMenuItem
        onClick={() => onNavigate("/dashboard")}
        className="gap-2 cursor-pointer mt-1"
      >
        <LayoutDashboard className="h-4 w-4" /> Dashboard
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={() => onNavigate("/profile")}
        className="gap-2 cursor-pointer"
      >
        <User className="h-4 w-4" /> Perfil
      </DropdownMenuItem>

      {isAdmin && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onNavigate("/admin/dashboard")}
            className="gap-2 cursor-pointer text-blue-400 focus:text-blue-400 focus:bg-blue-950/40"
          >
            <ShieldCheck className="h-4 w-4" /> Painel Admin
          </DropdownMenuItem>
        </>
      )}

      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={onLogout}
        className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" /> Sair
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export const AppLayout = () => {
  const session = getSession();
  const displayName = session?.name ?? "Treinador";
  const isAdmin = session?.role === "admin";
  const navigate = useNavigate();
  const location = useLocation();

  if (!session?.token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navbar — desktop */}
      <header className="hidden md:block sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="container flex h-16 items-center justify-between gap-6">
          <Logo />

          <nav className="flex items-center gap-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "relative px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors",
                    isActive
                      ? "text-primary nav-active"
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
              <p className="text-sm font-semibold">{displayName}</p>
            </div>
            <AvatarMenu
              displayName={displayName}
              isAdmin={isAdmin}
              size="lg"
              onNavigate={navigate}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/60">
        <div className="container flex h-14 items-center justify-between">
          <Logo />
          <AvatarMenu
            displayName={displayName}
            isAdmin={isAdmin}
            size="sm"
            onNavigate={navigate}
            onLogout={handleLogout}
          />
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
