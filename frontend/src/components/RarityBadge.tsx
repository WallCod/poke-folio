import { cn } from "@/lib/utils";
import type { Rarity } from "@/store/useCollection";

const labels: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  holo: "Holo Rare",
  ultra: "Ultra Rare",
  secret: "Secret Rare",
};

export const RarityBadge = ({
  rarity,
  className,
}: {
  rarity: Rarity;
  className?: string;
}) => {
  const base =
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border backdrop-blur-md";

  const styles: Record<Rarity, string> = {
    common:
      "bg-rarity-common/15 text-rarity-common border-rarity-common/30",
    uncommon:
      "bg-rarity-uncommon/15 text-rarity-uncommon border-rarity-uncommon/30",
    rare: "bg-rarity-rare/15 text-rarity-rare border-rarity-rare/30",
    holo:
      "bg-rarity-holo/15 text-rarity-holo border-rarity-holo/40 shadow-[0_0_12px_-2px_hsl(var(--rarity-holo)/0.5)]",
    ultra:
      "bg-primary/15 text-primary border-primary/40 shadow-[0_0_14px_-2px_hsl(var(--primary)/0.55)]",
    secret:
      "bg-gradient-to-r from-pink-500/20 via-cyan-400/20 to-emerald-400/20 text-foreground border-white/20 shadow-[0_0_16px_-2px_rgba(192,132,252,0.5)]",
  };

  return (
    <span className={cn(base, styles[rarity], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[rarity]}
    </span>
  );
};
