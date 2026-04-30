import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PokeCard } from "@/components/PokeCard";
import { RarityBadge } from "@/components/RarityBadge";
import { CardSkeleton } from "@/components/Skeletons";
import { sampleCards } from "@/data/sample";
import { useCollection, type Card } from "@/store/useCollection";
import { formatCurrency } from "@/lib/format";
import { Search, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

const Catalog = () => {
  const currency = useCollection((s) => s.currency);
  const addCard = useCollection((s) => s.addCard);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Card | null>(null);
  const [loading] = useState(false);

  const results = sampleCards.filter((c) =>
    query ? c.name.toLowerCase().includes(query.toLowerCase()) : true
  );

  return (
    <div className="container pt-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-bold">
          Catálogo
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explore cartas do universo Pokémon TCG
        </p>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome de carta ou Pokémon..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 surface-elevated border-border/70 h-11 text-base"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {["Set", "Raridade", "Tipo", "Artista", "Ano"].map((label) => (
            <Select key={label}>
              <SelectTrigger className="surface-elevated border-border/70">
                <SelectValue placeholder={label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          ))}
        </div>
      </div>

      {/* Results grid */}
      {!loading && results.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-4">
          <div className="relative h-28 w-28 mx-auto opacity-80">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <circle cx="50" cy="50" r="46" fill="hsl(240 17% 15%)" stroke="hsl(240 10% 30%)" strokeWidth="3" />
              <path d="M 4,50 A 46,46 0 0 1 96,50 Z" fill="hsl(240 10% 24%)" />
              <rect x="4" y="48" width="92" height="4" fill="hsl(240 22% 6%)" />
              <circle cx="50" cy="50" r="11" fill="hsl(240 17% 11%)" stroke="hsl(240 10% 35%)" strokeWidth="2.5" />
              <text x="50" y="56" textAnchor="middle" fontSize="11" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fill="hsl(240 11% 58%)">?</text>
            </svg>
          </div>
          <div>
            <p className="font-display text-lg font-bold">Nenhuma carta encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">Tente outro nome ou filtro</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)
            : results.map((c) => (
                <PokeCard
                  key={c.id}
                  card={c}
                  currency={currency}
                  onClick={() => setSelected(c)}
                />
              ))}
        </div>
      )}

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="bg-card border-border/70 max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl flex items-center gap-3">
                  {selected.name}
                  <RarityBadge rarity={selected.rarity} />
                </DialogTitle>
                <DialogDescription>
                  {selected.set} · {selected.number}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="aspect-[63/88] rounded-xl bg-gradient-to-br from-surface-elevated via-card to-background border border-border/60 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-primary/60" />
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <p className="font-semibold">{selected.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ano</p>
                      <p className="font-semibold">{selected.year}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Artista</p>
                      <p className="font-semibold">{selected.artist}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Número</p>
                      <p className="font-semibold">{selected.number}</p>
                    </div>
                  </div>
                  <div className="surface-elevated rounded-xl p-4 border border-border/60">
                    <p className="text-xs text-muted-foreground">Preço médio</p>
                    <p className="font-display text-3xl font-bold text-gradient-gold mt-1">
                      {formatCurrency(selected.marketPrice, currency)}
                    </p>
                  </div>
                  <Button
                    className="w-full bg-gradient-gold text-background font-semibold hover:opacity-90 hover:shadow-glow-gold"
                    onClick={() => {
                      addCard({
                        ...selected,
                        quantity: 1,
                        condition: "NM",
                        foil: false,
                        addedAt: new Date().toISOString(),
                      });
                      toast.success(`${selected.name} adicionada!`);
                      setSelected(null);
                    }}
                  >
                    <Plus className="h-4 w-4" /> Adicionar à coleção
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Catalog;
