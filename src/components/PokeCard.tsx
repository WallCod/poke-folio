import { useRef, MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { RarityBadge } from "./RarityBadge";
import { formatCurrency } from "@/lib/format";
import type { Card, Rarity } from "@/store/useCollection";
import { Sparkles } from "lucide-react";

interface PokeCardProps {
  card: Partial<Card> & {
    name: string;
    set: string;
    rarity: Rarity;
    marketPrice: number;
    imageUrl?: string;
  };
  quantity?: number;
  currency?: "BRL" | "USD";
  className?: string;
  onClick?: () => void;
}

export const PokeCard = ({
  card,
  quantity,
  currency = "BRL",
  className,
  onClick,
}: PokeCardProps) => {
  const ref = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mx", `${mx}%`);
    el.style.setProperty("--my", `${my}%`);
  };

  const isElite = card.rarity === "ultra" || card.rarity === "secret";

  return (
    <button
      ref={ref}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={cn(
        "holo-card group text-left bg-card rounded-2xl overflow-hidden border border-border/60 shadow-card",
        "focus:outline-none focus:ring-2 focus:ring-primary/60",
        isElite && "border-gold-glow",
        card.rarity === "holo" && "border-holo-glow",
        className
      )}
    >
      {/* Image area */}
      <div className="relative aspect-[63/88] overflow-hidden bg-gradient-to-br from-surface-elevated to-card">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-elevated via-card to-background">
            <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
              <Sparkles className="h-8 w-8" />
              <span className="text-[10px] uppercase tracking-widest">
                Pokémon TCG
              </span>
            </div>
            {/* faux holo sheen */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-secondary/10" />
          </div>
        )}

        {/* Top-left rarity */}
        <div className="absolute left-2.5 top-2.5 z-10">
          <RarityBadge rarity={card.rarity} />
        </div>

        {/* Quantity */}
        {quantity !== undefined && (
          <div className="absolute right-2.5 top-2.5 z-10 flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-background/80 backdrop-blur text-[11px] font-semibold border border-border/60">
            ×{quantity}
          </div>
        )}

        {/* Hover price tooltip */}
        <div className="absolute bottom-2.5 right-2.5 z-10 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
          <div className="px-2.5 py-1 rounded-lg bg-background/90 backdrop-blur text-[11px] font-semibold border border-primary/40 text-primary">
            {formatCurrency(card.marketPrice, currency)}
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="p-3.5 space-y-1">
        <h3 className="font-display font-semibold text-sm leading-tight truncate">
          {card.name}
        </h3>
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="truncate">{card.set}</span>
          <span className="font-semibold text-foreground/90">
            {formatCurrency(card.marketPrice, currency)}
          </span>
        </div>
      </div>
    </button>
  );
};
