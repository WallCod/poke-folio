import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Plus, Loader2, Lock, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnergyIcon } from "@/components/EnergyIcon";
import { getSession } from "@/lib/auth";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { modal } from "@/store/useAppModal";
import { usePortfolios } from "@/store/usePortfolios";
import { useAuthModal } from "@/store/useAuthModal";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";

interface SetCard {
  tcgId: string;
  name: string;
  number: string;
  rarity: string;
  types: string[];
  imageUrl: string;
  supertype: string;
  subtypes: string[];
  hp: string;
  setName: string;
}

interface SetInfo {
  id: string;
  name: string;
  series: string;
  releaseDate: string;
  total: number;
  logo: string | null;
  symbol: string | null;
}

const RARITY_COLOR: Record<string, string> = {
  "Common":                     "text-gray-400",
  "Uncommon":                   "text-green-400",
  "Rare":                       "text-blue-400",
  "Rare Holo":                  "text-blue-400",
  "Rare Holo EX":               "text-purple-400",
  "Rare Holo GX":               "text-purple-400",
  "Rare Holo V":                "text-purple-400",
  "Rare Ultra":                 "text-yellow-400",
  "Rare Secret":                "text-pink-400",
  "Rare Rainbow":               "text-pink-400",
  "Promo":                      "text-orange-400",
  "Illustration Rare":          "text-indigo-400",
  "Special Illustration Rare":  "text-pink-400",
  "Hyper Rare":                 "text-yellow-300",
};

const RARITY_BADGE: Record<string, string> = {
  "Common":                     "bg-gray-500/15 border-gray-500/30 text-gray-300",
  "Uncommon":                   "bg-green-500/15 border-green-500/30 text-green-300",
  "Rare":                       "bg-blue-500/15 border-blue-500/30 text-blue-300",
  "Rare Holo":                  "bg-blue-500/15 border-blue-500/30 text-blue-300",
  "Rare Holo EX":               "bg-purple-500/15 border-purple-500/30 text-purple-300",
  "Rare Holo GX":               "bg-purple-500/15 border-purple-500/30 text-purple-300",
  "Rare Holo V":                "bg-purple-500/15 border-purple-500/30 text-purple-300",
  "Rare Ultra":                 "bg-yellow-500/15 border-yellow-500/30 text-yellow-300",
  "Rare Secret":                "bg-pink-500/15 border-pink-500/30 text-pink-300",
  "Rare Rainbow":               "bg-pink-500/15 border-pink-500/30 text-pink-300",
  "Promo":                      "bg-orange-500/15 border-orange-500/30 text-orange-300",
  "Illustration Rare":          "bg-indigo-500/15 border-indigo-500/30 text-indigo-300",
  "Special Illustration Rare":  "bg-pink-500/15 border-pink-500/30 text-pink-300",
  "Hyper Rare":                 "bg-yellow-400/15 border-yellow-400/30 text-yellow-200",
};

function rarityColor(rarity: string): string {
  return RARITY_COLOR[rarity] ?? "text-muted-foreground";
}
function rarityBadge(rarity: string): string {
  return RARITY_BADGE[rarity] ?? "bg-muted/20 border-border/40 text-muted-foreground";
}

// ─── Card Detail Modal ────────────────────────────────────────────────────────

