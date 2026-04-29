import { useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles, Shield, TrendingUp, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-cards.jpg";

const Landing = () => {
  const [open, setOpen] = useState<"login" | "signup" | null>(null);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background hero image with parallax/blur layers */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImage}
          alt=""
          className="h-full w-full object-cover opacity-50"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(48_100%_50%/0.15),transparent_50%)]" />
      </div>

      {/* Header */}
      <header className="container py-6 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setOpen("login")}
            className="text-foreground hover:bg-surface-elevated"
          >
            Entrar
          </Button>
          <Button
            onClick={() => setOpen("signup")}
            className="bg-gradient-gold text-background font-semibold hover:opacity-90 hover:shadow-glow-gold transition-all"
          >
            Criar conta
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container flex-1 flex items-center py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full surface-elevated border border-border/70 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Para colecionadores apaixonados pelo Pokémon TCG
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            Sua coleção.{" "}
            <span className="text-gradient-gold">Seu tesouro.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Gerencie, avalie e exiba suas cartas do Pokémon TCG com a precisão
            que sua coleção merece.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              onClick={() => setOpen("signup")}
              className="bg-gradient-gold text-background font-semibold text-base px-7 hover:opacity-90 hover:shadow-glow-gold transition-all animate-pulse-gold"
            >
              Criar minha coleção
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setOpen("login")}
              className="border-border/70 bg-card/50 backdrop-blur hover:bg-surface-elevated text-base px-7"
            >
              Já tenho conta
            </Button>
          </div>

          <div className="pt-2">
            <Link
              to="/pricing"
              className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              Ver planos e preços <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Feature pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-16 max-w-3xl mx-auto">
            {[
              {
                icon: Sparkles,
                title: "Catálogo completo",
                desc: "Todos os sets do TCG",
              },
              {
                icon: TrendingUp,
                title: "Preços em tempo real",
                desc: "Acompanhe valorização",
              },
              {
                icon: Shield,
                title: "100% seguro",
                desc: "Sua coleção protegida",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="glass-panel h-36 p-6 flex flex-col items-center justify-center text-center gap-2"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="font-display font-semibold text-sm whitespace-nowrap">{title}</p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container py-6 border-t border-border/50 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} Pokéfolio. Feito por colecionadores.</p>
        <p>Não afiliado a The Pokémon Company.</p>
      </footer>

      {/* Auth modals (UI only) */}
      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="bg-card border-border/70 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {open === "signup" ? "Criar sua conta" : "Bem-vindo de volta"}
            </DialogTitle>
            <DialogDescription>
              {open === "signup"
                ? "Comece a gerenciar sua coleção em segundos."
                : "Acesse sua coleção pessoal."}
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = "/dashboard";
            }}
          >
            {open === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Como devemos te chamar?"
                  className="surface-elevated border-border/70"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="treinador@email.com"
                className="surface-elevated border-border/70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="surface-elevated border-border/70"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-gold text-background font-semibold hover:opacity-90 hover:shadow-glow-gold"
            >
              {open === "signup" ? "Criar conta" : "Entrar"}
            </Button>
            <p className="text-center text-xs text-muted-foreground pt-1">
              {open === "signup" ? "Já tem conta?" : "Novo por aqui?"}{" "}
              <button
                type="button"
                onClick={() => setOpen(open === "signup" ? "login" : "signup")}
                className="text-primary hover:underline font-medium"
              >
                {open === "signup" ? "Entrar" : "Criar conta"}
              </button>
            </p>
            <Link
              to="/dashboard"
              className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Continuar como visitante →
            </Link>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;
