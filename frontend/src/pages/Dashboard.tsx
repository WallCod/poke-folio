import { Link } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { PokeCard } from "@/components/PokeCard";
import { CardSkeleton } from "@/components/Skeletons";
import { sampleOwned, valueHistory } from "@/data/sample";
import { useCollection } from "@/store/useCollection";
import { formatCurrency } from "@/lib/format";
import { getSession } from "@/lib/auth";
import { getUsers } from "@/lib/storage";
import {
  Library,
  Wallet,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const Dashboard = () => {
  const currency = useCollection((s) => s.currency);
  const userCards = useCollection((s) => s.cards);

  // Use sample data only to demonstrate layout — real data comes from API
  const cards = userCards.length > 0 ? userCards : sampleOwned;
  const isEmpty = userCards.length === 0;

  const session = getSession();
  const storedUser = session ? getUsers().find((u) => u.email === session.email) : null;
  const isOverdue = storedUser?.planStatus === "overdue" || storedUser?.planStatus === "suspended";

  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0);
  const totalValue = cards.reduce(
    (sum, c) => sum + c.marketPrice * c.quantity,
    0
  );
  const rareCount = cards.filter((c) =>
    ["holo", "ultra", "secret"].includes(c.rarity)
  ).length;

  const topCards = [...cards]
    .sort((a, b) => b.marketPrice - a.marketPrice)
    .slice(0, 5);

  return (
    <div className="container pt-8 space-y-10 animate-fade-in">
      {/* Banner de plano vencido/suspenso */}
      {isOverdue && (
        <div className="flex items-center justify-between gap-4 rounded-xl bg-red-950/80 border border-red-500/40 px-4 py-3">
          <p className="text-sm text-red-200">
            Sua assinatura está com pagamento pendente. Regularize para continuar usando todos os recursos.
          </p>
          <Link
            to="/pricing"
            className="shrink-0 text-xs font-semibold text-red-200 underline hover:text-white transition-colors"
          >
            Ver planos
          </Link>
        </div>
      )}
      {/* Greeting */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Bem-vindo de volta</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">
            Sua <span className="text-gradient-gold">coleção</span> em um relance
          </h1>
        </div>
        {isEmpty && (
          <div className="text-xs text-muted-foreground bg-surface-elevated/60 border border-border/60 px-3 py-2 rounded-lg">
            Mostrando dados de exemplo · adicione cartas para ver os seus
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total de cartas"
          value={totalCards.toString()}
          delta="+12"
          icon={Library}
          accent="gold"
        />
        <StatCard
          label="Valor estimado"
          value={formatCurrency(totalValue, currency)}
          delta="+8.4%"
          icon={Wallet}
          accent="blue"
        />
        <StatCard
          label="Raras / Ultra"
          value={rareCount.toString()}
          delta="+3"
          icon={Sparkles}
          accent="holo"
        />
        <StatCard
          label="Sets completos"
          value="2"
          delta="+1"
          icon={CheckCircle2}
          accent="gold"
        />
      </div>

      {/* Chart */}
      <section className="glass-panel p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-display text-xl font-bold">
              Valor da coleção
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Últimos 12 meses · acompanhamento de mercado
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
            <TrendingUp className="h-4 w-4" />
            +93%
          </div>
        </div>
        <div className="h-64 md:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={valueHistory}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(48 100% 50%)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="hsl(48 100% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 6" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "10px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                formatter={(v: number) => [formatCurrency(v, currency), "Valor"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(48 100% 55%)"
                strokeWidth={2.5}
                fill="url(#goldFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recent additions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Adições recentes</h2>
          <Link
            to="/collection"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Ver coleção <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {isEmpty
            ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
            : cards
                .slice(0, 6)
                .map((c) => (
                  <PokeCard
                    key={c.id}
                    card={c}
                    quantity={c.quantity}
                    currency={currency}
                  />
                ))}
        </div>
      </section>

      {/* Top valuable */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold">
          Cartas mais valiosas
        </h2>
        <div className="glass-panel divide-y divide-border/40 overflow-hidden">
          {topCards.map((c, i) => (
            <div
              key={c.id}
              className="flex items-center gap-4 p-4 hover:bg-surface-elevated/60 transition-colors"
            >
              <span className="font-display font-bold text-lg w-6 text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="h-14 w-10 rounded-md bg-gradient-to-br from-surface-elevated to-card border border-border/60 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {c.set} · {c.number}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-primary">
                  {formatCurrency(c.marketPrice, currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  ×{c.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
