import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePortfolios } from "@/store/usePortfolios";
import { useUser } from "@/store/useCollection";
import { formatCurrency } from "@/lib/format";
import { getSession, clearSession } from "@/lib/auth";
import { modal } from "@/store/useAppModal";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Library,
  Wallet,
  Gem,
  Layers,
  Shield,
  ArrowRight,
  LogOut,
  Moon,
  Sun,
  Star,
  Lock,
  Trophy,
  Flame,
  Map,
  Search,
  TrendingUp,
  Clock,
  Crown,
  Sparkles,
} from "lucide-react";

const rarityWeight: Record<string, number> = {
  "Secret Rare": 6,
  "Hyper Rare": 6,
  "Special Illustration Rare": 6,
  "Ultra Rare": 5,
  "Rare Rainbow": 5,
  "Illustration Rare": 4,
  "Rare Holo VMAX": 4,
  "Rare Holo VSTAR": 4,
  "Rare Holo": 3,
  "Rare Holo EX": 3,
  "Rare Holo GX": 3,
  "Rare Holo V": 3,
  "Amazing Rare": 3,
  "Rare Shiny GX": 3,
  "Rare": 2,
  "Rare Shiny": 2,
  "Shiny Rare": 2,
  "Uncommon": 1,
  "Common": 0,
  "Promo": 1,
};

function planLabel(plan?: string): string {
  if (plan === "master") return "Mestre";
  if (plan === "trainer") return "Treinador";
  return "Iniciante";
}

function planColor(plan?: string): string {
  if (plan === "master") return "border-[hsl(48_100%_50%)/60] bg-[hsl(48_100%_50%)/10] text-[hsl(48_100%_60%)]";
  if (plan === "trainer") return "border-purple-500/50 bg-purple-500/10 text-purple-300";
  return "border-border/60 bg-surface-elevated text-muted-foreground";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "há 1 dia";
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months === 1) return "há 1 mês";
  return `há ${months} meses`;
}

interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
}