interface CardPrices { floor: number | null; floorLive: number | null; avg: number | null; max: number | null; link?: string | null; source?: string | null; qty?: number | null }

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Fire:      { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  Water:     { bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/30"   },
  Grass:     { bg: "bg-green-500/10",  text: "text-green-400",  border: "border-green-500/30"  },
  Lightning: { bg: "bg-yellow-400/10", text: "text-yellow-300", border: "border-yellow-400/30" },
  Psychic:   { bg: "bg-pink-500/10",   text: "text-pink-400",   border: "border-pink-500/30"   },
  Fighting:  { bg: "bg-red-700/10",    text: "text-red-400",    border: "border-red-600/30"    },
  Darkness:  { bg: "bg-purple-900/20", text: "text-purple-300", border: "border-purple-700/30" },
  Metal:     { bg: "bg-slate-400/10",  text: "text-slate-300",  border: "border-slate-400/30"  },
  Dragon:    { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/30" },
  Fairy:     { bg: "bg-pink-300/10",   text: "text-pink-300",   border: "border-pink-300/30"   },
  Colorless: { bg: "bg-white/5",       text: "text-gray-300",   border: "border-white/15"      },
};

const fmtBrl = (v?: number | null) =>
  v != null ? `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

function TypeBadge({ type }: { type: string }) {
  const c = TYPE_COLORS[type] ?? TYPE_COLORS.Colorless;
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border", c.bg, c.text, c.border)}>
      <EnergyIcon type={type} size={11} />
      {type}
    </span>
  );
}

function CardModal({
  card, owned, loggedIn, adding, onAdd, onClose, onLoginRequired,
}: {
  card: SetCard; owned: boolean; loggedIn: boolean; adding: boolean;
  onAdd: (card: SetCard, floorPrice?: number | null) => void; onClose: () => void; onLoginRequired: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const [imgLarge, setImgLarge] = useState(false);
  const [prices, setPrices] = useState<CardPrices | null>(null);
  const [pricesLoading, setPricesLoading] = useState(true);

  const typeColor = TYPE_COLORS[card.types[0] ?? "Colorless"] ?? TYPE_COLORS.Colorless;
  // pokemontcg.io: "3.png" → "3_hires.png"
  // scrydex.com:   ".../small" → ".../large"
  const largeImg = card.imageUrl
    ? card.imageUrl.includes("scrydex.com")
      ? card.imageUrl.replace(/\/small$/, "/large")
      : card.imageUrl.replace(/\.png$/, "_hires.png")
    : "";

  useEffect(() => {
    setPricesLoading(true);
    const baseUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3001/api").replace(/\/api$/, "");
    const params = new URLSearchParams({ name: card.name, number: card.number });
    fetch(`${baseUrl}/api/public/card-price/${encodeURIComponent(card.tcgId)}?${params}`)
      .then((r) => r.json())
      .then((d) => setPrices(d?.floor !== undefined ? d : null))
      .catch(() => setPrices(null))
      .finally(() => setPricesLoading(false));
  }, [card.tcgId]);

  const isMYP = prices?.source !== "tcgplayer";
  const mypSparse = prices && prices.floor != null && prices.avg != null && prices.max != null
    && prices.floor === prices.avg && prices.avg === prices.max;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Layout lado a lado: imagem esquerda | info direita */}
        <div
          className="relative bg-card border border-border/70 rounded-2xl shadow-2xl w-full flex flex-row overflow-hidden"
          style={{ maxWidth: 560, maxHeight: "90vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-background/60 hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Coluna esquerda — imagem em alta resolução */}
          <div className={cn("w-44 shrink-0 flex flex-col items-center justify-center p-3 gap-2", typeColor.bg)}>
            <div
              className="w-full cursor-zoom-in rounded-xl overflow-hidden border border-border/30 shadow-lg hover:scale-[1.02] transition-transform"
              onClick={() => card.imageUrl && setImgLarge(true)}
              title="Clique para ampliar"
            >
              {card.imageUrl && !imgErr ? (
                <img
                  src={largeImg || card.imageUrl}
                  alt={card.name}
                  className="w-full h-auto object-contain"
                  onError={(e) => {
                    // fallback para /small/ se /large/ falhar
                    (e.target as HTMLImageElement).src = card.imageUrl;
                    setImgErr(false);
                  }}
                />
              ) : (
                <div className="aspect-[2.5/3.5] flex flex-col items-center justify-center gap-2 p-4 bg-card/40">
                  {card.types[0] && <EnergyIcon type={card.types[0]} size={40} />}
                  <span className="text-xs text-muted-foreground text-center">{card.name}</span>
                </div>
              )}
            </div>
            {owned && (
              <div className="flex items-center gap-1 bg-primary/20 text-primary text-[10px] font-bold px-2 py-1 rounded-full border border-primary/30">
                <Check className="h-3 w-3" /> Na coleção
              </div>
            )}
          </div>

          {/* Coluna direita — info + preços */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto" style={{ maxHeight: "90vh" }}>

            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-border/40 shrink-0">
              <p className="font-display font-bold text-base leading-tight">{card.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{card.setName} · #{card.number}</p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {card.rarity && (
                  <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", rarityBadge(card.rarity))}>
                    {card.rarity}
                  </span>
                )}
                {card.hp && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background/40 border border-border/50 text-muted-foreground">
                    HP {card.hp}
                  </span>
                )}
                {card.types.map((t) => <TypeBadge key={t} type={t} />)}
              </div>
            </div>

            {/* Preços */}
            <div className="flex-1 p-4 space-y-3">

              {/* MYP — mercado nacional: floor em destaque */}
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-elevated border-b border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mercado Pokémon BR</p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">MYP</span>
                </div>
                {pricesLoading ? (
                  <div className="flex items-center justify-center py-3 gap-2 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-[11px]">Buscando…</span>
                  </div>
                ) : prices && isMYP && (prices.floorLive != null || prices.avg != null) ? (
                  <>
                    <div className="px-4 py-3 flex items-end justify-between gap-3">
                      {/* Floor real — menor listagem ativa agora (scraping) */}
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                          {mypSparse ? "Listagem única" : "Floor price"}
                        </p>
                        <p className="text-xl font-bold font-display text-primary leading-none">
                          {fmtBrl(prices.floorLive ?? prices.avg)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">menor oferta ativa agora</p>
                      </div>
                      {/* Média histórica — referência secundária */}
                      {!mypSparse && prices.avg != null && (
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Médio hist.</p>
                          <p className="text-sm font-semibold text-muted-foreground">{fmtBrl(prices.avg)}</p>
                          {prices.qty != null && (
                            <p className="text-[10px] text-muted-foreground">{prices.qty} disponíve{prices.qty > 1 ? "is" : "l"}</p>
                          )}
                        </div>
                      )}
                    </div>
                    {prices.link && (
                      <a href={prices.link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 w-full py-1.5 border-t border-border/40 text-[11px] text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all">
                        <ArrowRight className="h-3 w-3" /> Ver no MYP
                      </a>
                    )}
                  </>
                ) : !pricesLoading && (
                  <p className="text-[11px] text-muted-foreground text-center py-3">Sem listagens no mercado BR</p>
                )}
              </div>

              {/* TCGPlayer — só aparece quando MYP não tem listagem */}
              {!pricesLoading && prices && !isMYP && (prices.floor != null || prices.avg != null) && (
                <div className="rounded-xl border border-border/50 overflow-hidden">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1.5 bg-surface-elevated border-b border-border/40">
                    TCGPlayer <span className="text-[9px] font-normal opacity-60">(sem listagem nacional — convertido p/ BRL)</span>
                  </p>
                  <div className="px-4 py-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Floor price</p>
                      <p className="text-xl font-bold font-display leading-none">{fmtBrl(prices.floor ?? prices.avg)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">menor oferta ativa</p>
                    </div>
                    {prices.avg != null && prices.floor !== prices.avg && (
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Médio</p>
                        <p className="text-sm font-semibold text-muted-foreground">{fmtBrl(prices.avg)}</p>
                      </div>
                    )}
                  </div>
                  {prices.link && (
                    <a href={prices.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 w-full py-1.5 border-t border-border/40 text-[11px] text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all">
                      <ArrowRight className="h-3 w-3" /> Ver no TCGPlayer
                    </a>
                  )}
                </div>
              )}

              {/* Ação */}
              {loggedIn ? (
                <Button
                  className={cn(
                    "w-full font-semibold",
                    owned
                      ? "bg-primary/15 text-primary border border-primary/40 hover:bg-primary/25"
                      : "bg-gradient-gold text-background hover:opacity-90"
                  )}
                  disabled={adding || owned}
                  onClick={() => !owned && onAdd(card, prices?.floorLive ?? prices?.avg ?? null)}
                >
                  {adding ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Adicionando...</>
                  ) : owned ? (
                    <><Check className="h-4 w-4 mr-2" /> Já está na coleção</>
                  ) : (
                    <><Plus className="h-4 w-4 mr-2" /> Adicionar à coleção</>
                  )}
                </Button>
              ) : (
                <Button
                  className="w-full border border-border/60 bg-card hover:bg-surface-elevated"
                  onClick={onLoginRequired}
                >
                  <Lock className="h-4 w-4 mr-2" /> Entrar para marcar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox — ampliar para tela cheia */}
      {imgLarge && (
        <div
          className="fixed inset-0 z-[60] bg-background/97 flex items-center justify-center p-8 cursor-zoom-out"
          onClick={() => setImgLarge(false)}
        >
          <img
            src={largeImg || card.imageUrl}
            alt={card.name}
            className="max-h-[90vh] max-w-[400px] w-full object-contain rounded-2xl shadow-2xl"
            onError={(e) => { (e.target as HTMLImageElement).src = card.imageUrl; }}
          />
        </div>
      )}
    </>
  );
}

// ─── Card Tile ────────────────────────────────────────────────────────────────

function CardTile({
  card,
  owned,
  loggedIn,
  adding,
  onAdd,
  onLoginRequired,
  onOpenModal,
}: {
  card: SetCard;
  owned: boolean;
  loggedIn: boolean;
  adding: boolean;
  onAdd: (card: SetCard, floorPrice?: number | null) => void;
  onLoginRequired: () => void;
  onOpenModal: (card: SetCard) => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn(
        "relative group rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer",
        owned
          ? "border-primary/50 shadow-[0_0_12px_-4px_hsl(48_100%_50%/0.4)]"
          : "border-border/40 hover:border-border/70"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Imagem */}
      <div className="aspect-[2.5/3.5] bg-card/60 relative">
        {card.imageUrl && !imgErr ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-card/40 p-2">
            {card.types[0] && <EnergyIcon type={card.types[0]} size={24} />}
            <span className="text-[10px] text-muted-foreground text-center leading-tight">{card.name}</span>
          </div>
        )}

        {owned && (
          <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow">
            <Check className="h-3 w-3 text-background" />
          </div>
        )}

        {/* Overlay hover */}
        {hovered && (
          <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center gap-1.5 p-2">
            <p className="text-[11px] font-bold text-center leading-tight line-clamp-2">{card.name}</p>
            {card.rarity && (
              <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full border", rarityBadge(card.rarity))}>
                {card.rarity}
              </span>
            )}
            {card.number && (
              <p className="text-[9px] text-muted-foreground">#{card.number}</p>
            )}
            <div className="flex flex-col gap-1 w-full mt-1">
              {/* Botão "Ver detalhes" */}
              <button
                onClick={() => onOpenModal(card)}
                className="w-full h-7 rounded-md text-[10px] font-semibold border border-border/70 bg-surface-elevated text-foreground hover:bg-card hover:border-primary/40 transition-colors"
              >
                Ver detalhes
              </button>
              {/* Botão de marcar */}
              {loggedIn ? (
                <button
                  onClick={() => !owned && onAdd(card)}
                  disabled={adding || owned}
                  className={cn(
                    "w-full h-7 rounded-md text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors",
                    owned
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-gradient-gold text-background hover:opacity-90"
                  )}
                >
                  {adding ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : owned ? (
                    <><Check className="h-3 w-3" /> Tenho</>
                  ) : (
                    <><Plus className="h-3 w-3" /> Tenho essa</>
                  )}
                </button>
              ) : (
                <button
                  onClick={onLoginRequired}
                  className="w-full h-7 rounded-md text-[10px] font-semibold border border-border/60 bg-card/80 text-muted-foreground hover:text-foreground hover:border-border transition-colors flex items-center justify-center gap-1"
                >
                  <Lock className="h-3 w-3" /> Marcar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info abaixo */}
      <div className="p-1.5 bg-card/40">
        <p className="text-[10px] font-medium truncate">{card.name}</p>
        <div className="flex items-center justify-between gap-1">
          <p className={cn("text-[9px] font-medium", rarityColor(card.rarity))}>{card.rarity?.split(" ").slice(-1)[0]}</p>
          {card.types[0] && <EnergyIcon type={card.types[0]} size={12} />}
        </div>
      </div>
    </div>
  );
}

// ─── SetDetail ────────────────────────────────────────────────────────────────

const SetDetail = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const session = getSession();

  const [setInfo, setSetInfo] = useState<SetInfo | null>(null);
  const [cards, setCards] = useState<SetCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [selectedCard, setSelectedCard] = useState<SetCard | null>(null);

  const { portfolios, fetchPortfolios, addItem } = usePortfolios();
  const { open: openAuth } = useAuthModal();

  const baseUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3001/api").replace(/\/api$/, "");

  useEffect(() => {
    if (!setId) return;
    setLoading(true);

    fetch(`${baseUrl}/api/public/sets`)
      .then((r) => r.json())
      .then((data: SetInfo[]) => {
        const found = data.find((s) => s.id === setId);
        if (found) setSetInfo(found);
      })
      .catch(() => {});

    fetch(`${baseUrl}/api/public/sets/${setId}/cards`)
      .then((r) => r.json())
      .then((data) => { if (data?.cards) setCards(data.cards); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setId]);

  useEffect(() => {
    if (!session || !setId) return;
    api.get(`/portfolios/set-ownership/${setId}`)
      .then(({ data }) => setOwnedIds(new Set(data.ownedTcgIds ?? [])))
      .catch(() => {});
  }, [session, setId]);

  useEffect(() => {
    if (session && !portfolios.length) fetchPortfolios();
  }, [session]);

  const defaultPortfolio = portfolios.find((p) => p.isDefault) ?? portfolios[0];

  const handleAdd = useCallback(async (card: SetCard, floorPrice?: number | null) => {
    if (!session) return;
    if (!defaultPortfolio) {
      modal.error("Sem portfólio", "Crie um portfólio antes de adicionar cartas.");
      return;
    }
    setAddingId(card.tcgId);
    try {
      // purchasePrice = floor do MYP quando disponível — menor oferta ativa no mercado BR
      await addItem(defaultPortfolio._id, card.tcgId, 1, "NM", false, "", floorPrice ?? null, {
        name: card.name, setName: card.setName, setCode: setId ?? "",
        number: card.number, rarity: card.rarity, types: card.types,
        imageUrl: card.imageUrl, supertype: card.supertype, subtypes: card.subtypes, hp: card.hp,
      });
      setOwnedIds((prev) => new Set([...prev, card.tcgId]));
      modal.success("Adicionado!", `${card.name} adicionada à sua coleção.`);
    } catch {
      modal.error("Erro", "Não foi possível adicionar a carta.");
    } finally {
      setAddingId(null);
    }
  }, [session, defaultPortfolio, addItem, setId]);

  const handleLoginRequired = () => openAuth("signup");

  const handleBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate("/sets");
  };

  const allTypes = Array.from(new Set(cards.flatMap((c) => c.types))).filter(Boolean).sort();
  const allRarities = Array.from(new Set(cards.map((c) => c.rarity))).filter(Boolean).sort();

  const filtered = cards.filter((c) => {
    const typeOk = filter === "all" || c.types.includes(filter);
    const rarityOk = rarityFilter === "all" || c.rarity === rarityFilter;
    return typeOk && rarityOk;
  });

  const ownedCount = cards.filter((c) => ownedIds.has(c.tcgId)).length;
  const pct = cards.length > 0 ? Math.round((ownedCount / cards.length) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      {/* Sub-header do set */}
      <div className="border-b border-border/40 bg-card/30">
        <div className="container flex items-center gap-3 py-3">
          <button
            onClick={handleBack}
            className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {setInfo?.logo && (
            <img src={setInfo.logo} alt={setInfo.name} className="h-7 object-contain" />
          )}

          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-base truncate">
              {setInfo?.name ?? setId}
            </h1>
            <p className="text-xs text-muted-foreground">
              {setInfo?.series} · {setInfo?.releaseDate?.split("-")[0]} · {cards.length} cartas
            </p>
          </div>

          {session && cards.length > 0 && (
            <div className="hidden sm:flex flex-col items-end gap-1">
              <p className="text-xs text-muted-foreground">
                <span className="text-primary font-bold text-sm">{ownedCount}</span>/{cards.length}
              </p>
              <div className="w-28 h-1.5 rounded-full bg-border">
                <div className="h-full rounded-full bg-gradient-gold transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container py-5 flex-1">

        {/* Progresso mobile */}
        {session && cards.length > 0 && (
          <div className="sm:hidden mb-4 p-3 rounded-xl border border-border/50 bg-card/40">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Progresso</p>
              <p className="text-sm"><span className="text-primary font-bold">{ownedCount}</span>/{cards.length} · {pct}%</p>
            </div>
            <div className="h-2 rounded-full bg-border">
              <div className="h-full rounded-full bg-gradient-gold transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {/* Filtros */}
        {!loading && cards.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4 items-center">
            {/* Tipos */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setFilter("all")}
                className={cn("px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                  filter === "all"
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "border-border/50 text-muted-foreground hover:text-foreground")}
              >Todos</button>
              {allTypes.map((type) => (
                <button key={type} onClick={() => setFilter(type)}
                  className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-colors",
                    filter === type
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "border-border/50 text-muted-foreground hover:text-foreground")}
                >
                  <EnergyIcon type={type} size={12} />{type}
                </button>
              ))}
            </div>

            {/* Raridade — select estilizado */}
            <div className="ml-auto">
              <select
                value={rarityFilter}
                onChange={(e) => setRarityFilter(e.target.value)}
                className="h-8 px-3 pr-7 rounded-full text-xs font-medium border border-border/60 bg-card text-foreground focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
              >
                <option value="all">Todas raridades</option>
                {allRarities.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Contagem */}
        {!loading && (
          <p className="text-xs text-muted-foreground mb-3">
            {filtered.length === cards.length ? `${cards.length} cartas` : `${filtered.length} de ${cards.length} cartas`}
            {session && ` · ${ownedCount} possuídas`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="aspect-[2.5/3.5] rounded-xl bg-card/40 animate-pulse border border-border/30" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Star className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>Nenhuma carta encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
            {filtered.map((card) => (
              <CardTile
                key={card.tcgId}
                card={card}
                owned={ownedIds.has(card.tcgId)}
                loggedIn={!!session}
                adding={addingId === card.tcgId}
                onAdd={handleAdd}
                onLoginRequired={handleLoginRequired}
                onOpenModal={setSelectedCard}
              />
            ))}
          </div>
        )}

        {/* CTA não logado */}
        {!session && !loading && (
          <div className="mt-8 text-center p-6 rounded-xl border border-border/40 bg-card/30">
            <p className="text-sm text-muted-foreground mb-3">
              Crie uma conta para marcar as cartas e acompanhar seu progresso.
            </p>
            <button
              onClick={() => openAuth("signup")}
              className="inline-flex items-center gap-2 bg-gradient-gold text-background font-semibold text-sm px-5 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Criar conta grátis
            </button>
          </div>
        )}
      </div>

      <PublicFooter />

      {/* Modal de detalhe da carta */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          owned={ownedIds.has(selectedCard.tcgId)}
          loggedIn={!!session}
          adding={addingId === selectedCard.tcgId}
          onAdd={handleAdd}
          onClose={() => setSelectedCard(null)}
          onLoginRequired={handleLoginRequired}
        />
      )}
    </div>
  );
};

export default SetDetail;
