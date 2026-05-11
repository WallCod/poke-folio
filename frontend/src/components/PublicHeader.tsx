import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { AvatarMenu } from "./AppLayout";
import { Button } from "@/components/ui/button";
import { Sparkles, Crown, BookOpen, Info } from "lucide-react";
import { getSession, clearSession } from "@/lib/auth";
import { useAuthModal } from "@/store/useAuthModal";
import { useState } from "react";
import { cn } from "@/lib/utils";

const TYPE_LINE = "linear-gradient(90deg, #FF6A00, #1B87E6, #3DAD4C, #DAA800, #E8579A, #C03028, #4A4878, #8BA6BB, #5060C0, #DA6FC8, #A0A0B8)";

const NAV_LINKS = [
  { to: "/guia-tcg", label: "Guia TCG", icon: BookOpen },
  { to: "/sobre",    label: "Sobre",    icon: Info },
  { to: "/sets",     label: "Sets",     icon: Sparkles },
  { to: "/pricing",  label: "Planos",   icon: Crown },
];

export const PublicHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(getSession);
  const { open: openAuth } = useAuthModal();

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/80 border-b border-border/60 relative">
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: TYPE_LINE }}
      />
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo />

        {/* Nav central — absolutamente centrada */}
        <nav className="hidden sm:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Ações direita */}
        <div className="flex items-center gap-2 shrink-0">
          {session ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:block">
                Olá, <strong className="text-foreground">{session.name}</strong>
              </span>
              <AvatarMenu
                displayName={session.name}
                isAdmin={session.role === "admin"}
                size="lg"
                onNavigate={navigate}
                onLogout={handleLogout}
              />
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => openAuth("login")}
                className="text-foreground hover:bg-surface-elevated rounded-full text-sm"
              >
                Entrar
              </Button>
              <Button
                onClick={() => openAuth("signup")}
                className="bg-gradient-gold text-background font-semibold hover:opacity-90 hover:shadow-glow-gold transition-all rounded-full text-sm"
              >
                Criar conta
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
