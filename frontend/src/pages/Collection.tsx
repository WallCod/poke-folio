import { useState, useMemo, useEffect, useRef } from "react";
import { usePricePolling } from "@/hooks/usePricePolling";
import { RarityBadge } from "@/components/RarityBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { usePortfolios, type Portfolio, type PortfolioItem, type Condition } from "@/store/usePortfolios";
import { cardApi, type PricePoint } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { modal } from "@/store/useAppModal";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Search, Plus, Grid3x3, List, BookOpen, FolderOpen,
  Pencil, Trash2, Loader2, MoreVertical, Check, Minus,
  ShoppingCart, TrendingUp, BarChart2, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Raridade normalizada ─────────────────────────────────────────────────────

type NormRarity = "common" | "uncommon" | "rare" | "holo" | "ultra" | "secret";

const rarityMap: Record<string, NormRarity> = {
  "Common": "common", "Uncommon": "uncommon", "Rare": "rare",
  "Rare Holo": "holo", "Rare Holo EX": "holo", "Rare Holo GX": "holo",
  "Rare Holo V": "holo", "Rare Holo VMAX": "ultra", "Rare Holo VSTAR": "ultra",
  "Rare Ultra": "ultra", "Ultra Rare": "ultra", "Illustration Rare": "ultra",
  "Special Illustration Rare": "secret", "Hyper Rare": "secret", "Secret Rare": "secret",
  "Promo": "holo", "Amazing Rare": "ultra", "Rare Rainbow": "secret",
  "Rare Shiny": "ultra", "Rare Shiny GX": "secret", "Shiny Rare": "ultra",
  "Shiny Ultra Rare": "secret",
};

// ─── Modal criar/editar portfolio ────────────────────────────────────────────

interface PortfolioFormProps {
  open: boolean;
  onClose: () => void;
  editing?: Portfolio | null;
}

