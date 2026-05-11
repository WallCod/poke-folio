import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";

interface TcgSet {
  id: string;
  name: string;
  series: string;
  releaseDate: string;
  total: number;
  logo: string | null;
  symbol: string | null;
}

function SetCard({ set }: { set: TcgSet }) {
  const [logoErr, setLogoErr] = useState(false);
  const year = set.releaseDate?.split("-")[0] ?? "";
  return (
    <Link to={`/sets/${set.id}`} className="group block h-full">
      <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border/50 bg-card/50 hover:bg-card/80 hover:border-primary/30 hover:shadow-[0_0_20px_-8px_hsl(48_100%_50%/0.3)] transition-all duration-200 h-full">
        <div className="h-10 flex items-center justify-center w-full">
          {set.logo && !logoErr ? (
            <img
              src={set.logo}
              alt={set.name}
              className="max-h-8 max-w-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
              onError={() => setLogoErr(true)}
            />
          ) : (
            <p className="text-xs font-bold text-muted-foreground text-center line-clamp-2">{set.name}</p>
          )}
        </div>
        <div className="text-center w-full">
          {set.logo && !logoErr && (
            <p className="text-[10px] text-muted-foreground truncate">{set.name}</p>
          )}
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            {set.symbol && (
              <img src={set.symbol} alt="" className="h-3 w-3 object-contain opacity-50" />
            )}
            <p className="text-[10px] text-muted-foreground/60">{year} · {set.total} cartas</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

const Sets = () => {
  const [sets, setSets] = useState<TcgSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [seriesFilter, setSeriesFilter] = useState("all");
  const [search, setSearch] = useState("");

  const baseUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3001/api").replace(/\/api$/, "");

  useEffect(() => {
    fetch(`${baseUrl}/api/public/sets`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setSets(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allSeries = Array.from(new Set(sets.map((s) => s.series))).filter(Boolean);

  const filtered = sets.filter((s) => {
    const seriesOk = seriesFilter === "all" || s.series === seriesFilter;
    const searchOk = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.series.toLowerCase().includes(search.toLowerCase());
    return seriesOk && searchOk;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />

      <div className="container py-8 flex-1">

        {/* Título */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Todos os Sets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Carregando..." : `${sets.length} sets disponíveis · clique para ver as cartas`}
          </p>
        </div>

        {/* Search + filtros */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Busca */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar set por nome ou série..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-border/60 bg-card/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>

          {/* Filtros de série */}
          {allSeries.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSeriesFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  seriesFilter === "all"
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                Todos
              </button>
              {allSeries.map((s) => (
                <button
                  key={s}
                  onClick={() => setSeriesFilter(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    seriesFilter === s
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contagem */}
        {!loading && (
          <p className="text-xs text-muted-foreground mb-4">
            {filtered.length === sets.length
              ? `${sets.length} sets`
              : `${filtered.length} de ${sets.length} sets`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="aspect-[1/1.1] rounded-xl bg-card/40 animate-pulse border border-border/30" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>Nenhum set encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {filtered.map((set) => (
              <SetCard key={set.id} set={set} />
            ))}
          </div>
        )}
      </div>

      <PublicFooter />
    </div>
  );
};

export default Sets;
