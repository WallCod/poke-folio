import { cn } from "@/lib/utils";

export const CardSkeleton = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "rounded-2xl border border-border/50 bg-card overflow-hidden",
      className
    )}
  >
    <div className="aspect-[63/88] bg-gradient-to-br from-surface-elevated via-card to-surface-elevated bg-[length:200%_100%] animate-shimmer" />
    <div className="p-3.5 space-y-2">
      <div className="h-3 w-3/4 rounded bg-surface-elevated bg-gradient-to-r from-surface-elevated via-muted to-surface-elevated bg-[length:200%_100%] animate-shimmer" />
      <div className="h-2.5 w-1/2 rounded bg-surface-elevated bg-gradient-to-r from-surface-elevated via-muted to-surface-elevated bg-[length:200%_100%] animate-shimmer" />
    </div>
  </div>
);

export const Shimmer = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "rounded-lg bg-gradient-to-r from-surface-elevated via-muted to-surface-elevated bg-[length:200%_100%] animate-shimmer",
      className
    )}
  />
);