const Profile = () => {
  const user = useUser();
  const { portfolios, items, currency, setCurrency, fetchPortfolios, fetchAllItems } = usePortfolios();
  const navigate = useNavigate();
  const session = getSession();
  const isAdmin = session?.role === "admin";

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  // Set stats
  const [setStats, setSetStats] = useState<{ setCode: string; setName: string; owned: number; totalInDb: number }[]>([]);
  const [sets, setSets] = useState<{ id: string; total: number }[]>([]);
  const [setStatsExpanded, setSetStatsExpanded] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (portfolios.length === 0) {
      fetchPortfolios().then(() => fetchAllItems());
    } else if (items.length === 0) {
      fetchAllItems();
    }
  }, []);

  useEffect(() => {
    import('@/lib/api').then(({ default: api }) => {
      api.get('/portfolios/set-stats').then(({ data }) => setSetStats(data)).catch(() => {});
    });
    const baseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace(/\/api$/, '');
    fetch(`${baseUrl}/api/public/sets`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setSets(d.map((s: any) => ({ id: s.id, total: s.total }))))
      .catch(() => {});
  }, []);

  // Estatísticas globais (baseado nos dados de todos os portfolios)
  const globalTotalCards = portfolios.reduce((s, p) => s + p.totalCards, 0);
  const globalTotalValue = portfolios.reduce((s, p) => s + p.totalValueBrl, 0);

  // Estatísticas do portfolio ativo (para análise de itens individuais)
  const totalCardsActive = items.reduce((s, i) => s + i.quantity, 0);
  const totalSets = new Set(items.map((i) => i.cardId.setCode)).size;
  const totalValue = items.reduce(
    (s, i) => s + (i.cardId.marketPriceBrl ?? 0) * i.quantity,
    0
  );
  const rareCount = items.filter(
    (i) => (rarityWeight[i.cardId.rarity] ?? 0) >= 3
  ).length;

  // Pokémon favorito (mais unidades no portfolio ativo)
  const favoritePokemon = (() => {
    const counts: Record<string, { qty: number; imageUrl: string }> = {};
    items.forEach((i) => {
      const name = i.cardId.name;
      if (!counts[name]) counts[name] = { qty: 0, imageUrl: i.cardId.imageUrl };
      counts[name].qty += i.quantity;
    });
    const top = Object.entries(counts).sort((a, b) => b[1].qty - a[1].qty)[0];
    return top ? { name: top[0], qty: top[1].qty, imageUrl: top[1].imageUrl } : null;
  })();

  // Conquistas
  const hasSecretRare = items.some((i) =>
    ["Secret Rare", "Hyper Rare"].includes(i.cardId.rarity)
  );
  const hasInvestment = items.some(
    (i) => i.purchasePrice != null && i.purchasePrice > 0
  );

  const achievements: Achievement[] = [
    {
      id: "first",
      label: "Primeira carta",
      description: "Adicione sua primeira carta à coleção",
      icon: <Star className="h-5 w-5" />,
      unlocked: globalTotalCards >= 1,
    },
    {
      id: "collector",
      label: "Colecionador",
      description: "Alcance 50 cartas no total",
      icon: <Library className="h-5 w-5" />,
      unlocked: globalTotalCards >= 50,
    },
    {
      id: "legendary",
      label: "Lendário",
      description: "Alcance 200 cartas no total",
      icon: <Crown className="h-5 w-5" />,
      unlocked: globalTotalCards >= 200,
    },
    {
      id: "explorer",
      label: "Explorador",
      description: "Colecione cartas de 5 sets diferentes",
      icon: <Map className="h-5 w-5" />,
      unlocked: totalSets >= 5,
    },
    {
      id: "detective",
      label: "Detetive",
      description: "Colecione cartas de 10 sets diferentes",
      icon: <Search className="h-5 w-5" />,
      unlocked: totalSets >= 10,
    },
    {
      id: "investor",
      label: "Investidor",
      description: "Registre o preço de compra de ao menos uma carta",
      icon: <TrendingUp className="h-5 w-5" />,
      unlocked: hasInvestment,
    },
    {
      id: "supremerare",
      label: "Raro Supremo",
      description: "Tenha ao menos uma Secret Rare ou Hyper Rare",
      icon: <Flame className="h-5 w-5" />,
      unlocked: hasSecretRare,
    },
  ];

  // Detecta conquistas recém-desbloqueadas e exibe modal de celebração
  const prevUnlockedIds = useRef<Set<string>>(new Set());
  const isFirstRender = useRef(true);
  useEffect(() => {
    const currentUnlocked = new Set(achievements.filter((a) => a.unlocked).map((a) => a.id));
    if (isFirstRender.current) {
      // Na primeira renderização apenas registra o estado atual sem notificar
      prevUnlockedIds.current = currentUnlocked;
      isFirstRender.current = false;
      return;
    }
    for (const a of achievements) {
      if (a.unlocked && !prevUnlockedIds.current.has(a.id)) {
        setUnlockedAchievement(a);
        break;
      }
    }
    prevUnlockedIds.current = currentUnlocked;
  }, [achievements.map((a) => `${a.id}:${a.unlocked}`).join(",")]);

  // Histórico recente (5 itens mais recentes por addedAt)
  const recentItems = [...items]
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    .slice(0, 5);

  const displayTotalCards = globalTotalCards > 0 ? globalTotalCards : totalCardsActive;
  const displayTotalValue = globalTotalValue > 0 ? globalTotalValue : totalValue;

  return (
    <div className="container pt-8 pb-16 max-w-4xl space-y-8 animate-fade-in">

      {/* Hero */}
      <div className="glass-panel p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative shrink-0">
            <div className="h-24 w-24 md:h-28 md:w-28 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-glow-gold">
              <span className="font-display text-5xl font-bold text-background select-none">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {isAdmin && (
              <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-lg bg-[hsl(28_85%_44%)] flex items-center justify-center shadow-lg border border-background">
                <Shield className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <h1 className="font-display text-2xl md:text-3xl font-bold truncate">
              {user.name}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">{user.email}</p>

            <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium",
                  planColor(session?.plan)
                )}
              >
                <Trophy className="h-3 w-3" />
                {planLabel(session?.plan)}
              </span>

              {isAdmin && (
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-[hsl(28_85%_44%)/50] bg-[hsl(28_85%_44%)/10] text-[hsl(28_85%_60%)] font-medium">
                  <Shield className="h-3 w-3" />
                  Administrador
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border/60 surface-elevated text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Membro desde {user.memberSince}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-panel p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Library className="h-4 w-4" />
            <p className="text-xs uppercase tracking-widest font-medium">Total de cartas</p>
          </div>
          <p className="font-display text-3xl font-bold mt-2">{displayTotalCards}</p>
          <p className="text-xs text-muted-foreground">em {portfolios.length || 1} portfolio{portfolios.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="glass-panel p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="h-4 w-4" />
            <p className="text-xs uppercase tracking-widest font-medium">Sets</p>
          </div>
          <p className="font-display text-3xl font-bold mt-2">{totalSets}</p>
          <p className="text-xs text-muted-foreground">sets diferentes</p>
        </div>

        <div className="glass-panel p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-4 w-4" />
            <p className="text-xs uppercase tracking-widest font-medium">Valor total</p>
          </div>
          <p className="font-display text-2xl font-bold mt-2 text-gradient-gold">
            {formatCurrency(displayTotalValue, currency)}
          </p>
          <p className="text-xs text-muted-foreground">preço de mercado</p>
        </div>

        <div className="glass-panel p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gem className="h-4 w-4" />
            <p className="text-xs uppercase tracking-widest font-medium">Raras</p>
          </div>
          <p className="font-display text-3xl font-bold mt-2">{rareCount}</p>
          <p className="text-xs text-muted-foreground">holo ou superior</p>
        </div>
      </div>

      {/* Pokémon favorito */}
      {favoritePokemon && (
        <div className="glass-panel p-6">
          <h2 className="font-display text-lg font-bold mb-4">Pokémon favorito</h2>
          <div className="flex items-center gap-5">
            {favoritePokemon.imageUrl && (
              <div className="h-24 w-16 rounded-xl overflow-hidden border border-border/50 shadow-lg shrink-0">
                <img
                  src={favoritePokemon.imageUrl}
                  alt={favoritePokemon.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Mais na coleção</p>
              <p className="font-display text-2xl font-bold">{favoritePokemon.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {favoritePokemon.qty} {favoritePokemon.qty === 1 ? "unidade" : "unidades"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Conquistas */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold">Conquistas</h2>
          <span className="text-xs text-muted-foreground surface-elevated border border-border/60 px-2.5 py-1 rounded-full">
            {achievements.filter((a) => a.unlocked).length} / {achievements.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={cn(
                "relative rounded-xl border p-4 flex flex-col items-center text-center gap-2 transition-all",
                a.unlocked
                  ? "border-[hsl(48_100%_50%)/30] bg-[hsl(48_100%_50%)/5] shadow-glow-gold"
                  : "border-border/40 bg-surface-elevated/30 opacity-50 grayscale"
              )}
              title={a.description}
            >
              <div
                className={cn(
                  "h-11 w-11 rounded-xl flex items-center justify-center",
                  a.unlocked
                    ? "bg-gradient-gold text-background"
                    : "bg-surface-elevated text-muted-foreground"
                )}
              >
                {a.unlocked ? a.icon : <Lock className="h-4 w-4" />}
              </div>
              <p className={cn("text-xs font-semibold leading-tight", a.unlocked ? "text-foreground" : "text-muted-foreground")}>
                {a.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Histórico recente */}
      {recentItems.length > 0 && (
        <div className="glass-panel p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-lg font-bold">Adições recentes</h2>
          </div>

          <div className="space-y-3">
            {recentItems.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-4 p-3 rounded-xl surface-elevated border border-border/40 hover:border-border/70 transition-colors"
              >
                <div className="h-14 w-10 rounded-lg overflow-hidden border border-border/40 shrink-0 bg-background">
                  {item.cardId.imageUrl ? (
                    <img
                      src={item.cardId.imageUrl}
                      alt={item.cardId.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-elevated" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.cardId.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.cardId.setName}</p>
                </div>

                <div className="text-right shrink-0">
                  {item.cardId.marketPriceBrl != null && (
                    <p className="font-display text-sm font-bold text-primary">
                      {formatCurrency(item.cardId.marketPriceBrl, currency)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(item.addedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progresso por set */}
      {setStats.length > 0 && (
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Progresso por set
            </h2>
            <span className="text-xs text-muted-foreground">{setStats.length} sets</span>
          </div>
          <div className="space-y-3">
            {(setStatsExpanded ? setStats : setStats.slice(0, 8)).map((s) => {
              const setTotal = sets.find((t) => t.id === s.setCode)?.total ?? s.totalInDb;
              const pct = setTotal > 0 ? Math.min(100, Math.round((s.owned / setTotal) * 100)) : 0;
              return (
                <div key={s.setCode}
                  className="space-y-1 cursor-pointer group"
                  onClick={() => navigate(`/sets/${s.setCode}`)}
                >
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="font-medium truncate group-hover:text-primary transition-colors">{s.setName}</span>
                    <span className="text-muted-foreground shrink-0 font-mono text-xs">
                      <span className="text-primary font-semibold">{s.owned}</span>/{setTotal}
                      <span className="ml-1.5 text-muted-foreground/60">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-gold transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {setStats.length > 8 && (
            <button
              onClick={() => setSetStatsExpanded((v) => !v)}
              className="text-xs text-muted-foreground mt-4 hover:text-foreground transition-colors"
            >
              {setStatsExpanded ? "Mostrar menos" : `Ver todos os ${setStats.length} sets →`}
            </button>
          )}
        </div>
      )}

      {/* Admin */}
      {isAdmin && (
        <div className="glass-panel p-6 border border-[hsl(28_85%_44%)/40] bg-[hsl(28_85%_44%)/5]">
          <div className="flex items-start gap-4 mb-5">
            <div className="h-12 w-12 rounded-xl bg-[hsl(28_85%_44%)/15] border border-[hsl(28_85%_44%)/40] flex items-center justify-center text-[hsl(28_85%_60%)] shrink-0">
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-lg font-bold">Área Administrativa</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Você tem permissões de administrador. Acesse o painel para gerenciar usuários, planos e configurações do sistema.
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/admin/dashboard")}
            className="w-full bg-[hsl(28_85%_44%)] hover:bg-[hsl(28_85%_38%)] text-white font-semibold gap-2"
          >
            Acessar painel admin
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Modal de conquista desbloqueada */}
      <Dialog open={!!unlockedAchievement} onOpenChange={(v) => !v && setUnlockedAchievement(null)}>
        <DialogContent className="bg-card border-border/70 max-w-xs p-0 overflow-hidden text-center">
          {unlockedAchievement && (
            <>
              {/* Fundo dourado animado */}
              <div className="relative bg-gradient-to-b from-[hsl(48_100%_50%/12%)] to-card pt-8 pb-6 px-6">
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_0%,hsl(48_100%_50%/25%),transparent_70%)]" />

                {/* Ícone grande com glow */}
                <div className="relative mx-auto h-20 w-20 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-glow-gold mb-4">
                  <div className="text-background scale-150">
                    {unlockedAchievement.icon}
                  </div>
                  {/* Partículas */}
                  <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-[hsl(48_100%_60%)] animate-pulse" />
                  <Sparkles className="absolute -bottom-1 -left-2 h-4 w-4 text-[hsl(48_100%_60%)] animate-pulse" style={{ animationDelay: "0.3s" }} />
                </div>

                <p className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(48_100%_60%)] mb-1">
                  Conquista desbloqueada!
                </p>
                <h2 className="font-display text-2xl font-bold text-foreground leading-tight">
                  {unlockedAchievement.label}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {unlockedAchievement.description}
                </p>
              </div>

              <div className="px-6 py-4 border-t border-border/50">
                <Button
                  className="w-full bg-gradient-gold text-background font-semibold hover:opacity-90 hover:shadow-glow-gold"
                  onClick={() => setUnlockedAchievement(null)}
                >
                  <Trophy className="h-4 w-4 mr-1.5" />
                  Continuar colecionando!
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Configurações */}
      <div className="glass-panel p-6 space-y-6">
        <h2 className="font-display text-lg font-bold">Configurações</h2>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Tema</Label>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-medium transition-colors",
                theme === "dark"
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border/60 surface-elevated text-muted-foreground hover:text-foreground"
              )}
            >
              <Moon className="h-4 w-4" />
              Escuro
            </button>
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-medium transition-colors",
                theme === "light"
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border/60 surface-elevated text-muted-foreground hover:text-foreground"
              )}
            >
              <Sun className="h-4 w-4" />
              Claro
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Moeda preferida</Label>
          <Select value={currency} onValueChange={(v) => setCurrency(v as "BRL" | "USD")}>
            <SelectTrigger className="surface-elevated border-border/60 h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">R$ — Real brasileiro</SelectItem>
              <SelectItem value="USD">US$ — Dólar americano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2 border-t border-border/40">
          <Button
            onClick={() => {
              clearSession();
              navigate("/");
              modal.info("Sessão encerrada", "Você foi desconectado com segurança.");
            }}
            variant="outline"
            className="w-full h-11 border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive/60 rounded-xl gap-2 font-medium"
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
