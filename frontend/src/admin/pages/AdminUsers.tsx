import { useMemo, useState, useCallback } from "react";
import { Search, MoreVertical, Repeat, Ban, Trash2, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  getUsers,
  updateUser,
  deleteUser,
  type StoredUser,
  type PlanId,
  type PlanStatus,
} from "@/lib/storage";

const PAGE_SIZE = 8;

const PLAN_LABELS: Record<PlanId, string> = { free: "Free", treinador: "Treinador", mestre: "Mestre" };

const PlanBadge = ({ plan }: { plan: PlanId }) => {
  const styles: Record<PlanId, string> = {
    free: "bg-muted text-muted-foreground border-border",
    treinador: "bg-secondary/15 text-secondary border-secondary/40",
    mestre: "bg-primary/15 text-primary border-primary/40",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${styles[plan]}`}>
      {PLAN_LABELS[plan]}
    </span>
  );
};

const StatusBadge = ({ status }: { status: PlanStatus }) => {
  const styles: Record<PlanStatus, string> = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
    overdue: "bg-red-500/15 text-red-400 border-red-500/40",
    suspended: "bg-muted text-muted-foreground border-border",
  };
  const labels: Record<PlanStatus, string> = { active: "Ativo", overdue: "Em atraso", suspended: "Suspenso" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState<StoredUser[]>(() => getUsers());
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const [changePlanTarget, setChangePlanTarget] = useState<StoredUser | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("free");
  const [deleteTarget, setDeleteTarget] = useState<StoredUser | null>(null);

  const reload = useCallback(() => setUsers(getUsers()), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchPlan = planFilter === "all" || u.plan === planFilter;
      const matchStatus = statusFilter === "all" || u.planStatus === statusFilter;
      return matchQ && matchPlan && matchStatus;
    });
  }, [users, query, planFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleChangePlan = () => {
    if (!changePlanTarget) return;
    updateUser(changePlanTarget.id, { plan: selectedPlan });
    reload();
    setChangePlanTarget(null);
    toast.success(`Plano de ${changePlanTarget.name} alterado para ${PLAN_LABELS[selectedPlan]}`);
  };

  const handleSuspend = (u: StoredUser) => {
    updateUser(u.id, { planStatus: "suspended", plan: "free" });
    reload();
    toast.success(`Conta de ${u.name} suspensa`);
  };

  const handleReactivate = (u: StoredUser) => {
    updateUser(u.id, { planStatus: "active" });
    reload();
    toast.success(`Conta de ${u.name} reativada`);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteUser(deleteTarget.id);
    reload();
    toast.success(`Usuário ${deleteTarget.name} excluído`);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Usuários</h1>
        <p className="text-sm text-muted-foreground mt-1">{filtered.length} usuários encontrados</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Buscar por nome ou email..."
            className="pl-9 bg-card/60"
          />
        </div>
        <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[160px] bg-card/60">
            <SelectValue placeholder="Plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os planos</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="treinador">Treinador</SelectItem>
            <SelectItem value="mestre">Mestre</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[160px] bg-card/60">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="overdue">Em atraso</SelectItem>
            <SelectItem value="suspended">Suspenso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60 bg-background/30">
                <th className="py-3 px-4 font-medium">Usuário</th>
                <th className="py-3 px-4 font-medium">Email</th>
                <th className="py-3 px-4 font-medium">Plano</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Cartas</th>
                <th className="py-3 px-4 font-medium">Membro desde</th>
                <th className="py-3 px-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((u) => (
                <tr key={u.id} className="border-b border-border/40 last:border-0 hover:bg-card/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[hsl(28_85%_44%)] to-[hsl(0_70%_45%)] flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                  <td className="py-3 px-4"><PlanBadge plan={u.plan} /></td>
                  <td className="py-3 px-4"><StatusBadge status={u.planStatus} /></td>
                  <td className="py-3 px-4 text-right tabular-nums">{u.cards.toLocaleString("pt-BR")}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(u.joinedAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onSelect={() => { setChangePlanTarget(u); setSelectedPlan(u.plan); }}>
                          <Repeat className="h-4 w-4" /> Alterar plano
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {u.planStatus === "suspended" ? (
                          <DropdownMenuItem onSelect={() => handleReactivate(u)}>
                            <CheckCircle className="h-4 w-4" /> Reativar conta
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => handleSuspend(u)}>
                            <Ban className="h-4 w-4" /> Suspender conta
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => setDeleteTarget(u)}
                        >
                          <Trash2 className="h-4 w-4" /> Excluir conta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 text-xs text-muted-foreground">
          <span>Página {safePage} de {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal — alterar plano */}
      <Dialog open={!!changePlanTarget} onOpenChange={(o) => !o && setChangePlanTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar plano</DialogTitle>
            <DialogDescription>Selecione o novo plano para {changePlanTarget?.name}.</DialogDescription>
          </DialogHeader>
          <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as PlanId)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="treinador">Treinador</SelectItem>
              <SelectItem value="mestre">Mestre</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanTarget(null)}>Cancelar</Button>
            <Button onClick={handleChangePlan} className="bg-[hsl(28_85%_44%)] hover:bg-[hsl(28_85%_38%)] text-white">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal — excluir */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir usuário</DialogTitle>
            <DialogDescription>
              Tem certeza? Esta ação não pode ser desfeita. O usuário <strong>{deleteTarget?.name}</strong> será removido permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
