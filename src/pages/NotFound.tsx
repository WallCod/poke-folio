import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: rota inexistente:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, hsl(48 100% 50% / 0.10), transparent 70%)",
        }}
      />

      <div className="relative text-center max-w-md animate-fade-in">
        {/* Open Pokeball */}
        <div className="mx-auto mb-8 relative h-32 w-32">
          <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_0_25px_hsl(48_100%_50%/0.35)]">
            {/* Top half (tilted left) */}
            <g transform="rotate(-25 30 40)">
              <path
                d="M 5,50 A 45,45 0 0 1 95,50 L 60,50 A 10,10 0 0 0 40,50 Z"
                fill="hsl(0 70% 55%)"
                stroke="hsl(240 22% 6%)"
                strokeWidth="3"
              />
            </g>
            {/* Bottom half (tilted right) */}
            <g transform="rotate(25 70 60)">
              <path
                d="M 5,50 L 40,50 A 10,10 0 0 0 60,50 L 95,50 A 45,45 0 0 1 5,50 Z"
                fill="hsl(240 17% 96%)"
                stroke="hsl(240 22% 6%)"
                strokeWidth="3"
              />
            </g>
            {/* Center button floating */}
            <circle cx="50" cy="50" r="8" fill="hsl(48 100% 50%)" stroke="hsl(240 22% 6%)" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="3" fill="hsl(240 17% 96%)" />
          </svg>
        </div>

        <h1 className="font-display text-7xl md:text-8xl font-bold text-gradient-gold leading-none">
          404
        </h1>
        <p className="font-display text-2xl font-bold mt-4">
          Esse Pokémon fugiu...
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          A página <span className="text-foreground">{location.pathname}</span> não existe ou foi movida.
        </p>

        <Button
          asChild
          className="mt-8 bg-gradient-gold text-background font-semibold hover:opacity-90 hover:shadow-glow-gold"
        >
          <Link to="/">
            <Home className="h-4 w-4" /> Voltar para a home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
