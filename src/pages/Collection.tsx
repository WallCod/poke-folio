import { useState, useMemo } from "react";
import { PokeCard } from "@/components/PokeCard";
import { RarityBadge } from "@/components/RarityBadge";
import { CardSkeleton } from "@/components/Skeletons";
import { AddCardModal } from "@/components/AddCardModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCollection } from "@/store/useCollection";
import { sampleOwned } from "@/data/sample";
import { formatCurrency } from "@/lib/format";
import { Search, Plus, Grid3x3, List, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const PokeballEmpty = ({ withQuestion = false }: { withQuestion?: boolean }) => (
  <div className="relative h-28 w-28 mx-auto opacity-80">
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <circle cx="50" cy="50" r="46" fill="hsl(240 17% 15%)" stroke="hsl(240 10% 30%)" strokeWidth="3" />
      <path d="M 4,50 A 46,46 0 0 1 96,50 Z" fill="hsl(240 10% 24%)" />
      <rect x="4" y="48" width="92" height="4" fill="hsl(240 22% 6%)" />
      <circle cx="50" cy="50" r="11" fill="hsl(240 17% 11%)" stroke="hsl(240 10% 35%)" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="5" fill="hsl(240 10% 28%)" />
      {withQuestion && (
        <text x="50" y="56" textAnchor="middle" fontSize="11" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fill="hsl(240 11% 58%)">?</text>
      )}
    </svg>
  </div>
);

const Collection = () => {
  const userCards = useCollection((s) => s.cards);
  const currency = useCollection((s) => s.currency);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [setFilter, setSetFilter] = useState("all");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [open, setOpen] = useState(false);

  const cards = userCards.length > 0 ? userCards : sampleOwned;
  const isEmpty = userCards.length === 0;

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (setFilter !== "all" && c.set !== setFilter) return false;
      if (rarityFilter !== "all" && c.rarity !== rarityFilter) return false;
      return true;
    });
  }, [cards, query, setFilter, rarityFilter]);

  const setOptions = useMemo(
    () => Array.from(new Set(cards.map((c) => c.set))),
    [cards]
  );

  return (
    <div className="container pt-8 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            Minha coleção
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} carta{filtered.length !== 1 && "s"} ·{" "}
            {isEmpty && <span className="text-primary">demonstração visual</span>}
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="bg-gradient-gold text-background font-semibold hover:opacity-90 hover:shadow-glow-gold"
        >
          <Plus className="h-4 w-4" /> Adicionar carta
        </Button>
      </div>

      {/* Filters bar */}
      <div className="glass-panel p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 surface-elevated border-border/70 h-11 text-base"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={setFilter} onValueChange={setSetFilter}>
            <SelectTrigger className="w-auto min-w-[140px] surface-elevated border-border/70">
              <SelectValue placeholder="Set" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os sets</SelectItem>
              {setOptions.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={rarityFilter} onValueChange={setRarityFilter}>
            <SelectTrigger className="w-auto min-w-[140px] surface-elevated border-border/70">
              <SelectValue placeholder="Raridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas raridades</SelectItem>
              <SelectItem value="common">Common</SelectItem>
              <SelectItem value="uncommon">Uncommon</SelectItem>
              <SelectItem value="rare">Rare</SelectItem>
              <SelectItem value="holo">Holo Rare</SelectItem>
              <SelectItem value="ultra">Ultra Rare</SelectItem>
              <SelectItem value="secret">Secret Rare</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-1 surface-elevated rounded-lg p-1 border border-border/70">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                view === "grid"
                  ? "bg-primary text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Grid"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                view === "list"
                  ? "bg-primary text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <p className="text-muted-foreground">Nenhuma carta encontrada.</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((c) => (
            <PokeCard
              key={c.id}
              card={c}
              quantity={c.quantity}
              currency={currency}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="text-left p-4 font-medium">Carta</th>
                  <th className="text-left p-4 font-medium">Set</th>
                  <th className="text-left p-4 font-medium">Raridade</th>
                  <th className="text-left p-4 font-medium">Condição</th>
                  <th className="text-right p-4 font-medium">Qtd</th>
                  <th className="text-right p-4 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-elevated/60 transition-colors">
                    <td className="p-4 font-semibold">{c.name}</td>
                    <td className="p-4 text-muted-foreground">{c.set}</td>
                    <td className="p-4"><RarityBadge rarity={c.rarity} /></td>
                    <td className="p-4 text-muted-foreground">{c.condition}</td>
                    <td className="p-4 text-right">×{c.quantity}</td>
                    <td className="p-4 text-right font-display font-semibold text-primary">
                      {formatCurrency(c.marketPrice * c.quantity, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddCardModal open={open} onOpenChange={setOpen} />
    </div>
  );
};

export default Collection;
