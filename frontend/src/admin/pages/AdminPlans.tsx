import { useState } from "react";
import { Check, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { adminPlans } from "../data/sampleAdmin";

type Plan = (typeof adminPlans)[number];

const featureLabels: Record<keyof Plan["features"], string> = {
  catalog: "Catálogo completo",
  priceTracking: "Acompanhamento de preços",
  csvExport: "Exportar CSV",
  apiAccess: "Acesso à API",
  prioritySupport: "Suporte prioritário",
};

const AdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>(adminPlans);
  const [editing, setEditing] = useState<Plan | null>(null);

  const savePlan = (updated: Plan) => {
    setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditing(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Planos</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie limites e recursos de cada plano</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((p) => {
          const isMaster = p.id === "mestre";
          return (
            <div
              key={p.id}
              className={`rounded-2xl bg-card/60 backdrop-blur-xl border p-6 relative ${
                isMaster
                  ? "border-[hsl(28_85%_44%)]/50 shadow-[0_0_30px_-10px_hsl(28_85%_44%/0.5)]"
                  : "border-border/60"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                    {p.label}
                  </p>
                  <h3 className="font-display text-xl font-bold mt-1">{p.name}</h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(p)}
                  className="border-[hsl(28_85%_44%)]/40 text-[hsl(28_85%_60%)] hover:bg-[hsl(28_85%_44%)]/10 hover:text-[hsl(28_85%_60%)]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
              </div>

              <div className="mt-4 mb-5">
                <span className="font-display text-3xl font-bold">
                  {p.price === 0 ? "Grátis" : `R$ ${p.price.toFixed(2).replace(".", ",")}`}
                </span>
                {p.price > 0 && <span className="text-sm text-muted-foreground"> /mês</span>}
              </div>

              <div className="space-y-2 text-sm border-t border-border/60 pt-4">
                <Row
                  label="Limite de cartas"
                  value={p.cardLimit === -1 ? "Ilimitado" : p.cardLimit.toLocaleString("pt-BR")}
                />
                <Row label="Histórico de preços" value={`${p.priceHistoryDays} dias`} />
              </div>

              <div className="mt-4 space-y-2 border-t border-border/60 pt-4">
                {Object.entries(p.features).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 text-sm">
                    {v ? (
                      <Check className="h-4 w-4 text-[hsl(28_85%_60%)]" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/50" />
                    )}
                    <span className={v ? "" : "text-muted-foreground line-through"}>
                      {featureLabels[k as keyof Plan["features"]]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <EditPlanDialog plan={editing} onClose={() => setEditing(null)} onSave={savePlan} />
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const EditPlanDialog = ({
  plan,
  onClose,
  onSave,
}: {
  plan: Plan | null;
  onClose: () => void;
  onSave: (p: Plan) => void;
}) => {
  const [draft, setDraft] = useState<Plan | null>(plan);

  // Sync draft when plan changes
  if (plan && (!draft || draft.id !== plan.id)) {
    setDraft(plan);
  }

  if (!plan || !draft) return null;

  return (
    <Dialog open={!!plan} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar plano</DialogTitle>
          <DialogDescription>Ajuste os limites e recursos disponíveis.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome do plano</Label>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Limite de cartas</Label>
              <Input
                type="number"
                value={draft.cardLimit}
                onChange={(e) => setDraft({ ...draft, cardLimit: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Histórico de preços (dias)</Label>
            <Input
              type="number"
              value={draft.priceHistoryDays}
              onChange={(e) => setDraft({ ...draft, priceHistoryDays: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2 pt-1">
            <Label>Recursos habilitados</Label>
            <div className="space-y-2 rounded-lg border border-border/60 p-3">
              {Object.entries(draft.features).map(([k, v]) => (
                <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={v}
                    onCheckedChange={(c) =>
                      setDraft({
                        ...draft,
                        features: { ...draft.features, [k]: !!c },
                      })
                    }
                  />
                  {featureLabels[k as keyof Plan["features"]]}
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => onSave(draft)}
            className="bg-[hsl(28_85%_44%)] hover:bg-[hsl(28_85%_38%)] text-white"
          >
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminPlans;
