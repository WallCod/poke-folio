import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RarityBadge } from "@/components/RarityBadge";
import { usePortfolios } from "@/store/usePortfolios";
import { usePricePolling } from "@/hooks/usePricePolling";
import { formatCurrency } from "@/lib/format";
import { getSession } from "@/lib/auth";
import {
  Library, Wallet, TrendingUp, TrendingDown, FolderOpen,
  RefreshCw, Plus, Star, ArrowUpRight, BarChart3, Zap,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const rarityWeight: Record<string, number> = {
  "Secret Rare": 6, "Hyper Rare": 6, "Special Illustration Rare": 6,
  "Ultra Rare": 5, "Rare Rainbow": 5, "Illustration Rare": 4,
  "Rare Holo VMAX": 4, "Rare Holo VSTAR": 4,
  "Rare Holo": 3, "Rare Holo EX": 3, "Rare Holo GX": 3, "Rare Holo V": 3,
  "Amazing Rare": 3, "Rare Shiny GX": 3,
  "Rare": 2, "Rare Shiny": 2, "Shiny Rare": 2,
  "Uncommon": 1, "Common": 0, "Promo": 1,
};

const rarityMap: Record<string, "common" | "uncommon" | "rare" | "holo" | "ultra" | "secret"> = {
  "Common": "common", "Uncommon": "uncommon", "Rare": "rare",
  "Rare Holo": "holo", "Rare Holo EX": "holo", "Rare Holo GX": "holo",
  "Rare Holo V": "holo", "Rare Holo VMAX": "ultra", "Rare Holo VSTAR": "ultra",
  "Rare Ultra": "ultra", "Ultra Rare": "ultra", "Illustration Rare": "ultra",
  "Special Illustration Rare": "secret", "Hyper Rare": "secret", "Secret Rare": "secret",
  "Promo": "holo", "Amazing Rare": "ultra", "Rare Rainbow": "secret",
};

const PnlBadge = ({ value, pct }: { value: number; pct: number | null }) => (
  <span className={cn(
    "inline-flex items-center gap-1 text-xs font-bold",
    value >= 0 ? "text-emerald-400" : "text-red-400"
  )}>
    {value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
    {value >= 0 ? "+" : ""}{formatCurrency(value, "BRL")}
    {pct !== null && <span className="opacity-70">({value >= 0 ? "+" : ""}{pct.toFixed(1)}%)</span>}
  </span>
);

const Dashboard = () => {
  const {
    portfolios, activePortfolioId, items, currency,
    loadingItems, loadingPortfolios, fetchPortfolios, fetchItems, fetchAllItems, setActivePortfolio,
  } = usePortfolios();

  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("all");
  usePricePolling();

  useEffect(() => {
    if (portfolios.length === 0) {
      fetchPortfolios().then(() => {
        fetchAllItems();
      });
    } else {
      fetchAllItems();
    }
  }, []);

  const handleSelectPortfolio = (val: string) => {
    setSelectedPortfolioId(val);
    if (val !== "all") {
      setActivePortfolio(val);
    } else {
      fetchAllItems();
    }
  };

  const session = getSession();

  // Métricas agregadas
  const totalCards = selectedPortfolioId === "all"
    ? portfolios.reduce((s, p) => s + p.totalCards, 0)
    : items.reduce((s, i) => s + i.quantity, 0);

  const totalValueBrl = selectedPortfolioId === "all"
    ? portfolios.reduce((s, p) => s + p.totalValueBrl, 0)
    : items.reduce((s, i) => s + (i.cardId.marketPriceBrl ?? 0) * i.quantity, 0);

  // Ganho/Perda total — baseado em preço de compra vs preço atual
  const itemsWithPurchase = items.filter((i) => i.purchasePrice != null && i.purchasePrice > 0);
  const totalInvested = itemsWithPurchase.reduce((s, i) => s + i.purchasePrice! * i.quantity, 0);
  const totalCurrentOfInvested = itemsWithPurchase.reduce(
    (s, i) => s + (i.cardId.marketPriceBrl ?? i.purchasePrice!) * i.quantity, 0
  );
  const totalGainLoss = totalCurrentOfInvested - totalInvested;
  const totalGainPct = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : null;
  const hasPnlData = itemsWithPurchase.length > 0;

  // Destaque do dia — carta do portfolio com maior variação positiva no último refresh de preço
  const bestToday = items
    .filter((i) => i.cardId.priceChangePct != null)
    .map((i) => ({
      name: i.cardId.name,
      imageUrl: i.cardId.imageUrl,
      changePct: i.cardId.priceChangePct!,
      changeAbs: i.cardId.previousPriceBrl != null && i.cardId.marketPriceBrl != null
        ? (i.cardId.marketPriceBrl - i.cardId.previousPriceBrl) * i.quantity
        : null,
    }))
    .sort((a, b) => b.changePct - a.changePct)[0] ?? null;

  // Top performer (maior % de ganho em relação ao preço de compra)
  const topPerformer = itemsWithPurchase.length > 0
    ? itemsWithPurchase
        .map((i) => ({
          name: i.cardId.name,
          pct: ((i.cardId.marketPriceBrl ?? i.purchasePrice!) - i.purchasePrice!) / i.purchasePrice! * 100,
          gain: ((i.cardId.marketPriceBrl ?? i.purchasePrice!) - i.purchasePrice!) * i.quantity,
        }))
        .sort((a, b) => b.pct - a.pct)[0]
    : null;

  const isEmpty = items.length === 0 && !loadingItems;
  const rareCount = items.filter((i) => (rarityWeight[i.cardId.rarity] ?? 0) >= 3).length;

  // Tabela de cartas com PNL
  const tableItems = [...items].sort(
    (a, b) => (b.cardId.marketPriceBrl ?? 0) * b.quantity - (a.cardId.marketPriceBrl ?? 0) * a.quantity
  );

  return (
    <div className="container pt-6 space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Bem-vindo{session?.name ? `, ${session.name}` : ""}
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold mt-0.5">Meu Portfolio</h1>
        </div>
        <div className="flex items-center gap-2">
          {!loadingPortfolios && (
            <Select value={selectedPortfolioId} onValueChange={handleSelectPortfolio}>
              <SelectTrigger className="w-[190px] surface-elevated border-border/70 h-9 text-sm">
                <FolderOpen className="h-3.5 w-3.5 mr-1.5 text-primary shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os portfolios</SelectItem>
                {portfolios.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.isDefault && <Star className="h-3 w-3 inline mr-1 text-primary" />}
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Link
            to="/catalog"
            className="h-9 px-3 rounded-lg bg-gradient-gold text-background text-sm font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar carta
          </Link>
        </div>
      </div>

      {/* Ticker row — estilo CoinGecko */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Valor atual */}
        <div className="glass-panel p-4 space-y-0.5 col-span-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Wallet className="h-3 w-3" /> Valor atual
          </p>
          <p className="font-display text-xl md:text-2xl font-bold">
            {loadingItems ? "…" : formatCurrency(totalValueBrl, currency)}
          </p>
        </div>

        {/* Lucro / Perda total vs preço de compra */}
        <div className={cn(
          "glass-panel p-4 space-y-0.5 col-span-1",
          hasPnlData && (totalGainLoss >= 0 ? "border-emerald-500/30" : "border-red-500/30")
        )}>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {hasPnlData && totalGainLoss >= 0
              ? <TrendingUp className="h-3 w-3 text-emerald-400" />
              : <TrendingDown className="h-3 w-3 text-red-400" />}
            Lucro / Perda total
          </p>
          {hasPnlData ? (
            <>
              <p className={cn("font-display text-xl font-bold", totalGainLoss >= 0 ? "text-emerald-400" : "text-red-400")}>
                {totalGainLoss >= 0 ? "+" : ""}{formatCurrency(totalGainLoss, currency)}
              </p>
              {totalGainPct !== null && (
                <p className={cn("text-xs font-semibold", totalGainLoss >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {totalGainLoss >= 0 ? "▲" : "▼"} {Math.abs(totalGainPct).toFixed(1)}% vs compra
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              Informe o preço pago ao adicionar cartas
            </p>
          )}
        </div>

        {/* Destaque do dia — carta com maior variação de preço no último refresh */}
        <div className={cn(
          "glass-panel p-4 space-y-0.5 col-span-1",
          bestToday && (bestToday.changePct >= 0 ? "border-emerald-500/20" : "border-red-500/20")
        )}>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3 text-yellow-400" /> Variação recente
          </p>
          {bestToday ? (
            <div className="flex items-center gap-2 mt-0.5">
              {bestToday.imageUrl && (
                <img src={bestToday.imageUrl} alt={bestToday.name} className="h-9 w-6 object-cover rounded shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-semibold text-xs truncate leading-tight">{bestToday.name}</p>
                <p className={cn("text-sm font-bold", bestToday.changePct >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {bestToday.changePct >= 0 ? "▲ +" : "▼ "}{bestToday.changePct.toFixed(1)}%
                </p>
                {bestToday.changeAbs != null && (
                  <p className="text-[10px] text-muted-foreground">
                    {bestToday.changeAbs >= 0 ? "+" : ""}{formatCurrency(bestToday.changeAbs, currency)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              Aparece após o primeiro refresh de preços
            </p>
          )}
        </div>

        {/* Total de cartas */}
        <div className="glass-panel p-4 space-y-0.5 col-span-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Library className="h-3 w-3" /> Total de cartas
          </p>
          <p className="font-display text-xl md:text-2xl font-bold">{loadingItems ? "…" : totalCards}</p>
          <p className="text-xs text-muted-foreground">{rareCount} raras / ultra</p>
        </div>

        {/* Top performer — maior ganho % vs preço de compra */}
        <div className="glass-panel p-4 space-y-0.5 col-span-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <BarChart3 className="h-3 w-3" /> Melhor do portfolio
          </p>
          {topPerformer ? (
            <>
              <p className="font-semibold text-sm truncate">{topPerformer.name}</p>
              <p className={cn("text-xs font-bold", topPerformer.pct >= 0 ? "text-emerald-400" : "text-red-400")}>
                {topPerformer.pct >= 0 ? "▲" : "▼"} {Math.abs(topPerformer.pct).toFixed(1)}%
                &nbsp;·&nbsp;{topPerformer.gain >= 0 ? "+" : ""}{formatCurrency(topPerformer.gain, currency)}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">Informe preço de compra</p>
          )}
        </div>
      </div>

      {/* Carrossel — adições recentes */}
      {!isEmpty && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-muted-foreground">Adições recentes</p>
            <Link to="/collection" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todas <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[...items]
              .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
              .slice(0, 20)
              .map((item) => (
                <div
                  key={item._id}
                  className="glass-panel p-2 rounded-xl flex flex-col gap-1.5 hover:border-primary/40 transition-colors shrink-0 w-[88px]"
                >
                  <div className="aspect-[63/88] rounded-lg overflow-hidden bg-surface-elevated">
                    {item.cardId.imageUrl
                      ? <img src={item.cardId.imageUrl} alt={item.cardId.name} className="w-full h-full object-cover" loading="lazy" />
                      : <div className="w-full h-full bg-surface-elevated" />
                    }
                  </div>
                  <div className="px-0.5 pb-0.5">
                    <p className="font-semibold text-[10px] leading-tight line-clamp-2">{item.cardId.name}</p>
                    {item.cardId.marketPriceBrl != null
                      ? <p className="font-display text-[10px] font-bold text-primary mt-0.5">{formatCurrency(item.cardId.marketPriceBrl, currency)}</p>
                      : <p className="text-[10px] text-muted-foreground mt-0.5">—</p>
                    }
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Tabela principal */}
      <div className="w-full">
        <div className="mt-0">
          {loadingItems ? (
            <div className="glass-panel p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="h-10 w-7 rounded bg-surface-elevated" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-surface-elevated rounded w-1/3" />
                    <div className="h-2.5 bg-surface-elevated rounded w-1/4" />
                  </div>
                  <div className="h-3 bg-surface-elevated rounded w-20" />
                  <div className="h-3 bg-surface-elevated rounded w-16" />
                </div>
              ))}
            </div>
          ) : isEmpty ? (
            <div className="glass-panel p-12 text-center space-y-4">
              <p className="font-display text-lg font-bold">Portfolio vazio</p>
              <p className="text-sm text-muted-foreground">Adicione cartas pelo catálogo para começar.</p>
              <Link to="/catalog" className="inline-flex items-center gap-2 bg-gradient-gold text-background px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90">
                <Plus className="h-4 w-4" /> Explorar catálogo
              </Link>
            </div>
          ) : (
            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                    <tr>
                      <th className="text-left p-3 font-medium w-8">#</th>
                      <th className="text-left p-3 font-medium">Carta</th>
                      <th className="text-right p-3 font-medium">Preço</th>
                      <th className="text-right p-3 font-medium hidden md:table-cell">Condição</th>
                      <th className="text-right p-3 font-medium hidden lg:table-cell">Qtd</th>
                      <th className="text-right p-3 font-medium">Holdings</th>
                      <th className="text-right p-3 font-medium">PNL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {tableItems.map((item, i) => {
                      const card = item.cardId;
                      const holding = (card.marketPriceBrl ?? 0) * item.quantity;
                      const hasPurchase = item.purchasePrice != null && item.purchasePrice > 0;
                      const gainAbs = hasPurchase
                        ? ((card.marketPriceBrl ?? item.purchasePrice!) - item.purchasePrice!) * item.quantity
                        : null;
                      const gainPct = hasPurchase && item.purchasePrice! > 0
                        ? ((card.marketPriceBrl ?? item.purchasePrice!) - item.purchasePrice!) / item.purchasePrice! * 100
                        : null;

                      return (
                        <tr key={item._id} className="hover:bg-surface-elevated/50 transition-colors">
                          <td className="p-3 text-muted-foreground text-xs">{i + 1}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-8 rounded overflow-hidden bg-surface-elevated shrink-0 border border-border/40">
                                {card.imageUrl
                                  ? <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" loading="lazy" />
                                  : <div className="w-full h-full bg-surface-elevated" />
                                }
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold truncate max-w-[160px]">{card.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">{card.setName}</span>
                                  <RarityBadge rarity={rarityMap[card.rarity] ?? "common"} />
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            {card.marketPriceBrl != null ? (
                              <span className="font-display font-semibold">
                                {formatCurrency(card.marketPriceBrl, currency)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                            {item.purchasePrice != null && (
                              <p className="text-[10px] text-muted-foreground">
                                custo: {formatCurrency(item.purchasePrice, currency)}
                              </p>
                            )}
                          </td>
                          <td className="p-3 text-right hidden md:table-cell">
                            <span className="text-xs text-muted-foreground">{item.condition}</span>
                            {item.foil && <span className="ml-1 text-[10px] text-primary">✦</span>}
                          </td>
                          <td className="p-3 text-right hidden lg:table-cell text-muted-foreground">
                            ×{item.quantity}
                          </td>
                          <td className="p-3 text-right">
                            <p className="font-display font-semibold">
                              {card.marketPriceBrl != null ? formatCurrency(holding, currency) : "—"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">×{item.quantity} {item.condition}</p>
                          </td>
                          <td className="p-3 text-right">
                            {gainAbs !== null ? (
                              <PnlBadge value={gainAbs} pct={gainPct} />
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Rodapé com totais */}
              <div className="border-t border-border/60 bg-surface-elevated/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RefreshCw className="h-3 w-3" /> Preços atualizados a cada 60s
                </div>
                <div className="flex items-center gap-6 font-display font-semibold">
                  <span className="text-muted-foreground text-xs font-normal">Total:</span>
                  <span>{formatCurrency(totalValueBrl, currency)}</span>
                  {itemsWithPurchase.length > 0 && (
                    <PnlBadge value={totalGainLoss} pct={totalGainPct} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
