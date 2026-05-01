import { useState, useCallback, useMemo } from "react";
import { DollarSign, Clock, AlertTriangle, TrendingDown, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getPayments,
  getUsers,
  updatePayment,
  updateUser,
  type StoredPayment,
  type StoredUser,
  type PaymentStatus,
  PLAN_PRICES,
} from "@/lib/storage";

const PLAN_LABELS = { free: "Free", treinador: "Treinador", mestre: "Mestre" } as const;

const StatusBadge = ({ status }: { status: PaymentStatus }) => {
  const map: Record<PaymentStatus, { label: string; cls: string }> = {
    paid: { label: "Pago", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40" },
    pending: { label: "Pendente", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/40" },
    overdue: { label: "Em atraso", cls: "bg-red-500/15 text-red-400 border-red-500/40" },
    cancelled: { label: "Cancelado", cls: "bg-muted text-muted-foreground border-border" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
      {label}
    </span>
  );
};

const SummaryCard = ({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) => (
  <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/60 p-5 flex items-start justify-between">
    <div>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">{label}</p>
      <p className="font-display text-2xl font-bold mt-2">{value}</p>
    </div>
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${color} shrink-0`}>
      <Icon className="h-5 w-5" />
    </div>
  </div>
);

const AdminPayments = () => {
  const [payments, setPayments] = useState<StoredPayment[]>(() => getPayments());
  const [users] = useState<StoredUser[]>(() => getUsers());

  const reload = useCallback(() => setPayments(getPayments()), []);

  const userMap = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);

  const paidTotal = useMemo(
    () => payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0),
    [payments]
  );
  const pendingCount = payments.filter((p) => p.status === "pending").length;
  const overdueCount = payments.filter((p) => p.status === "overdue").length;
  const totalBillable = payments.filter((p) => p.status !== "cancelled").length;
  const inadimplencia = totalBillable > 0 ? ((overdueCount / totalBillable) * 100).toFixed(1) : "0";

  const handleMarkPaid = (p: StoredPayment) => {
    updatePayment(p.id, { status: "paid" });
    updateUser(p.userId, { planStatus: "active" });
    reload();
    toast.success("Pagamento marcado como pago");
  };

  const handleCancel = (p: StoredPayment) => {
    updatePayment(p.id, { status: "cancelled" });
    updateUser(p.userId, { plan: "free", planStatus: "active" });
    reload();
    toast.success("Plano cancelado — usuário rebaixado para Free");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Pagamentos</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão de assinaturas e cobranças</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Receita do mês"
          value={paidTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          icon={DollarSign}
          color="bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
        />
        <SummaryCard
          label="Pendentes"
          value={String(pendingCount)}
          icon={Clock}
          color="bg-yellow-500/15 border-yellow-500/40 text-yellow-400"
        />
        <SummaryCard
          label="Em atraso"
          value={String(overdueCount)}
          icon={AlertTriangle}
          color="bg-red-500/15 border-red-500/40 text-red-400"
        />
        <SummaryCard
          label="Inadimplência"
          value={`${inadimplencia}%`}
          icon={TrendingDown}
          color="bg-[hsl(28_85%_44%)]/15 border-[hsl(28_85%_44%)]/40 text-[hsl(28_85%_60%)]"
        />
      </div>

      <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60 bg-background/30">
                <th className="py-3 px-4 font-medium">Usuário</th>
                <th className="py-3 px-4 font-medium">Plano</th>
                <th className="py-3 px-4 font-medium text-right">Valor</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Vencimento</th>
                <th className="py-3 px-4 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const user = userMap[p.userId];
                return (
                  <tr key={p.id} className="border-b border-border/40 last:border-0 hover:bg-card/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[hsl(28_85%_44%)] to-[hsl(0_70%_45%)] flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {user?.name.split(" ").map((n) => n[0]).slice(0, 2).join("") ?? "?"}
                        </div>
                        <div>
                          <p className="font-medium">{user?.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{user?.email ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground capitalize">{PLAN_LABELS[p.plan]}</td>
                    <td className="py-3 px-4 text-right tabular-nums font-medium">
                      {p.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(p.dueDate).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(p.status === "pending" || p.status === "overdue") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => handleMarkPaid(p)}
                          >
                            <CheckCircle className="h-3 w-3" /> Pago
                          </Button>
                        )}
                        {p.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                            onClick={() => handleCancel(p)}
                          >
                            <XCircle className="h-3 w-3" /> Cancelar
                          </Button>
                        )}
                        {p.status === "cancelled" && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                    Nenhum pagamento encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
