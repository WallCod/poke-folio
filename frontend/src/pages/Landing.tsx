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
import { Sparkles, Shield, TrendingUp, ArrowRight, Check, Zap, Crown, Loader2 } from "lucide-react";
import heroImage from "@/assets/hero-cards.jpg";
import { mockLogin, setSessionFromApi } from "@/lib/auth";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// Pokébola SVG decorativa — sem assets externos, sem licença necessária
const PokeballDecor = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
    <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M 4,100 A 96,96 0 0 1 196,100 Z" fill="currentColor" fillOpacity="0.06" />
    <rect x="4" y="97" width="192" height="6" fill="currentColor" fillOpacity="0.12" />
    <circle cx="100" cy="100" r="22" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="100" cy="100" r="10" fill="currentColor" fillOpacity="0.15" />
  </svg>
);

// Ícone de carta estilizado
const CardDecor = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 60 84" className={className} aria-hidden="true">
    <rect x="1" y="1" width="58" height="82" rx="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <rect x="5" y="5" width="50" height="74" rx="3" fill="currentColor" fillOpacity="0.05" />
    <rect x="8" y="8" width="44" height="30" rx="2" fill="currentColor" fillOpacity="0.08" />
    <circle cx="30" cy="55" r="10" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
    <line x1="8" y1="70" x2="52" y2="70" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
    <line x1="8" y1="75" x2="38" y2="75" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
  </svg>
);

const PLANS = [
  {
    id: "free",
    name: "Iniciante",
    price: "Grátis",
    icon: Sparkles,
    features: ["Até 100 cartas", "Catálogo básico", "Preços semanais"],
    cta: "Começar grátis",
    highlight: false,
  },
  {
    id: "trainer",
    name: "Treinador",
    price: "R$ 14,90/mês",
    icon: Zap,
    features: ["Coleção ilimitada", "Preços em tempo real", "Exportar CSV"],
    cta: "Virar Treinador",
    highlight: true,
  },
  {
    id: "master",
    name: "Mestre Pokémon",
    price: "R$ 34,90/mês",
    icon: Crown,
    features: ["Tudo do Treinador", "Alertas de valorização", "Suporte 24/7"],
    cta: "Tornar-se Mestre",
    highlight: false,
  },
];

