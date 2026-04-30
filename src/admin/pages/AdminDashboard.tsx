import { Users, CreditCard, Layers, DollarSign } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { sampleUsers, planDistribution, newUsersPerDay } from "../data/sampleAdmin";

const AMBER = "hsl(28 85% 55%)";

const MetricCard = ({
  label,
  value,
  hint,
  icon: Icon,
  children,
}: {
  label: string;
  value?: string;
  hint?: string;
  icon: React.ElementType;
  children?: React.ReactNode;
}) => (
  <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/60 p-5 relative overflow-hidden">
    <div
      className="absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl opacity-50"
      style={{ background: "radial-gradient(circle, hsl(28 85% 44% / 0.4), transparent)" }}
    />
    <div className="relative flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">{label}</p>
        {value && (
          <p className="font-display text-2xl md:text-3xl font-bold mt-2 tracking-tight">{value}</p>
        )}
        {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
        {children}
      </div>
      <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[hsl(28_85%_44%)]/15 border border-[hsl(28_85%_44%)]/40 text-[hsl(28_85%_60%)] shrink-0 ml-3">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const AdminDashboard = () => {
  const totalUsers = planDistribution.reduce((s, p) => s + p.value, 0);
  const monthlyRevenue =
    planDistribution.find((p) => p.name === "Treinador")!.value * 14.9 +
    planDistribution.find((p) => p.name === "Mestre")!.value * 34.9;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral da plataforma Pokéfolio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total de usuários"
          value={totalUsers.toLocaleString("pt-BR")}
          hint="+128 este mês"
          icon={Users}
        />
        <MetricCard label="Distribuição por plano" icon={CreditCard}>
          <div className="mt-2 h-[70px] -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planDistribution}
                  dataKey="value"
                  innerRadius={20}
                  outerRadius={32}
                  paddingAngle={2}
                  stroke="none"
                >
                  {planDistribution.map((p) => (
                    <Cell key={p.name} fill={p.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-3 mt-1 flex-wrap text-[10px]">
            {planDistribution.map((p) => (
              <div key={p.name} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                <span className="text-muted-foreground">
                  {p.name} <span className="text-foreground font-medium">{p.value}</span>
                </span>
              </div>
            ))}
          </div>
        </MetricCard>
        <MetricCard
          label="Cartas cadastradas"
          value="48.230"
          hint="+1.420 este mês"
          icon={Layers}
        />
        <MetricCard
          label="Receita do mês"
          value={formatBRL(monthlyRevenue)}
          hint="Estimativa MRR"
          icon={DollarSign}
        />
      </div>

      <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/60 p-5">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="font-display text-lg font-bold">Novos usuários</h2>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </div>
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={newUsersPerDay} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="amberLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={AMBER} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(240 10% 20%)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(240 11% 58%)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(240 11% 58%)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(240 17% 11%)",
                  border: "1px solid hsl(240 10% 20%)",
                  borderRadius: 12,
                }}
                labelStyle={{ color: "hsl(240 17% 96%)" }}
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke={AMBER}
                strokeWidth={2.5}
                dot={{ fill: AMBER, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/60 p-5">
        <h2 className="font-display text-lg font-bold mb-4">Últimos usuários cadastrados</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <th className="py-3 pr-4 font-medium">Usuário</th>
                <th className="py-3 pr-4 font-medium">Email</th>
                <th className="py-3 pr-4 font-medium">Plano</th>
                <th className="py-3 pr-4 font-medium">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {sampleUsers.slice(0, 6).map((u) => (
                <tr key={u.id} className="border-b border-border/40 hover:bg-card/40 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[hsl(28_85%_44%)] to-[hsl(0_70%_45%)] flex items-center justify-center text-xs font-bold text-white">
                        {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{u.email}</td>
                  <td className="py-3 pr-4">
                    <PlanBadge plan={u.plan} />
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PlanBadge = ({ plan }: { plan: "Free" | "Treinador" | "Mestre" }) => {
  const styles = {
    Free: "bg-muted text-muted-foreground border-border",
    Treinador: "bg-secondary/15 text-secondary border-secondary/40",
    Mestre: "bg-primary/15 text-primary border-primary/40",
  } as const;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${styles[plan]}`}>
      {plan}
    </span>
  );
};

export default AdminDashboard;
