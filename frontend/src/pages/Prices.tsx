import { useMemo, useEffect } from "react";
import { usePortfolios } from "@/store/usePortfolios";
import { formatCurrency } from "@/lib/format";
import { modal } from "@/store/useAppModal";
import { Download, Wallet, Layers, Tag, TrendingUp, BarChart3, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const rarityGroup = (rarity: string): "secret" | "ultra" | "holo" | "rare" | "common" => {
  if (["Secret Rare", "Hyper Rare", "Special Illustration Rare", "Rare Rainbow"].includes(rarity)) return "secret";
  if (["Ultra Rare", "Rare Ultra", "Illustration Rare", "Rare Holo VMAX", "Rare Holo VSTAR", "Amazing Rare", "Rare Shiny GX"].includes(rarity)) return "ultra";
  if (["Rare Holo", "Rare Holo EX", "Rare Holo GX", "Rare Holo V", "Promo", "Rare Shiny", "Shiny Rare"].includes(rarity)) return "holo";
  if (["Rare"].includes(rarity)) return "rare";
  return "common";
};

const rarityLabel: Record<string, string> = {
  secret: "Secret / Hyper Rare",
  ultra: "Ultra Rare / EX / GX",
  holo: "Holo / Promo",
  rare: "Rare",
  common: "Common / Uncommon",
};

const rarityColor: Record<string, string> = {
  secret: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  ultra: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  holo: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  rare: "text-primary bg-primary/10 border-primary/30",
  common: "text-slate-400 bg-slate-500/10 border-slate-500/30",
};

const Prices = () => {
  const { items, portfolios, currency, fetchPortfolios, fetchAllItems } = usePortfolios();

  useEffect(() => {
    if (portfolios.length === 0) {
      fetchPortfolios().then(() => fetchAllItems());
    } else {
      // Sempre recarrega todos os itens ao entrar na página de preços,
      // pois o store pode ter sido sobrescrito com apenas um portfolio ativo
      fetchAllItems();
    }
  }, []);

  const totalValueBrl = useMemo(
    () => portfolios.reduce((s, p) => s + p.totalValueBrl, 0),
    [portfolios]
  );

  const totalCards = useMemo(
    () => portfolios.reduce((s, p) => s + p.totalCards, 0),
    [portfolios]
  );

  // Breakdown por raridade
  const byRarity = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {};
    for (const item of items) {
      const g = rarityGroup(item.cardId.rarity);
      if (!map[g]) map[g] = { count: 0, value: 0 };
      map[g].count += item.quantity;
      map[g].value += (item.cardId.marketPriceBrl ?? 0) * item.quantity;
    }
    return Object.entries(map)
      .map(([key, v]) => ({ key, label: rarityLabel[key], ...v, pct: totalValueBrl > 0 ? (v.value / totalValueBrl) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
  }, [items, totalValueBrl]);

  // Breakdown por set (top 8)
  const bySet = useMemo(() => {
    const map: Record<string, { setName: string; count: number; value: number }> = {};
    for (const item of items) {
      const key = item.cardId.setCode;
      if (!map[key]) map[key] = { setName: item.cardId.setName, count: 0, value: 0 };
      map[key].count += item.quantity;
      map[key].value += (item.cardId.marketPriceBrl ?? 0) * item.quantity;
    }
    return Object.entries(map)
      .map(([key, v]) => ({ key, ...v, pct: totalValueBrl > 0 ? (v.value / totalValueBrl) * 100 : 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [items, totalValueBrl]);

  // Top 5 cartas por valor total
  const topCards = useMemo(
    () =>
      [...items]
        .filter((i) => i.cardId.marketPriceBrl != null)
        .sort((a, b) => (b.cardId.marketPriceBrl! * b.quantity) - (a.cardId.marketPriceBrl! * a.quantity))
        .slice(0, 5),
    [items]
  );

  // Cartas com preço de compra registrado — lucro/perda
  const withPurchase = useMemo(
    () => items.filter((i) => i.purchasePrice != null && i.purchasePrice > 0),
    [items]
  );
  const totalInvested = withPurchase.reduce((s, i) => s + i.purchasePrice! * i.quantity, 0);
  const totalGain = withPurchase.reduce(
    (s, i) => s + ((i.cardId.marketPriceBrl ?? i.purchasePrice!) - i.purchasePrice!) * i.quantity, 0
  );

  const exportCSV = () => {
    const headers = ["Carta", "Set", "Raridade", "Condição", "Foil", "Qtd", "Preço unit. (BRL)", "Preço compra (BRL)", "Valor total (BRL)", "PNL (BRL)"];
    const rows = items.map((i) => {
      const currentVal = (i.cardId.marketPriceBrl ?? 0) * i.quantity;
      const pnl = i.purchasePrice ? ((i.cardId.marketPriceBrl ?? i.purchasePrice) - i.purchasePrice) * i.quantity : "";
      return [
        i.cardId.name,
        i.cardId.setName,
        i.cardId.rarity,
        i.condition,
        i.foil ? "Sim" : "Não",
        i.quantity,
        (i.cardId.marketPriceBrl ?? 0).toFixed(2),
        i.purchasePrice ? i.purchasePrice.toFixed(2) : "",
        currentVal.toFixed(2),
        pnl !== "" ? (pnl as number).toFixed(2) : "",
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pokefolio-relatorio.csv";
    a.click();
    URL.revokeObjectURL(url);
    modal.success("Relatório exportado!", "O arquivo CSV foi salvo no seu dispositivo.");
  };

  const noItems = items.length === 0;

  return (
    <div className="container pt-8 pb-16 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Relatório de Preços</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análise completa do valor da sua coleção
          </p>
        </div>
        <Button
          onClick={exportCSV}
          disabled={noItems}
          className="bg-gradient-gold text-background font-semibold hover:opacity-90 hover:shadow-glow-gold"
        >
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {noItems ? (
        <div className="glass-panel p-16 text-center space-y-4">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto opacity-40" />
          <p className="font-display text-lg font-bold">Nenhuma carta no portfolio</p>
          <p className="text-sm text-muted-foreground">Adicione cartas pelo catálogo para ver análises de valor.</p>
          <Link to="/catalog" className="inline-flex items-center gap-2 bg-gradient-gold text-background px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90 mt-2">
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Valor total</p>
              <p className="font-display text-2xl font-bold text-gradient-gold">{formatCurrency(totalValueBrl, currency)}</p>
              <p className="text-xs text-muted-foreground">{totalCards} cartas</p>
            </div>
            <div className="glass-panel p-5 space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> Sets representados</p>
              <p className="font-display text-2xl font-bold">{new Set(items.map((i) => i.cardId.setCode)).size}</p>
              <p className="text-xs text-muted-foreground">coleções diferentes</p>
            </div>
            <div className="glass-panel p-5 space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Total investido</p>
              <p className="font-display text-2xl font-bold">{totalInvested > 0 ? formatCurrency(totalInvested, currency) : "—"}</p>
              <p className="text-xs text-muted-foreground">{withPurchase.length} cartas com custo</p>
            </div>
            <div className={cn("glass-panel p-5 space-y-1", totalGain >= 0 ? "border-emerald-500/30" : "border-red-500/30")}>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className={cn("h-3.5 w-3.5", totalGain >= 0 ? "text-emerald-400" : "text-red-400")} /> Lucro / Perda
              </p>
              <p className={cn("font-display text-2xl font-bold", totalGain >= 0 ? "text-emerald-400" : "text-red-400")}>
                {totalInvested > 0 ? `${totalGain >= 0 ? "+" : ""}${formatCurrency(totalGain, currency)}` : "—"}
              </p>
              {totalInvested > 0 && (
                <p className={cn("text-xs font-semibold", totalGain >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {totalGain >= 0 ? "▲" : "▼"} {Math.abs((totalGain / totalInvested) * 100).toFixed(1)}% vs compra
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Por raridade */}
            <div className="glass-panel p-6 space-y-4">
              <h2 className="font-display font-bold text-base flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" /> Distribuição por raridade
              </h2>
              <div className="space-y-3">
                {byRarity.map(({ key, label, count, value, pct }) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", rarityColor[key])}>
                        {label}
                      </span>
                      <span className="text-muted-foreground text-xs">{count} cartas · {formatCurrency(value, currency)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-gold"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Por set */}
            <div className="glass-panel p-6 space-y-4">
              <h2 className="font-display font-bold text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Top sets por valor
              </h2>
              <div className="space-y-3">
                {bySet.map(({ key, setName, count, value, pct }) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-xs truncate max-w-[180px]">{setName}</span>
                      <span className="text-muted-foreground text-xs shrink-0">{count}× · {formatCurrency(value, currency)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top 5 cartas */}
          <div className="glass-panel overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <h2 className="font-display font-bold text-base">Top 5 cartas por valor</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="text-left p-4 font-medium w-8">#</th>
                    <th className="text-left p-4 font-medium">Carta</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Set</th>
                    <th className="text-right p-4 font-medium">Preço unit.</th>
                    <th className="text-right p-4 font-medium">Qtd</th>
                    <th className="text-right p-4 font-medium">Valor total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {topCards.map((item, i) => (
                    <tr key={item._id} className="hover:bg-surface-elevated/50 transition-colors">
                      <td className="p-4 text-muted-foreground text-xs font-bold">{i + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-8 rounded overflow-hidden bg-surface-elevated border border-border/40 shrink-0">
                            {item.cardId.imageUrl
                              ? <img src={item.cardId.imageUrl} alt={item.cardId.name} className="w-full h-full object-cover" loading="lazy" />
                              : <div className="w-full h-full bg-surface-elevated" />}
                          </div>
                          <p className="font-semibold truncate max-w-[140px]">{item.cardId.name}</p>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs hidden md:table-cell">{item.cardId.setName}</td>
                      <td className="p-4 text-right font-display font-semibold">
                        {formatCurrency(item.cardId.marketPriceBrl!, currency)}
                      </td>
                      <td className="p-4 text-right text-muted-foreground">×{item.quantity}</td>
                      <td className="p-4 text-right font-display font-bold text-gradient-gold">
                        {formatCurrency(item.cardId.marketPriceBrl! * item.quantity, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabela completa */}
          <div className="glass-panel overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-display font-bold text-base">Todas as cartas</h2>
              <span className="text-xs text-muted-foreground">{items.length} itens</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="text-left p-3 font-medium">Carta</th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">Set</th>
                    <th className="text-left p-3 font-medium hidden lg:table-cell">Condição</th>
                    <th className="text-right p-3 font-medium">Qtd</th>
                    <th className="text-right p-3 font-medium">Preço unit.</th>
                    <th className="text-right p-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {[...items]
                    .sort((a, b) => (b.cardId.marketPriceBrl ?? 0) * b.quantity - (a.cardId.marketPriceBrl ?? 0) * a.quantity)
                    .map((item) => (
                      <tr key={item._id} className="hover:bg-surface-elevated/50 transition-colors">
                        <td className="p-3 font-medium">{item.cardId.name}</td>
                        <td className="p-3 text-muted-foreground text-xs hidden md:table-cell">{item.cardId.setName}</td>
                        <td className="p-3 hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">{item.condition}{item.foil ? " ✦" : ""}</span>
                        </td>
                        <td className="p-3 text-right text-muted-foreground">×{item.quantity}</td>
                        <td className="p-3 text-right text-muted-foreground text-xs">
                          {item.cardId.marketPriceBrl != null ? formatCurrency(item.cardId.marketPriceBrl, currency) : "—"}
                        </td>
                        <td className="p-3 text-right font-display font-semibold text-primary">
                          {item.cardId.marketPriceBrl != null
                            ? formatCurrency(item.cardId.marketPriceBrl * item.quantity, currency)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot className="border-t border-border/60 bg-surface-elevated/40">
                  <tr>
                    <td colSpan={5} className="p-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Total geral
                    </td>
                    <td className="p-3 text-right font-display text-lg font-bold text-gradient-gold">
                      {formatCurrency(totalValueBrl, currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Prices;
