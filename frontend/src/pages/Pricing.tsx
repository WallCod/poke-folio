import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "annual";

interface Plan {
  id: string;
  name: string;
  tagline: string;
  icon: typeof Sparkles;
  monthly: number;
  features: string[];
  cta: string;
  highlight?: boolean;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Iniciante",
    tagline: "Comece sua jornada",
    icon: Sparkles,
    monthly: 0,
    features: [
      "Até 100 cartas na coleção",
      "Catálogo básico do TCG",
      "Preços atualizados semanalmente",
      "1 deck salvo",
    ],
    cta: "Começar grátis",
  },
  {
    id: "trainer",
    name: "Treinador",
    tagline: "Para colecionadores ativos",
    icon: Zap,
    monthly: 14.9,
    features: [
      "Coleção ilimitada",
      "Preços em tempo real",
      "Histórico de valorização",
      "Decks ilimitados",
      "Exportação em CSV/PDF",
    ],
    cta: "Virar Treinador",
  },
  {
    id: "master",
    name: "Mestre Pokémon",
    tagline: "A jornada completa",
    icon: Crown,
    monthly: 34.9,
    features: [
      "Tudo do plano Treinador",
      "Avaliação profissional de raridades",
      "Alertas de valorização",
      "Catálogo de cartas graduadas (PSA/BGS)",
      "Backup em nuvem ilimitado",
      "Suporte prioritário 24/7",
    ],
    cta: "Tornar-se Mestre",
    highlight: true,
  },
];

const formatPrice = (monthly: number, billing: Billing) => {
  if (monthly === 0) return "Grátis";
  const value = billing === "annual" ? monthly * 0.8 : monthly;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const Pricing = () => {
  const [billing, setBilling] = useState<Billing>("monthly");
  const navigate = useNavigate();

  return (
    <div className="container pt-12 pb-16 animate-fade-in">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full surface-elevated border border-border/70 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Escolha sua jornada
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          Planos para todo <span className="text-gradient-gold">treinador</span>
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          De iniciante a mestre — encontre o plano ideal para gerenciar sua
          coleção com a precisão que ela merece.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center mt-8">
        <div className="inline-flex items-center gap-1 p-1 rounded-full surface-elevated border border-border/70">
          <button
            onClick={() => setBilling("monthly")}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium transition-all",
              billing === "monthly"
                ? "bg-gradient-gold text-background shadow-glow-gold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
              billing === "annual"
                ? "bg-gradient-gold text-background shadow-glow-gold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Anual
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                billing === "annual"
                  ? "bg-background/20 text-background"
                  : "bg-primary/15 text-primary"
              )}
            >
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-6xl mx-auto items-stretch">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const price = formatPrice(plan.monthly, billing);
          return (
            <div
              key={plan.id}
              className={cn(
                "relative glass-panel p-7 flex flex-col",
                plan.highlight &&
                  "border-gold-glow md:scale-[1.03] md:-translate-y-1"
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-gold text-background text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-glow-gold">
                    ★ Mais popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-11 w-11 rounded-xl flex items-center justify-center border",
                    plan.highlight
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-surface-elevated border-border/70 text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold leading-tight">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {plan.tagline}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-baseline gap-1">
                <span
                  className={cn(
                    "font-display font-bold tracking-tight",
                    plan.monthly === 0 ? "text-3xl" : "text-4xl",
                    plan.highlight && "text-gradient-gold"
                  )}
                >
                  {price}
                </span>
                {plan.monthly !== 0 && (
                  <span className="text-sm text-muted-foreground">/mês</span>
                )}
              </div>
              {plan.monthly !== 0 && billing === "annual" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Cobrado anualmente · economize 20%
                </p>
              )}
              {plan.monthly !== 0 && billing === "monthly" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Cobrado mensalmente
                </p>
              )}
              {plan.monthly === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Para sempre
                </p>
              )}

              <ul className="space-y-3 mt-7 flex-1">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-foreground/90"
                  >
                    <span className="mt-0.5 h-5 w-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => navigate("/dashboard")}
                size="lg"
                className={cn(
                  "mt-8 w-full font-semibold",
                  plan.highlight
                    ? "bg-gradient-gold text-background hover:opacity-90 hover:shadow-glow-gold"
                    : "bg-surface-elevated border border-border/70 text-foreground hover:bg-surface-elevated/80"
                )}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-muted-foreground mt-10">
        Todos os planos incluem 7 dias de teste grátis. Cancele quando quiser.{" "}
        <Link to="/dashboard" className="text-primary hover:underline">
          Voltar ao dashboard
        </Link>
      </p>
    </div>
  );
};

export default Pricing;