const PortfolioForm = ({ open, onClose, editing }: PortfolioFormProps) => {
  const { createPortfolio, updatePortfolio } = usePortfolios();
  const [name, setName]             = useState("");
  const [description, setDesc]      = useState("");
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setDesc(editing?.description ?? "");
    }
  }, [open, editing]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updatePortfolio(editing._id, name.trim(), description.trim());
      } else {
        await createPortfolio(name.trim(), description.trim());
      }
      onClose();
    } catch {
      modal.error("Erro", "Não foi possível salvar o portfolio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border/70 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {editing ? "Editar portfolio" : "Novo portfolio"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="pf-name">Nome</Label>
            <Input
              id="pf-name"
              placeholder="Ex: Coleção principal, Repetidas, EX/GX..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              autoFocus
              className="surface-elevated border-border/70"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-desc">Descrição <span className="text-muted-foreground">(opcional)</span></Label>
            <Input
              id="pf-desc"
              placeholder="Uma breve descrição..."
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={200}
              className="surface-elevated border-border/70"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button
            className="bg-gradient-gold text-background font-semibold hover:opacity-90"
            onClick={handleSave}
            disabled={saving || !name.trim()}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {editing ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Modal de edição de item ─────────────────────────────────────────────────

interface EditItemModalProps {
  item: PortfolioItem | null;
  portfolioId: string;
  onClose: () => void;
}

const EditItemModal = ({ item, portfolioId, onClose }: EditItemModalProps) => {
  const { updateItem } = usePortfolios();
  const [qty, setQty]               = useState(1);
  const [condition, setCondition]   = useState<Condition>("NM");
  const [foil, setFoil]             = useState(false);
  const [purchasePrice, setPurchase] = useState("");
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    if (item) {
      setQty(item.quantity);
      setCondition(item.condition);
      setFoil(item.foil);
      setPurchase(item.purchasePrice != null ? String(item.purchasePrice) : "");
    }
  }, [item]);

  const handleSave = async () => {
    if (!item) return;
    setSaving(true);
    try {
      const pp = purchasePrice ? parseFloat(purchasePrice.replace(",", ".")) : null;
      await updateItem(portfolioId, item._id, {
        quantity: qty,
        condition,
        foil,
        notes: item.notes ?? "",
        purchasePrice: pp,
      } as any);
      onClose();
    } catch {
      modal.error("Erro", "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border/70 max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Editar carta</DialogTitle>
          {item && (
            <DialogDescription className="text-sm text-muted-foreground">
              {item.cardId.name} · {item.cardId.setName}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-3 py-1">
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
            <Label htmlFor="edit-foil" className="cursor-pointer text-sm">Foil / Holográfica</Label>
            <Switch id="edit-foil" checked={foil} onCheckedChange={setFoil} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">
              Preço pago <span className="text-muted-foreground font-normal">(BRL, opcional)</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={purchasePrice}
                onChange={(e) => setPurchase(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg surface-elevated border border-border/70 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button
            className="bg-gradient-gold text-background font-semibold hover:opacity-90"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Pokébola vazia ───────────────────────────────────────────────────────────

const PokeballEmpty = ({ withQuestion = false }: { withQuestion?: boolean }) => (
  <div className="relative h-28 w-28 mx-auto opacity-80">
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <circle cx="50" cy="50" r="46" fill="hsl(240 17% 15%)" stroke="hsl(240 10% 30%)" strokeWidth="3" />
      <path d="M 4,50 A 46,46 0 0 1 96,50 Z" fill="hsl(240 10% 24%)" />
      <rect x="4" y="48" width="92" height="4" fill="hsl(240 22% 6%)" />
      <circle cx="50" cy="50" r="11" fill="hsl(240 17% 11%)" stroke="hsl(240 10% 35%)" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="5" fill="hsl(240 10% 28%)" />
      {withQuestion && (
        <text x="50" y="56" textAnchor="middle" fontSize="11" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fill="hsl(240 11% 58%)">?</text>
      )}
    </svg>
  </div>
);

// ─── Page principal ───────────────────────────────────────────────────────────

const Collection = () => {
  const {
    portfolios, activePortfolioId, items, currency,
    loadingPortfolios, loadingItems,
    fetchPortfolios, setActivePortfolio, deletePortfolio, removeItem,
  } = usePortfolios();

  const [view, setView]             = useState<"grid" | "list">("grid");
  const [query, setQuery]           = useState("");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [pfFormOpen, setPfFormOpen] = useState(false);
  const [editing, setEditing]       = useState<Portfolio | null>(null);
  const [detailItem, setDetailItem] = useState<PortfolioItem | null>(null);
  const [editItem, setEditItem]     = useState<PortfolioItem | null>(null);
  const [detailTab, setDetailTab]   = useState<"info" | "market" | "chart">("info");
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDays, setHistoryDays] = useState<30 | 60 | 90 | 120>(90);
  const [zoomImg, setZoomImg]       = useState<string | null>(null);

  usePricePolling();

  useEffect(() => {
    if (portfolios.length === 0) fetchPortfolios();
  }, []);

  useEffect(() => {
    if (!detailItem || detailTab !== "chart") return;
    setHistoryLoading(true);
    cardApi.priceHistory(detailItem.cardId.tcgId ?? (detailItem as any).tcgId, historyDays)
      .then(({ data }) => setPriceHistory(data))
      .catch(() => setPriceHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [detailItem?._id, detailTab, historyDays]);

  const activePortfolio = portfolios.find((p) => p._id === activePortfolioId);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const card = item.cardId;
      if (query && !card.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (rarityFilter !== "all" && (rarityMap[card.rarity] ?? "common") !== rarityFilter) return false;
      return true;
    });
  }, [items, query, rarityFilter]);

  const handleDelete = (portfolio: Portfolio) => {
    modal.action({
      type: "warning",
      title: `Excluir "${portfolio.name}"?`,
      message: "Todas as cartas neste portfolio serão removidas. Esta ação não pode ser desfeita.",
      actionLabel: "Excluir",
      onAction: async () => {
        try {
          await deletePortfolio(portfolio._id);
        } catch {
          modal.error("Erro", "Não foi possível excluir o portfolio.");
        }
      },
    });
  };

  const handleRemoveItem = (itemId: string) => {
    if (!activePortfolioId) return;
    modal.action({
      type: "warning",
      title: "Remover carta?",
      message: "A carta será removida deste portfolio.",
      actionLabel: "Remover",
      onAction: () => removeItem(activePortfolioId, itemId),
    });
  };

  return (
    <div className="container pt-8 animate-fade-in">
      <div className="flex gap-6">
        {/* Sidebar — lista de portfolios */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 gap-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Portfolios</span>
            <button
              onClick={() => { setEditing(null); setPfFormOpen(true); }}
              className="text-muted-foreground hover:text-primary transition-colors p-1 rounded"
              title="Criar portfolio"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {loadingPortfolios ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
            </div>
          ) : (
            portfolios.map((p) => (
              <div
                key={p._id}
                className={cn(
                  "group flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-all text-sm",
                  p._id === activePortfolioId
                    ? "bg-primary/15 border border-primary/30 text-foreground"
                    : "hover:bg-surface-elevated/80 text-muted-foreground"
                )}
                onClick={() => setActivePortfolio(p._id)}
              >
                <FolderOpen className={cn("h-4 w-4 shrink-0", p._id === activePortfolioId ? "text-primary" : "")} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.totalCards} carta{p.totalCards !== 1 && "s"}</p>
                </div>
                {!p.isDefault && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-elevated"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditing(p); setPfFormOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5 mr-2" /> Renomear
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDelete(p); }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))
          )}

          <button
            onClick={() => { setEditing(null); setPfFormOpen(true); }}
            className="mt-1 flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-2 rounded-xl hover:bg-surface-elevated/60"
          >
            <Plus className="h-3.5 w-3.5" /> Novo portfolio
          </button>
        </aside>

        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0 space-y-5 pb-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold">
                {activePortfolio?.name ?? "Minha coleção"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {filtered.length} carta{filtered.length !== 1 && "s"}
                {activePortfolio && activePortfolio.totalValueBrl > 0 && (
                  <> · {formatCurrency(activePortfolio.totalValueBrl, currency)} estimado</>
                )}
              </p>
            </div>
            <Button asChild className="bg-gradient-gold text-background font-semibold hover:opacity-90 hover:shadow-glow-gold">
              <Link to="/catalog">
                <Plus className="h-4 w-4" /> Adicionar carta
              </Link>
            </Button>
          </div>

          {/* Filtros */}
          <div className="glass-panel p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 surface-elevated border-border/70 h-11 text-base"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={rarityFilter} onValueChange={setRarityFilter}>
                <SelectTrigger className="w-auto min-w-[140px] surface-elevated border-border/70">
                  <SelectValue placeholder="Raridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas raridades</SelectItem>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="uncommon">Uncommon</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="holo">Holo Rare</SelectItem>
                  <SelectItem value="ultra">Ultra Rare</SelectItem>
                  <SelectItem value="secret">Secret Rare</SelectItem>
                </SelectContent>
              </Select>

              <div className="ml-auto flex items-center gap-1 surface-elevated rounded-lg p-1 border border-border/70">
                <button onClick={() => setView("grid")} className={cn("p-1.5 rounded-md transition-colors", view === "grid" ? "bg-primary text-background" : "text-muted-foreground hover:text-foreground")}>
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button onClick={() => setView("list")} className={cn("p-1.5 rounded-md transition-colors", view === "list" ? "bg-primary text-background" : "text-muted-foreground hover:text-foreground")}>
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          {loadingItems ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="glass-panel aspect-[63/88] rounded-xl animate-pulse bg-surface-elevated" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="glass-panel p-12 text-center space-y-5">
              <PokeballEmpty />
              <div>
                <p className="font-display text-xl font-bold">Portfolio vazio</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Adicione cartas pelo Catálogo para começar
                </p>
              </div>
              <Button asChild className="bg-gradient-gold text-background font-semibold hover:opacity-90 hover:shadow-glow-gold">
                <Link to="/catalog"><BookOpen className="h-4 w-4" /> Explorar catálogo</Link>
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-panel p-12 text-center space-y-4">
              <PokeballEmpty withQuestion />
              <p className="font-display text-lg font-bold">Nenhuma carta encontrada</p>
              <p className="text-sm text-muted-foreground">Tente outro nome ou filtro</p>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((item) => {
                const card = item.cardId;
                return (
                  <div
                    key={item._id}
                    className="group glass-panel p-2 rounded-xl flex flex-col gap-2 relative cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => setDetailItem(item)}
                  >
                    <div className="aspect-[63/88] rounded-lg overflow-hidden bg-surface-elevated">
                      {card.imageUrl ? (
                        <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Sem imagem</div>
                      )}
                    </div>
                    <div className="px-1 pb-1">
                      <p className="font-semibold text-xs leading-tight line-clamp-2">{card.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{card.setName}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <RarityBadge rarity={rarityMap[card.rarity] ?? "common"} />
                        <span className="text-xs text-muted-foreground">×{item.quantity}</span>
                      </div>
                      {card.marketPriceBrl != null && (
                        <p className="font-display text-xs font-bold text-primary mt-1">
                          {formatCurrency(card.marketPriceBrl * item.quantity, currency)}
                        </p>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditItem(item); }}
                        className="p-1.5 rounded-lg bg-surface-elevated/90 text-muted-foreground hover:text-primary border border-border/60 backdrop-blur-sm"
                        title="Editar"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveItem(item._id); }}
                        className="p-1.5 rounded-lg bg-destructive/80 text-white"
                        title="Remover"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                    <tr>
                      <th className="text-left p-4 font-medium">Carta</th>
                      <th className="text-left p-4 font-medium">Set</th>
                      <th className="text-left p-4 font-medium">Raridade</th>
                      <th className="text-left p-4 font-medium">Condição</th>
                      <th className="text-right p-4 font-medium">Qtd</th>
                      <th className="text-right p-4 font-medium">Valor</th>
                      <th className="p-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filtered.map((item) => {
                      const card = item.cardId;
                      return (
                        <tr key={item._id} className="hover:bg-surface-elevated/60 transition-colors group cursor-pointer" onClick={() => setDetailItem(item)}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {card.imageUrl && (
                                <img src={card.imageUrl} alt={card.name} className="h-10 w-7 object-cover rounded" loading="lazy" />
                              )}
                              <span className="font-semibold">{card.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground">{card.setName}</td>
                          <td className="p-4"><RarityBadge rarity={rarityMap[card.rarity] ?? "common"} /></td>
                          <td className="p-4 text-muted-foreground">{item.condition}</td>
                          <td className="p-4 text-right">×{item.quantity}</td>
                          <td className="p-4 text-right font-display font-semibold text-primary">
                            {card.marketPriceBrl != null
                              ? formatCurrency(card.marketPriceBrl * item.quantity, currency)
                              : "—"}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditItem(item); }}
                                className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                title="Editar"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveItem(item._id); }}
                                className="p-1.5 rounded text-destructive hover:bg-destructive/10 transition-colors"
                                title="Remover"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalhe da carta */}
      <Dialog open={!!detailItem} onOpenChange={(v) => { if (!v) { setDetailItem(null); setDetailTab("info"); } }}>
        <DialogContent className="bg-card border-border/70 w-[95vw] max-w-md p-0 overflow-hidden gap-0 flex flex-col max-h-[88vh]">
          {detailItem && (() => {
            const card = detailItem.cardId;
            const hasPurchase = detailItem.purchasePrice != null && detailItem.purchasePrice > 0;
            const gainAbs = hasPurchase && card.marketPriceBrl != null
              ? (card.marketPriceBrl - detailItem.purchasePrice!) * detailItem.quantity : null;
            const gainPct = hasPurchase && card.marketPriceBrl != null && detailItem.purchasePrice! > 0
              ? ((card.marketPriceBrl - detailItem.purchasePrice!) / detailItem.purchasePrice!) * 100 : null;
            const totalValue = card.marketPriceBrl != null ? card.marketPriceBrl * detailItem.quantity : null;
            const chartData = priceHistory.map((p) => ({
              date: new Date(p.recordedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
              price: p.priceBrl,
            }));
            const histMetrics = priceHistory.length >= 2 ? (() => {
              const first = priceHistory[0].priceBrl;
              const last  = priceHistory[priceHistory.length - 1].priceBrl;
              return {
                first, last,
                min: Math.min(...priceHistory.map((p) => p.priceBrl)),
                max: Math.max(...priceHistory.map((p) => p.priceBrl)),
                pct: first > 0 ? ((last - first) / first) * 100 : 0,
              };
            })() : null;

            return (
              <>
                {/* Header compacto */}
                <div className="flex gap-3 p-3 pb-2.5 border-b border-border/50 shrink-0">
                  <button
                    onClick={() => setZoomImg(card.imageUrlHiRes || card.imageUrl)}
                    className="w-14 shrink-0 aspect-[63/88] rounded-lg overflow-hidden bg-surface-elevated border border-border/60 hover:border-primary/50 transition-colors group relative"
                  >
                    {card.imageUrl
                      ? <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">—</div>}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ArrowUpRight className="h-3.5 w-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <RarityBadge rarity={rarityMap[card.rarity] ?? "common"} />
                      {detailItem.foil && <span className="text-[9px] bg-primary/15 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full font-semibold">✦ Foil</span>}
                    </div>
                    <h2 className="font-display font-bold text-sm leading-tight mt-0.5 line-clamp-1">{card.name}</h2>
                    <p className="text-[10px] text-muted-foreground">{card.setName} · {card.number}</p>
                    {card.marketPriceBrl != null && (
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="font-display text-base font-bold text-gradient-gold leading-none">
                          {formatCurrency(card.marketPriceBrl, currency)}
                        </span>
                        {card.priceSource === "mypcards" && (
                          <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1 py-0.5 rounded-full font-semibold">BR</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border/50 shrink-0">
                  {(["info", "market", "chart"] as const).map((tab) => {
                    const cfg = {
                      info:   { icon: <ShoppingCart className="h-3 w-3" />,  label: "Posse" },
                      market: { icon: <TrendingUp className="h-3 w-3" />,    label: "Mercado" },
                      chart:  { icon: <BarChart2 className="h-3 w-3" />,     label: "Histórico" },
                    }[tab];
                    return (
                      <button
                        key={tab}
                        onClick={() => setDetailTab(tab)}
                        className={`flex-1 py-2 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors ${
                          detailTab === tab
                            ? "text-primary border-b-2 border-primary bg-primary/5"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cfg.icon}{cfg.label}
                      </button>
                    );
                  })}
                </div>

                {/* Conteúdo com scroll */}
                <div className="overflow-y-auto flex-1 min-h-0">

                  {/* Tab: Posse */}
                  {detailTab === "info" && (
                    <div className="p-3 space-y-2.5">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Tipo", value: card.types?.join(", ") || "—" },
                          { label: "HP", value: card.hp || "—" },
                          { label: "Supertype", value: card.supertype || "—" },
                        ].map(({ label, value }) => (
                          <div key={label} className="surface-elevated rounded-lg p-2 border border-border/50 text-center">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
                            <p className="font-semibold text-xs mt-0.5 truncate">{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="surface-elevated rounded-xl border border-border/50 divide-y divide-border/40 text-sm">
                        <div className="flex justify-between items-center px-3 py-2">
                          <span className="text-muted-foreground text-xs">Condição</span>
                          <span className="font-semibold text-xs">{detailItem.condition}</span>
                        </div>
                        <div className="flex justify-between items-center px-3 py-2">
                          <span className="text-muted-foreground text-xs">Quantidade</span>
                          <span className="font-semibold text-xs">×{detailItem.quantity}</span>
                        </div>
                        {hasPurchase && (
                          <div className="flex justify-between items-center px-3 py-2">
                            <span className="text-muted-foreground text-xs">Preço pago</span>
                            <span className="font-semibold text-xs">{formatCurrency(detailItem.purchasePrice!, currency)}</span>
                          </div>
                        )}
                        {totalValue != null && (
                          <div className="flex justify-between items-center px-3 py-2">
                            <span className="text-muted-foreground text-xs">Valor total</span>
                            <span className="font-display font-bold text-sm text-primary">{formatCurrency(totalValue, currency)}</span>
                          </div>
                        )}
                        {gainAbs !== null && gainPct !== null && (
                          <div className="flex justify-between items-center px-3 py-2">
                            <span className="text-muted-foreground text-xs">Ganho / Perda</span>
                            <span className={cn("font-bold text-xs", gainAbs >= 0 ? "text-emerald-400" : "text-red-400")}>
                              {gainAbs >= 0 ? "+" : ""}{formatCurrency(gainAbs, currency)}
                              <span className="font-normal ml-1 opacity-70">({gainAbs >= 0 ? "+" : ""}{gainPct.toFixed(1)}%)</span>
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive/60 text-xs h-8"
                          onClick={() => { setDetailItem(null); handleRemoveItem(detailItem._id); }}>
                          <Trash2 className="h-3.5 w-3.5" /> Remover
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-xs h-8"
                          onClick={() => { setDetailItem(null); setEditItem(detailItem); }}>
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Tab: Mercado */}
                  {detailTab === "market" && (
                    <div className="p-3 space-y-2.5">
                      {card.priceSource !== "mypcards" && !card.marketPriceBrl ? (
                        <div className="py-8 text-center space-y-2 text-muted-foreground">
                          <TrendingUp className="h-9 w-9 mx-auto opacity-40" />
                          <p className="font-display font-bold text-sm">Sem dados BR</p>
                          <p className="text-xs">Sem dados de mercado disponíveis.</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: "Floor", value: card.marketPriceBrl != null ? formatCurrency(card.marketPriceBrl, currency) : "—", cls: "text-primary" },
                              { label: "Médio", value: (card as any).mypAvg != null ? formatCurrency((card as any).mypAvg, currency) : "—", cls: "" },
                              { label: "Máximo", value: card.marketPriceBrlMax != null ? formatCurrency(card.marketPriceBrlMax, currency) : "—", cls: "text-yellow-400" },
                            ].map(({ label, value, cls }) => (
                              <div key={label} className="surface-elevated rounded-lg p-2 border border-border/60 text-center">
                                <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                                <p className={`font-display font-bold text-sm ${cls}`}>{value}</p>
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="surface-elevated rounded-lg p-2 border border-border/60">
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Ref. TCG (USD)</p>
                              <p className="font-display font-bold text-sm mt-0.5">
                                {(card as any).mypTcgPriceUsd != null ? `US$ ${(card as any).mypTcgPriceUsd.toFixed(2)}` : "—"}
                              </p>
                            </div>
                            <div className="surface-elevated rounded-lg p-2 border border-border/60">
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Disponíveis</p>
                              <p className="font-display font-bold text-sm mt-0.5">
                                {(card as any).mypAvailableQty != null ? (card as any).mypAvailableQty.toLocaleString("pt-BR") : "—"}
                              </p>
                            </div>
                          </div>
                          {((card as any).editionEn || (card as any).editionPt) && (
                            <div className="surface-elevated rounded-lg p-2 border border-border/60 space-y-0.5">
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Edição</p>
                              {(card as any).editionEn && <p className="text-xs"><span className="text-muted-foreground">EN:</span> {(card as any).editionEn}</p>}
                              {(card as any).editionPt && <p className="text-xs"><span className="text-muted-foreground">PT:</span> {(card as any).editionPt}</p>}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Tab: Histórico */}
                  {detailTab === "chart" && (
                    <div className="p-3 space-y-2.5">
                      <div className="flex gap-1.5 justify-end">
                        {([30, 60, 90, 120] as const).map((d) => (
                          <button key={d} onClick={() => setHistoryDays(d)}
                            className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                              historyDays === d ? "bg-primary text-background" : "surface-elevated border border-border/60 text-muted-foreground hover:text-foreground"
                            }`}>
                            {d}d
                          </button>
                        ))}
                      </div>
                      {historyLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <p className="text-xs">Carregando…</p>
                        </div>
                      ) : priceHistory.length === 0 ? (
                        <div className="py-8 text-center space-y-2">
                          <BarChart2 className="h-9 w-9 mx-auto text-muted-foreground/40" />
                          <p className="font-display font-bold text-sm">Sem histórico ainda</p>
                          <p className="text-xs text-muted-foreground">1 snapshot por dia.</p>
                        </div>
                      ) : (
                        <>
                          {histMetrics && (
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { label: "Inicial", value: formatCurrency(histMetrics.first, currency), cls: "" },
                                { label: "Atual",   value: formatCurrency(histMetrics.last,  currency), cls: "" },
                                { label: "Mínimo",  value: formatCurrency(histMetrics.min,   currency), cls: "text-blue-400" },
                                { label: "Máximo",  value: formatCurrency(histMetrics.max,   currency), cls: "text-yellow-400" },
                              ].map(({ label, value, cls }) => (
                                <div key={label} className="surface-elevated rounded-lg p-2 border border-border/60">
                                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</p>
                                  <p className={`font-display font-bold text-sm mt-0.5 ${cls}`}>{value}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {histMetrics && (
                            <div className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 border text-xs ${
                              histMetrics.pct >= 0 ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"
                            }`}>
                              {histMetrics.pct >= 0 ? <ArrowUpRight className="h-3.5 w-3.5 shrink-0" /> : <ArrowDownRight className="h-3.5 w-3.5 shrink-0" />}
                              <span className="font-semibold">{histMetrics.pct >= 0 ? "+" : ""}{histMetrics.pct.toFixed(1)}% no período</span>
                              <span className="opacity-60 ml-auto">{priceHistory.length}pts</span>
                            </div>
                          )}
                          <div className="h-36">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(48 100% 50%)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(48 100% 50%)" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 25% / 0.4)" />
                                <XAxis dataKey="date" tick={{ fontSize: 8, fill: "hsl(240 10% 55%)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                <YAxis tick={{ fontSize: 8, fill: "hsl(240 10% 55%)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v.toFixed(0)}`} />
                                <Tooltip content={({ active, payload, label }) =>
                                  active && payload?.length ? (
                                    <div className="glass-panel px-2.5 py-1.5 text-xs border border-primary/30">
                                      <p className="text-muted-foreground">{label}</p>
                                      <p className="font-display font-bold text-primary">{formatCurrency(payload[0].value as number, currency)}</p>
                                    </div>
                                  ) : null
                                } />
                                <Area type="monotone" dataKey="price" stroke="hsl(48 100% 50%)" strokeWidth={2} fill="url(#colGrad)" dot={false} activeDot={{ r: 3, fill: "hsl(48 100% 50%)" }} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Zoom de imagem */}
      <Dialog open={!!zoomImg} onOpenChange={(v) => !v && setZoomImg(null)}>
        <DialogContent className="bg-black/90 border-border/40 max-w-sm w-auto p-4 flex flex-col items-center">
          {zoomImg && <img src={zoomImg} alt="Card" className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl shadow-[0_0_60px_-10px_rgba(0,0,0,0.8)]" />}
        </DialogContent>
      </Dialog>

      <EditItemModal
        item={editItem}
        portfolioId={activePortfolioId ?? ""}
        onClose={() => setEditItem(null)}
      />

      <PortfolioForm
        open={pfFormOpen}
        onClose={() => { setPfFormOpen(false); setEditing(null); }}
        editing={editing}
      />
    </div>
  );
};

export default Collection;
