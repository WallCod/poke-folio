import { Button } from "@/components/ui/button";
import { useCollection, type Condition } from "@/store/useCollection";
import { sampleOwned } from "@/data/sample";
import { formatCurrency } from "@/lib/format";
import { Download, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const conditionStyles: Record<Condition, string> = {
  Mint: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  NM: "bg-secondary/15 text-secondary border-secondary/30",
  LP: "bg-primary/15 text-primary border-primary/30",
  MP: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  HP: "bg-destructive/15 text-destructive border-destructive/30",
};

const Prices = () => {
  const userCards = useCollection((s) => s.cards);
  const currency = useCollection((s) => s.currency);
  const cards = userCards.length > 0 ? userCards : sampleOwned;

  const total = cards.reduce((sum, c) => sum + c.marketPrice * c.quantity, 0);

  const exportCSV = () => {
    const headers = ["Carta", "Set", "Condição", "Qtd", "Preço unit.", "Valor total"];
    const rows = cards.map((c) => [
      c.name,
      c.set,
      c.condition,
      c.quantity,
      c.marketPrice.toFixed(2),
      (c.marketPrice * c.quantity).toFixed(2),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pokefolio-precos.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  return (
    <div className="container pt-8 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Preços</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Valor de mercado de toda sua coleção
          </p>
        </div>
        <Button
          onClick={exportCSV}
          variant="outline"
          className="border-border/70 bg-card/50 hover:bg-surface-elevated"
        >
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {/* Hero total */}
      <div className="glass-panel p-6 flex items-center gap-5">
        <div className="h-14 w-14 rounded-2xl bg-gradient-gold flex items-center justify-center text-background shadow-glow-gold">
          <Wallet className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Valor estimado total
          </p>
          <p className="font-display text-3xl md:text-4xl font-bold mt-1 text-gradient-gold">
            {formatCurrency(total, currency)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
              <tr>
                <th className="text-left p-4 font-medium">Carta</th>
                <th className="text-left p-4 font-medium">Set</th>
                <th className="text-left p-4 font-medium">Condição</th>
                <th className="text-right p-4 font-medium">Qtd</th>
                <th className="text-right p-4 font-medium">Preço unit.</th>
                <th className="text-right p-4 font-medium">Valor total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {cards.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-surface-elevated/60 transition-colors"
                >
                  <td className="p-4 font-semibold">{c.name}</td>
                  <td className="p-4 text-muted-foreground">{c.set}</td>
                  <td className="p-4">
                    <span
                      className={cn(
                        "inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border",
                        conditionStyles[c.condition]
                      )}
                    >
                      {c.condition}
                    </span>
                  </td>
                  <td className="p-4 text-right">×{c.quantity}</td>
                  <td className="p-4 text-right text-muted-foreground">
                    {formatCurrency(c.marketPrice, currency)}
                  </td>
                  <td className="p-4 text-right font-display font-semibold text-primary">
                    {formatCurrency(c.marketPrice * c.quantity, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-border/60 bg-surface-elevated/40">
              <tr>
                <td colSpan={5} className="p-4 text-right font-semibold uppercase text-xs tracking-wider text-muted-foreground">
                  Total geral
                </td>
                <td className="p-4 text-right font-display text-lg font-bold text-gradient-gold">
                  {formatCurrency(total, currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Prices;
