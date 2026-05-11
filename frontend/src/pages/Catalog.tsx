import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RarityBadge } from "@/components/RarityBadge";
import { CardSkeleton } from "@/components/Skeletons";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { cardApi, marketApi, type TcgSearchResult, type MarketCard, type PricePoint } from "@/lib/api";
import { usePortfolios, type Condition } from "@/store/usePortfolios";
import { formatCurrency } from "@/lib/format";
import { modal } from "@/store/useAppModal";
import {
  Search, Plus, Minus, ChevronLeft, ChevronRight, Loader2,
  TrendingUp, Flame, Sparkles, BarChart2, ShoppingCart,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";

// ─── Badge de idioma do card ──────────────────────────────────────────────────

const LANG_BADGE: Record<string, { label: string; cls: string }> = {
  JP:     { label: "日本語",  cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  POCKET: { label: "Pocket", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  PT:     { label: "PT",     cls: "bg-green-500/15 text-green-400 border-green-500/30" },
};

const LangBadge = ({ lang }: { lang?: string }) => {
  if (!lang || lang === "EN") return null;
  const cfg = LANG_BADGE[lang];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

// ─── Thumb das métricas de mercado ───────────────────────────────────────────

const MarketCardThumb = ({
  card, rank, badge, currency, onClick,
}: {
  card: MarketCard;
  rank?: number;
  badge?: React.ReactNode;
  currency: "BRL" | "USD";
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group flex items-center gap-3 glass-panel p-3 rounded-xl hover:border-primary/50 transition-all text-left w-full"
  >
    {rank && (
      <span className="text-xs font-display font-bold text-muted-foreground w-5 shrink-0">
        #{rank}
      </span>
    )}
    <div className="h-14 w-10 rounded-lg overflow-hidden bg-surface-elevated shrink-0">
      {card.imageUrl ? (
        <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="w-full h-full bg-surface-elevated" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-sm leading-tight truncate">{card.name}</p>
      <p className="text-xs text-muted-foreground truncate">{card.setName}</p>
      {badge}
    </div>
    {card.marketPriceBrl != null && (
      <p className="font-display font-bold text-sm text-primary shrink-0">
        {formatCurrency(card.marketPriceBrl, currency)}
      </p>
    )}
  </button>
);

// ─── Tooltip customizado do gráfico ──────────────────────────────────────────

const PriceTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel px-3 py-2 text-xs space-y-0.5 border border-primary/30">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-display font-bold text-primary">
        {formatCurrency(payload[0].value, "BRL")}
      </p>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const Catalog = () => {
  const { portfolios, activePortfolioId, addItem, fetchPortfolios, currency } = usePortfolios();

  const [query, setQuery]           = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [results, setResults]       = useState<TcgSearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage]             = useState(1);
  const [sortOrder, setSortOrder]   = useState<"none" | "asc" | "desc">("none");
  const [langFilter, setLangFilter] = useState<"ALL" | "EN" | "JP" | "PT">("ALL");
  const [loading, setLoading]       = useState(false);
  const [selected, setSelected]     = useState<TcgSearchResult | null>(null);
  const [modalTab, setModalTab]     = useState<"add" | "market" | "chart">("add");
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDays, setHistoryDays] = useState<30 | 60 | 90 | 120>(90);
  const [zoomImage, setZoomImage]   = useState<string | null>(null);
  const [market, setMarket] = useState<{ topValued: MarketCard[]; popular: MarketCard[]; recent: MarketCard[] } | null>(null);
  const [marketLoading, setMarketLoading] = useState(true);

  // add-to-portfolio state
  const [targetPortfolio, setTargetPortfolio] = useState<string>("");
  const [qty, setQty]                         = useState(1);
  const [condition, setCondition]             = useState<Condition>("NM");
  const [foil, setFoil]                       = useState(false);
  const [purchasePrice, setPurchasePrice]     = useState<string>("");
  const [adding, setAdding]                   = useState(false);

  const PAGE_SIZE = 48;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filtragem e ordenação no cliente (resultados já carregados)
  const displayedResults = (() => {
    let filtered = results;
    if (langFilter !== "ALL") {
      filtered = filtered.filter((c) => {
        const lang = c.lang ?? "EN";
        if (langFilter === "EN") return lang === "EN";
        if (langFilter === "JP") return lang === "JP";
        if (langFilter === "PT") return lang === "PT";
        return true;
      });
    }
    if (sortOrder !== "none") {
      filtered = [...filtered].sort((a, b) => {
        const pa = a.marketPriceBrl ?? a.marketPriceUsd ?? -1;
        const pb = b.marketPriceBrl ?? b.marketPriceUsd ?? -1;
        return sortOrder === "asc" ? pa - pb : pb - pa;
      });
    }
    return filtered;
  })();

  useEffect(() => {
    if (portfolios.length === 0) fetchPortfolios();
    marketApi.top()
      .then(({ data }) => setMarket(data))
      .catch(() => {})
      .finally(() => setMarketLoading(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(query.trim());
      setPage(1);
      setSortOrder("none");
      setLangFilter("ALL");
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    if (debouncedQ.length < 2) {
      setResults([]);
      setTotalCount(0);
      return;
    }
    let cancelled = false;
    setLoading(true);
    cardApi.search(debouncedQ, page, PAGE_SIZE)
      .then(({ data }) => {
        if (!cancelled) {
          setResults(data.cards);
          setTotalCount(data.totalCount);
        }
      })
      .catch(() => {
        if (!cancelled) modal.error("Erro", "Falha ao buscar cartas. Tente novamente.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQ, page]);

  // Carrega histórico quando muda para aba de gráfico ou período
  useEffect(() => {
    if (!selected || modalTab !== "chart") return;
    // Cards MYP-only não têm histórico — skip se tcgId começa com myp__
    if (/^myp__\d+__(PT|JP)$/.test(selected.tcgId)) { setHistoryLoading(false); return; }
    const realTcgId = selected.tcgId.replace(/__PT$/, "");
    setHistoryLoading(true);
    cardApi.priceHistory(realTcgId, historyDays)
      .then(({ data }) => setPriceHistory(data))
      .catch(() => setPriceHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [selected?.tcgId, modalTab, historyDays]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const openCard = (card: TcgSearchResult | MarketCard) => {
    setSelected(card as TcgSearchResult);
    setModalTab("add");
    setPriceHistory([]);
    setHistoryDays(90);
    setTargetPortfolio(activePortfolioId ?? portfolios.find((p) => p.isDefault)?._id ?? portfolios[0]?._id ?? "");
    setQty(1);
    setCondition("NM");
    setFoil(false);
    setPurchasePrice("");
  };

  const handleAdd = async () => {
    if (!selected || !targetPortfolio) return;
    setAdding(true);
    try {
      const pp = purchasePrice ? parseFloat(purchasePrice.replace(",", ".")) : null;
      // Cards MYP-only mantêm o tcgId completo; cards com __PT suffix usam o ID base
      const isMypOnly = /^myp__\d+__(PT|JP)$/.test(selected.tcgId);
      const realTcgId = isMypOnly ? selected.tcgId : selected.tcgId.replace(/__PT$/, "");
      await addItem(targetPortfolio, realTcgId, qty, condition, foil, "", pp ?? null,
        isMypOnly ? selected : undefined);
      modal.success(`${selected.name} adicionada!`, "Carta incluída no portfolio.");
      setSelected(null);
    } catch {
      modal.error("Erro", "Não foi possível adicionar a carta.");
    } finally {
      setAdding(false);
    }
  };

  // Métricas derivadas do histórico
  const historyMetrics = (() => {
    if (priceHistory.length < 2) return null;
    const first = priceHistory[0].priceBrl;
    const last  = priceHistory[priceHistory.length - 1].priceBrl;
    const min   = Math.min(...priceHistory.map((p) => p.priceBrl));
    const max   = Math.max(...priceHistory.map((p) => p.priceBrl));
    const totalPct = first > 0 ? ((last - first) / first) * 100 : 0;
    return { first, last, min, max, totalPct };
  })();

  const chartData = priceHistory.map((p) => ({
    date: new Date(p.recordedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    price: p.priceBrl,
  }));

  const rarityMap: Record<string, "common" | "uncommon" | "rare" | "holo" | "ultra" | "secret"> = {
    "Common": "common",
    "Uncommon": "uncommon",
    "Rare": "rare",
    "Rare Holo": "holo",
    "Rare Holo EX": "holo",
    "Rare Holo GX": "holo",
    "Rare Holo V": "holo",
    "Rare Holo VMAX": "ultra",
    "Rare Holo VSTAR": "ultra",
    "Rare Ultra": "ultra",
    "Ultra Rare": "ultra",
    "Illustration Rare": "ultra",
    "Special Illustration Rare": "secret",
    "Hyper Rare": "secret",
    "Secret Rare": "secret",
    "Promo": "holo",
    "Amazing Rare": "ultra",
    "Rare Rainbow": "secret",
    "Rare Shiny": "ultra",
    "Rare Shiny GX": "secret",
    "Shiny Rare": "ultra",
    "Shiny Ultra Rare": "secret",
  };

  return (
    <div className="container pt-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-bold">Catálogo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explore cartas do Pokémon TCG e acompanhe o mercado BR
        </p>
      </div>

      {/* Search — no topo */}
      <div className="glass-panel p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou número (ex: Fearow, 046/132, 046)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 surface-elevated border-border/70 h-11 text-base"
            autoFocus
          />
        </div>
        {debouncedQ.length >= 2 && !loading && (
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
            <p className="text-xs text-muted-foreground pl-1">
              {displayedResults.length !== totalCount
                ? `${displayedResults.length} de ${totalCount} resultado${totalCount !== 1 ? "s" : ""} para "${debouncedQ}"`
                : `${totalCount} resultado${totalCount !== 1 ? "s" : ""} para "${debouncedQ}"`}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro de idioma */}
              <div className="flex rounded-lg overflow-hidden border border-border/60 text-[11px] font-semibold">
                {(["ALL", "EN", "JP", "PT"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLangFilter(l)}
                    className={`px-2.5 py-1 transition-colors ${
                      langFilter === l
                        ? "bg-primary text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {/* Ordenação por preço */}
              <div className="flex rounded-lg overflow-hidden border border-border/60 text-[11px] font-semibold">
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "none" : "asc")}
                  className={`px-2.5 py-1 transition-colors flex items-center gap-1 ${
                    sortOrder === "asc"
                      ? "bg-primary text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                  }`}
                >
                  ↑ Preço
                </button>
                <button
                  onClick={() => setSortOrder(sortOrder === "desc" ? "none" : "desc")}
                  className={`px-2.5 py-1 border-l border-border/60 transition-colors flex items-center gap-1 ${
                    sortOrder === "desc"
                      ? "bg-primary text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                  }`}
                >
                  ↓ Preço
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Métricas de mercado — abaixo do buscador, visíveis quando não há busca ativa */}
      {!debouncedQ && (marketLoading || market) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Mais valiosas */}
          <div className="glass-panel p-4 space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-border/40">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="font-display font-bold text-sm">Mais valiosas</h2>
            </div>
            {marketLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-14 w-10 rounded-lg bg-surface-elevated" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-surface-elevated rounded w-3/4" />
                      <div className="h-2.5 bg-surface-elevated rounded w-1/2" />
                    </div>
                  </div>
                ))
              : market?.topValued.slice(0, 5).map((card, i) => (
                  <MarketCardThumb
                    key={card.tcgId}
                    card={card}
                    rank={i + 1}
                    currency={currency}
                    onClick={() => openCard(card)}
                  />
                ))
            }
          </div>

          {/* Mais populares na plataforma */}
          <div className="glass-panel p-4 space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-border/40">
              <Flame className="h-4 w-4 text-orange-400" />
              <h2 className="font-display font-bold text-sm">Mais colecionadas</h2>
            </div>
            {marketLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-14 w-10 rounded-lg bg-surface-elevated" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-surface-elevated rounded w-3/4" />
                      <div className="h-2.5 bg-surface-elevated rounded w-1/2" />
                    </div>
                  </div>
                ))
              : market?.popular.slice(0, 5).map((card, i) => (
                  <MarketCardThumb
                    key={card.tcgId}
                    card={card}
                    rank={i + 1}
                    currency={currency}
                    badge={
                      card.totalQty ? (
                        <p className="text-[10px] text-orange-400 font-medium mt-0.5">
                          {card.totalQty} na plataforma
                        </p>
                      ) : undefined
                    }
                    onClick={() => openCard(card)}
                  />
                ))
            }
          </div>

          {/* Adicionadas recentemente */}
          <div className="glass-panel p-4 space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-border/40">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <h2 className="font-display font-bold text-sm">Recém adicionadas</h2>
            </div>
            {marketLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-14 w-10 rounded-lg bg-surface-elevated" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-surface-elevated rounded w-3/4" />
                      <div className="h-2.5 bg-surface-elevated rounded w-1/2" />
                    </div>
                  </div>
                ))
              : market?.recent.slice(0, 5).map((card) => (
                  <MarketCardThumb
                    key={card.tcgId}
                    card={card}
                    currency={currency}
                    onClick={() => openCard(card)}
                  />
                ))
            }
          </div>

        </div>
      )}

      {/* Estado inicial — só aparece quando não há busca e não há métricas */}
      {debouncedQ.length < 2 && !loading && !marketLoading && !market && (
        <div className="glass-panel p-14 text-center space-y-4">
          <div className="relative h-28 w-28 mx-auto opacity-60">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <circle cx="50" cy="50" r="46" fill="hsl(240 17% 15%)" stroke="hsl(240 10% 30%)" strokeWidth="3" />
              <path d="M 4,50 A 46,46 0 0 1 96,50 Z" fill="hsl(48 100% 50% / 0.3)" />
              <rect x="4" y="48" width="92" height="4" fill="hsl(240 22% 6%)" />
              <circle cx="50" cy="50" r="11" fill="hsl(240 17% 11%)" stroke="hsl(240 10% 35%)" strokeWidth="2.5" />
              <circle cx="50" cy="50" r="5" fill="hsl(240 10% 28%)" />
            </svg>
          </div>
          <div>
            <p className="font-display text-lg font-bold">Busque uma carta para começar</p>
            <p className="text-sm text-muted-foreground mt-1">
              Digite o nome ou número da carta (ex: 046/132)
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {/* Sem resultados */}
      {!loading && debouncedQ.length >= 2 && results.length === 0 && (
        <div className="glass-panel p-12 text-center space-y-4">
          <p className="font-display text-lg font-bold">Nenhuma carta encontrada</p>
          <p className="text-sm text-muted-foreground">Tente outro nome ou número (ex: 046, 046/132)</p>
        </div>
      )}

      {/* Grid de resultados */}
      {!loading && results.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayedResults.map((card) => (
              <button
                key={card.tcgId}
                onClick={() => openCard(card)}
                className="group glass-panel p-2 rounded-xl flex flex-col gap-2 text-left hover:border-primary/50 transition-all"
              >
                <div className="aspect-[63/88] rounded-lg overflow-hidden bg-surface-elevated relative">
                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      Sem imagem
                    </div>
                  )}
                </div>
                <div className="px-1 pb-1">
                  <p className="font-semibold text-xs leading-tight line-clamp-1">{card.name}</p>
                  {card.number && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">
                      {card.number}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/50 truncate">{card.setName}</p>
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    <RarityBadge rarity={rarityMap[card.rarity] ?? "common"} />
                    <LangBadge lang={card.lang} />
                  </div>
                  {card.marketPriceBrl != null ? (
                    <p className="font-display text-xs font-bold text-primary mt-1">
                      {formatCurrency(card.marketPriceBrl, "BRL")}
                    </p>
                  ) : card.marketPriceUsd != null ? (
                    <p className="font-display text-xs font-bold text-primary mt-1">
                      US$ {card.marketPriceUsd.toFixed(2)}
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground mt-1">Sem preço</p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modal de detalhes */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="bg-card border-border/70 w-[95vw] max-w-md p-0 overflow-hidden gap-0 flex flex-col max-h-[90vh]">
          {selected && (
            <>
              {/* Header compacto: imagem clicável + info */}
              <div className="flex gap-3 p-4 pb-3 border-b border-border/50 shrink-0">
                <button
                  onClick={() => setZoomImage(selected.imageUrlHiRes || selected.imageUrl)}
                  className="w-16 shrink-0 aspect-[63/88] rounded-lg overflow-hidden bg-surface-elevated border border-border/60 hover:border-primary/50 transition-colors group relative"
                  title="Ver carta completa"
                >
                  {selected.imageUrl ? (
                    <img src={selected.imageUrl} alt={selected.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">—</div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <RarityBadge rarity={rarityMap[selected.rarity] ?? "common"} />
                    <LangBadge lang={selected.lang} />
                  </div>
                  <h2 className="font-display font-bold text-sm leading-tight mt-0.5 line-clamp-1">{selected.name}</h2>
                  <p className="text-[10px] text-muted-foreground truncate">{selected.setName} · {selected.number}</p>
                  <div className="flex gap-2 mt-0.5 text-[10px] text-muted-foreground flex-wrap">
                    {selected.types?.length > 0 && <span>{selected.types.join(", ")}</span>}
                    {selected.hp && <span>HP {selected.hp}</span>}
                  </div>
                  {(selected.marketPriceBrl != null || selected.marketPriceUsd != null) && (
                    <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
                      <p className="font-display text-base font-bold text-gradient-gold leading-none">
                        {selected.marketPriceBrl != null
                          ? formatCurrency(selected.marketPriceBrl, "BRL")
                          : `US$ ${selected.marketPriceUsd!.toFixed(2)}`}
                      </p>
                      {selected.marketPriceBrl != null && (
                        <span className="text-[9px] text-muted-foreground">floor MYP</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs uniformes */}
              <div className="flex border-b border-border/50 shrink-0">
                {(["add", "market", "chart"] as const).map((tab) => {
                  const cfg = {
                    add:    { icon: <ShoppingCart className="h-3 w-3" />, label: "Adicionar" },
                    market: { icon: <TrendingUp className="h-3 w-3" />,   label: "Mercado" },
                    chart:  { icon: <BarChart2 className="h-3 w-3" />,    label: "Histórico" },
                  }[tab];
                  return (
                    <button
                      key={tab}
                      onClick={() => setModalTab(tab)}
                      className={`flex-1 py-2 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors ${
                        modalTab === tab
                          ? "text-primary border-b-2 border-primary bg-primary/5"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </button>
                  );
                })}
              </div>

              {/* Conteúdo com scroll */}
              <div className="overflow-y-auto flex-1 min-h-0">

                {/* Tab: Adicionar ao portfolio */}
                {modalTab === "add" && (
                  <div className="p-4 space-y-3">
                    {portfolios.length > 1 && (
                      <div className="space-y-1">
                        <Label className="text-xs">Portfolio</Label>
                        <Select value={targetPortfolio} onValueChange={setTargetPortfolio}>
                          <SelectTrigger className="surface-elevated border-border/70 h-9 text-sm">
                            <SelectValue placeholder="Selecione um portfolio" />
                          </SelectTrigger>
                          <SelectContent>
                            {portfolios.map((p) => (
                              <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Quantidade</Label>
                        <div className="flex items-center surface-elevated rounded-lg border border-border/70 h-9">
                          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-2.5 h-full text-muted-foreground hover:text-primary transition-colors">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="flex-1 text-center font-display font-semibold text-sm">{qty}</span>
                          <button type="button" onClick={() => setQty((q) => q + 1)} className="px-2.5 h-full text-muted-foreground hover:text-primary transition-colors">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Condição</Label>
                        <Select value={condition} onValueChange={(v) => setCondition(v as Condition)}>
                          <SelectTrigger className="surface-elevated border-border/70 h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mint">Mint</SelectItem>
                            <SelectItem value="NM">Near Mint</SelectItem>
                            <SelectItem value="LP">Lightly Played</SelectItem>
                            <SelectItem value="MP">Moderately Played</SelectItem>
                            <SelectItem value="HP">Heavily Played</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between surface-elevated rounded-lg border border-border/70 px-3 py-2">
                      <Label htmlFor="foil-cat" className="cursor-pointer text-sm">Foil / Holográfica</Label>
                      <Switch id="foil-cat" checked={foil} onCheckedChange={setFoil} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="purchase-price" className="text-xs">
                        Preço pago <span className="text-muted-foreground font-normal">(BRL, opcional)</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                        <input
                          id="purchase-price"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0,00"
                          value={purchasePrice}
                          onChange={(e) => setPurchasePrice(e.target.value)}
                          className="w-full h-9 pl-9 pr-3 rounded-lg surface-elevated border border-border/70 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full bg-gradient-gold text-background font-semibold hover:opacity-90 hover:shadow-glow-gold h-9"
                      onClick={handleAdd}
                      disabled={adding || !targetPortfolio}
                    >
                      {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      {adding ? "Adicionando…" : "Adicionar ao portfolio"}
                    </Button>
                  </div>
                )}

                {/* Tab: Dados de mercado MYP */}
                {modalTab === "market" && (
                  <div className="p-4 space-y-3">
                    {!selected.mypAvg && !selected.mypAvailableQty && selected.priceSource !== "mypcards" ? (
                      <div className="py-8 text-center space-y-2 text-muted-foreground">
                        <TrendingUp className="h-9 w-9 mx-auto opacity-40" />
                        <p className="font-display font-bold text-sm">Sem dados BR</p>
                        <p className="text-xs">Esta carta não tem cotação no MYP Cards.</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Floor (mín)", value: selected.marketPriceBrl != null ? formatCurrency(selected.marketPriceBrl, "BRL") : "—", cls: "text-primary" },
                            { label: "Média", value: selected.mypAvg != null ? formatCurrency(selected.mypAvg, "BRL") : "—", cls: "" },
                            { label: "Máximo", value: selected.marketPriceBrlMax != null ? formatCurrency(selected.marketPriceBrlMax, "BRL") : "—", cls: "text-yellow-400" },
                          ].map(({ label, value, cls }) => (
                            <div key={label} className="surface-elevated rounded-lg p-2.5 border border-border/60 text-center">
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                              <p className={`font-display font-bold text-sm ${cls}`}>{value}</p>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="surface-elevated rounded-lg p-2.5 border border-border/60">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Ref. TCG (USD)</p>
                            <p className="font-display font-bold text-sm mt-0.5">
                              {selected.mypTcgPriceUsd != null ? `US$ ${selected.mypTcgPriceUsd.toFixed(2)}` : "—"}
                            </p>
                          </div>
                          <div className="surface-elevated rounded-lg p-2.5 border border-border/60">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Disponíveis</p>
                            <p className="font-display font-bold text-sm mt-0.5">
                              {selected.mypAvailableQty != null ? selected.mypAvailableQty.toLocaleString("pt-BR") : "—"}
                            </p>
                          </div>
                        </div>
                        {(selected.editionEn || selected.editionPt) && (
                          <div className="surface-elevated rounded-lg p-2.5 border border-border/60 space-y-0.5">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Edição</p>
                            {selected.editionEn && <p className="text-xs"><span className="text-muted-foreground">EN:</span> {selected.editionEn}</p>}
                            {selected.editionPt && <p className="text-xs"><span className="text-muted-foreground">PT:</span> {selected.editionPt}</p>}
                          </div>
                        )}
                        {selected.mypLink && (
                          <a
                            href={selected.mypLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full rounded-lg border border-border/60 py-2 text-xs text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors surface-elevated"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            Ver no MYP Cards
                          </a>
                        )}
                        <p className="text-[10px] text-muted-foreground text-center">
                          Preços em tempo real via MYP Cards · floor = menor listagem ativa
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Tab: Histórico de preço */}
                {modalTab === "chart" && (
                  <div className="p-4 space-y-3">
                    <div className="flex gap-1.5 justify-end">
                      {([30, 60, 90, 120] as const).map((d) => (
                        <button
                          key={d}
                          onClick={() => setHistoryDays(d)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            historyDays === d
                              ? "bg-primary text-background"
                              : "surface-elevated border border-border/60 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                    {historyLoading ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <p className="text-sm">Carregando…</p>
                      </div>
                    ) : priceHistory.length === 0 ? (
                      <div className="py-8 text-center space-y-2">
                        <BarChart2 className="h-9 w-9 mx-auto text-muted-foreground/40" />
                        <p className="font-display font-bold text-sm">Sem histórico ainda</p>
                        <p className="text-xs text-muted-foreground">
                          Histórico construído diariamente via MYP Cards. 1 ponto por dia.
                        </p>
                      </div>
                    ) : (
                      <>
                        {historyMetrics && (
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: "Inicial", value: formatCurrency(historyMetrics.first, "BRL"), cls: "" },
                              { label: "Atual", value: formatCurrency(historyMetrics.last, "BRL"), cls: "" },
                              { label: "Mínimo", value: formatCurrency(historyMetrics.min, "BRL"), cls: "text-blue-400" },
                              { label: "Máximo", value: formatCurrency(historyMetrics.max, "BRL"), cls: "text-yellow-400" },
                            ].map(({ label, value, cls }) => (
                              <div key={label} className="surface-elevated rounded-lg p-2.5 border border-border/60">
                                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</p>
                                <p className={`font-display font-bold text-sm mt-0.5 ${cls}`}>{value}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {historyMetrics && (
                          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 border text-xs ${
                            historyMetrics.totalPct >= 0
                              ? "bg-green-500/10 border-green-500/30 text-green-400"
                              : "bg-red-500/10 border-red-500/30 text-red-400"
                          }`}>
                            {historyMetrics.totalPct >= 0
                              ? <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                              : <ArrowDownRight className="h-3.5 w-3.5 shrink-0" />}
                            <span className="font-semibold">
                              {historyMetrics.totalPct >= 0 ? "+" : ""}{historyMetrics.totalPct.toFixed(1)}% no período
                            </span>
                            <span className="opacity-60 ml-auto">{priceHistory.length}pts</span>
                          </div>
                        )}
                        <div className="h-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                              <defs>
                                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(48 100% 50%)" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="hsl(48 100% 50%)" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 25% / 0.4)" />
                              <XAxis dataKey="date" tick={{ fontSize: 8, fill: "hsl(240 10% 55%)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                              <YAxis tick={{ fontSize: 8, fill: "hsl(240 10% 55%)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v.toFixed(0)}`} />
                              <Tooltip content={<PriceTooltip />} />
                              <Area type="monotone" dataKey="price" stroke="hsl(48 100% 50%)" strokeWidth={2} fill="url(#priceGrad)" dot={false} activeDot={{ r: 3, fill: "hsl(48 100% 50%)" }} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center">
                          Floor BRL · MYP Cards · 1 snapshot/dia
                        </p>
                      </>
                    )}
                  </div>
                )}

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de zoom da imagem do card */}
      <Dialog open={!!zoomImage} onOpenChange={(v) => !v && setZoomImage(null)}>
        <DialogContent className="bg-black/90 border-border/40 max-w-sm w-auto p-4 flex flex-col items-center gap-4">
          {zoomImage && (
            <img
              src={zoomImage}
              alt="Card art"
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl shadow-[0_0_60px_-10px_rgba(0,0,0,0.8)]"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Catalog;
