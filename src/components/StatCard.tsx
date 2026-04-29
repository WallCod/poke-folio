import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
  accent?: "gold" | "blue" | "holo";
  className?: string;
}

export const StatCard = ({
  label,
  value,
  delta,
  icon: Icon,
  accent = "gold",
  className,
}: StatCardProps) => {
  const accentBg =
    accent === "gold"
      ? "from-primary/20 to-primary/0"
      : accent === "blue"
      ? "from-secondary/25 to-secondary/0"
      : "from-rarity-holo/20 to-rarity-holo/0";

  const iconColor =
    accent === "gold"
      ? "text-primary"
      : accent === "blue"
      ? "text-secondary"
      : "text-rarity-holo";

  return (
    <div
      className={cn(
        "glass-panel relative overflow-hidden p-5 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated",
        className
      )}
    >
      <div
        className={cn(
          "absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl opacity-60 bg-gradient-to-br",
          accentBg
        )}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            {label}
          </p>
          <p className="font-display text-2xl md:text-3xl font-bold mt-2 tracking-tight">
            {value}
          </p>
          {delta && (
            <p className="text-xs text-muted-foreground mt-1.5">
              <span className="text-emerald-400 font-medium">{delta}</span>{" "}
              este mês
            </p>
          )}
        </div>
        <div
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center bg-surface-elevated border border-border/70",
            iconColor
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};
