import { useMemo, useState } from "react";
import { Search, MoreVertical, Eye, Repeat, Ban, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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
import { sampleUsers, AdminPlan } from "../data/sampleAdmin";

const PAGE_SIZE = 8;

const PlanBadge = ({ plan }: { plan: AdminPlan }) => {
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

const AdminUsers = () => {
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return sampleUsers.filter((u) => {
      const q = query.trim().toLowerCase();
      const matchesQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesPlan = planFilter === "all" || u.plan === planFilter;
      return matchesQ && matchesPlan;
    });
  }, [query, planFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome ou email..."
            className="pl-9 bg-card/60"
          />
        </div>
        <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px] bg-card/60">
            <SelectValue placeholder="Plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os planos</SelectItem>
            <SelectItem value="Free">Free</SelectItem>
            <SelectItem value="Treinador">Treinador</SelectItem>
            <SelectItem value="Mestre">Mestre</SelectItem>
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
                  <td className="py-3 px-4 text-right tabular-nums">{u.cards.toLocaleString("pt-BR")}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem><Eye className="h-4 w-4" />Ver perfil</DropdownMenuItem>
                        <DropdownMenuItem><Repeat className="h-4 w-4" />Alterar plano</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem><Ban className="h-4 w-4" />Suspender conta</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4" />Excluir conta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 text-xs text-muted-foreground">
          <span>
            Página {safePage} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
