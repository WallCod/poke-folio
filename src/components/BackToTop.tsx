import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <button
      type="button"
      aria-label="Voltar ao topo"
      onClick={scrollTop}
      className={cn(
        "fixed bottom-24 right-8 md:bottom-8 md:right-8 z-50",
        "h-12 w-12 rounded-full flex items-center justify-center",
        "bg-card/90 backdrop-blur border border-primary/40 text-primary",
        "shadow-glow-gold hover:bg-primary hover:text-background",
        "transition-all duration-300",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none"
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
};