const Landing = () => {
  const [open, setOpen] = useState<"login" | "signup" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha email e senha");
      return;
    }

    setLoading(true);
    try {
      if (open === "signup") {
        if (!name.trim()) { toast.error("Informe seu nome"); setLoading(false); return; }
        const { data } = await authApi.register({ name, email, password });
        const session = setSessionFromApi(data);
        toast.success(`Bem-vindo, ${session.name}! Confira seu email. 🎴`);
        navigate("/dashboard");
      } else {
        const { data } = await authApi.login({ email, password });
        const session = setSessionFromApi(data);
        toast.success(`Bem-vindo de volta, ${session.name}!`);
        navigate(session.role === "admin" ? "/admin/dashboard" : "/dashboard");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Erro ao conectar com o servidor";
      // Fallback para mock em dev se o backend não estiver rodando
      if (msg === "Erro ao conectar com o servidor" && import.meta.env.DEV) {
        const session = mockLogin(email);
        toast.success(`[dev] ${session.name} — backend offline, usando mock`);
        navigate(session.role === "admin" ? "/admin/dashboard" : "/dashboard");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImage}
          alt=""
          className="h-full w-full object-cover opacity-40"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(48_100%_50%/0.12),transparent_55%)]" />
      </div>

      {/* Pokébolas decorativas de fundo */}
      <PokeballDecor className="absolute -right-32 -top-32 w-[500px] text-primary opacity-[0.04] pointer-events-none" />
      <PokeballDecor className="absolute -left-20 bottom-40 w-[300px] text-primary opacity-[0.03] pointer-events-none" />

      {/* Cartas decorativas flutuando */}
      <CardDecor className="absolute right-[8%] top-[22%] w-16 text-primary opacity-[0.12] rotate-12 pointer-events-none hidden lg:block" />
      <CardDecor className="absolute right-[14%] top-[30%] w-10 text-primary opacity-[0.08] -rotate-6 pointer-events-none hidden lg:block" />
      <CardDecor className="absolute left-[6%] top-[35%] w-12 text-primary opacity-[0.07] rotate-[-15deg] pointer-events-none hidden lg:block" />

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
      <section className="container flex-1 flex items-start pt-10 md:pt-14 pb-8">
        <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full surface-elevated border border-border/70 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Para colecionadores apaixonados pelo Pokémon TCG
          </div>

          {/* Título */}
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            Sua coleção.{" "}
            <span className="text-gradient-gold">Seu tesouro.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Gerencie, avalie e exiba suas cartas do Pokémon TCG com a precisão
            que sua coleção merece.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
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

          {/* Social proof */}
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">847 treinadores</span> já catalogaram{" "}
            <span className="text-foreground font-semibold">124.000+ cartas</span>
          </p>

          {/* Feature pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 max-w-3xl mx-auto">
            {[
              { icon: Sparkles, title: "Catálogo completo", desc: "Todos os sets do TCG" },
              { icon: TrendingUp, title: "Preços em tempo real", desc: "Acompanhe valorização" },
              { icon: Shield, title: "100% seguro", desc: "Sua coleção protegida" },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="glass-panel h-32 p-5 flex flex-col items-center justify-center text-center gap-2"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="font-display font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="container pb-16">
        <div className="relative max-w-4xl mx-auto">
          {/* Glow atrás */}
          <div className="absolute inset-x-0 -top-6 h-32 bg-[radial-gradient(ellipse_at_center,hsl(48_100%_50%/0.08),transparent_70%)] pointer-events-none" />

          <div className="relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl overflow-hidden shadow-[0_0_80px_-20px_hsl(48_100%_50%/0.15)]">
            {/* Barra de título fake */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-background/40">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
              <span className="ml-3 text-xs text-muted-foreground font-mono">pokefolio.app/dashboard</span>
            </div>

            {/* Conteúdo do mockup */}
            <div className="p-5 space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Total de cartas", value: "847" },
                  { label: "Valor estimado", value: "R$ 4.280" },
                  { label: "Raras / Ultra", value: "63" },
                  { label: "Sets completos", value: "2" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-background/60 border border-border/50 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
                    <p className="font-display font-bold text-lg mt-1">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Gráfico fake */}
              <div className="rounded-xl bg-background/60 border border-border/50 p-4">
                <p className="text-xs font-semibold mb-3">Valor da coleção · últimos 6 meses</p>
                <div className="flex items-end gap-2 h-20">
                  {[35, 48, 42, 60, 75, 90].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm bg-primary/20 border-t border-primary/40 transition-all" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"].map((m) => (
                    <span key={m} className="text-[10px] text-muted-foreground">{m}</span>
                  ))}
                </div>
              </div>

              {/* Cards row fake */}
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[2.5/3.5] rounded-lg bg-gradient-to-br from-background/80 to-card border border-border/50 flex items-center justify-center"
                  >
                    <CardDecor className="w-8 text-primary opacity-20" />
                  </div>
                ))}
              </div>
            </div>

            {/* Blur na borda inferior */}
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Planos resumidos */}
      <section className="container pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-bold">Escolha seu plano</h2>
            <p className="text-muted-foreground text-sm mt-2">Comece grátis, evolua quando quiser</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-2xl border p-6 flex flex-col gap-4",
                    plan.highlight
                      ? "bg-card/80 border-[hsl(28_85%_44%)]/50 shadow-[0_0_30px_-10px_hsl(28_85%_44%/0.4)]"
                      : "bg-card/40 border-border/60"
                  )}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-gold text-background text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                        ★ Mais popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center border",
                      plan.highlight
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "bg-surface-elevated border-border/60 text-muted-foreground"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-sm">{plan.name}</p>
                      <p className={cn("text-xs font-semibold", plan.highlight ? "text-primary" : "text-muted-foreground")}>
                        {plan.price}
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-1.5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    size="sm"
                    onClick={() => setOpen("signup")}
                    className={cn(
                      "w-full text-xs font-semibold",
                      plan.highlight
                        ? "bg-gradient-gold text-background hover:opacity-90"
                        : "bg-surface-elevated border border-border/60 text-foreground hover:bg-card"
                    )}
                  >
                    {plan.cta}
                  </Button>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-5">
            7 dias grátis em qualquer plano pago · cancele quando quiser ·{" "}
            <Link to="/pricing" className="text-primary hover:underline">
              ver detalhes completos
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="container py-6 border-t border-border/50 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} Pokéfolio. Feito por colecionadores.</p>
        <p>Não afiliado a The Pokémon Company.</p>
      </footer>

      {/* Auth modal */}
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

          <form className="space-y-4 pt-2" onSubmit={handleAuth}>
            {open === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Como devemos te chamar?"
                  className="surface-elevated border-border/70"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="treinador@email.com"
                className="surface-elevated border-border/70"
                autoFocus={open === "login"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="surface-elevated border-border/70"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-gold text-background font-semibold hover:opacity-90 hover:shadow-glow-gold disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Aguarde...</>
              ) : (
                open === "signup" ? "Criar conta" : "Entrar"
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground pt-1">
              {open === "signup" ? "Já tem conta?" : "Novo por aqui?"}{" "}
              <button
                type="button"
                onClick={() => { setOpen(open === "signup" ? "login" : "signup"); setPassword(""); }}
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
