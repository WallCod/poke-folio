import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export const Logo = ({ className, to = "/" }: { className?: string; to?: string }) => (
  <Link
    to={to}
    aria-label="Pokéfolio"
    className={cn("flex items-center gap-2 group", className)}
  >
    <div className="relative h-8 w-8 rounded-full bg-gradient-gold flex items-center justify-center shadow-glow-gold">
      <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-background/90" />
      <div className="relative h-3 w-3 rounded-full bg-background border-[2px] border-background z-10" />
    </div>
    <span className="font-display font-bold text-lg tracking-wide">
      Poké<span className="text-gradient-gold">folio</span>
    </span>
    <Sparkles className="h-3.5 w-3.5 text-primary/70 animate-float" />
  </Link>
);
