import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Check, Plus, Loader2, Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnergyIcon } from "@/components/EnergyIcon";
import { getSession } from "@/lib/auth";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { modal } from "@/store/useAppModal";
import { usePortfolios } from "@/store/usePortfolios";

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
  "Common":                "text-gray-400",
  "Uncommon":              "text-green-400",
  "Rare":                  "text-blue-400",
  "Rare Holo":             "text-blue-400",
  "Rare Holo EX":          "text-purple-400",
  "Rare Holo GX":          "text-purple-400",
  "Rare Holo V":           "text-purple-400",
  "Rare Ultra":            "text-yellow-400",
  "Rare Secret":           "text-pink-400",
  "Rare Rainbow":          "text-pink-400",
  "Promo":                 "text-orange-400",
  "Illustration Rare":     "text-indigo-400",
  "Special Illustration Rare": "text-pink-400",
  "Hyper Rare":            "text-yellow-300",
};

function rarityColor(rarity: string): string {
  return RARITY_COLOR[rarity] ?? "text-muted-foreground";
}

function CardTile({
  card,
  owned,
  loggedIn,
  adding,
  onAdd,
  onLoginRequired,
}: {
  card: SetCard;
  owned: boolean;
  loggedIn: boolean;
  adding: boolean;
  onAdd: (card: SetCard) => void;
  onLoginRequired: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn(
        "relative group rounded-xl overflow-hidden border transition-all duration-200",
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

        {/* Overlay de owned */}
        {owned && (
          <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow">
            <Check className="h-3 w-3 text-background" />
          </div>
        )}

        {/* Overlay de ação no hover */}
        {hovered && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-2">
            <p className="text-xs font-semibold text-center leading-tight">{card.name}</p>
            <p className={cn("text-[10px]", rarityColor(card.rarity))}>{card.rarity}</p>
            {card.number && (
              <p className="text-[10px] text-muted-foreground">#{card.number}</p>
            )}
            {loggedIn ? (
              <Button
                size="sm"
                className={cn(
                  "h-7 text-[10px] px-2 mt-1",
                  owned
                    ? "bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30"
                    : "bg-gradient-gold text-background hover:opacity-90"
                )}
                onClick={() => !owned && onAdd(card)}
                disabled={adding}
              >
                {adding ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : owned ? (
                  <><Check className="h-3 w-3 mr-1" /> Tenho</>
                ) : (
                  <><Plus className="h-3 w-3 mr-1" /> Tenho essa</>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-7 text-[10px] px-2 mt-1 border border-border/60 bg-card/60 hover:bg-surface-elevated"
                onClick={onLoginRequired}
              >
                <Lock className="h-3 w-3 mr-1" /> Marcar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Info abaixo */}
      <div className="p-1.5 bg-card/40">
        <p className="text-[10px] font-medium truncate">{card.name}</p>
        <div className="flex items-center justify-between gap-1">
          <p className={cn("text-[9px]", rarityColor(card.rarity))}>{card.rarity?.split(" ").slice(-1)[0]}</p>
          {card.types[0] && <EnergyIcon type={card.types[0]} size={12} />}
        </div>
      </div>
    </div>
  );
}

const SetDetail = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const session = getSession();

  const [setInfo, setSetInfo] = useState<SetInfo | null>(null);
  const [cards, setCards] = useState<SetCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [ownershipLoading, setOwnershipLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [rarityFilter, setRarityFilter] = useState<string>("all");

  const { portfolios, fetchPortfolios, addItem } = usePortfolios();

  const baseUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3001/api").replace(/\/api$/, "");

  // Carrega info do set e cartas
  useEffect(() => {
    if (!setId) return;
    setLoading(true);

    // Info do set (da lista de sets)
    fetch(`${baseUrl}/api/public/sets`)
      .then((r) => r.json())
      .then((data: SetInfo[]) => {
        const found = data.find((s) => s.id === setId);
        if (found) setSetInfo(found);
      })
      .catch(() => {});

    // Cartas do set
    fetch(`${baseUrl}/api/public/sets/${setId}/cards`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.cards) setCards(data.cards);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setId]);

  // Carrega ownership do usuário logado
  useEffect(() => {
    if (!session || !setId) return;
    setOwnershipLoading(true);
    api.get(`/portfolios/set-ownership/${setId}`)
      .then(({ data }) => {
        setOwnedIds(new Set(data.ownedTcgIds ?? []));
      })
      .catch(() => {})
      .finally(() => setOwnershipLoading(false));
  }, [session, setId]);

  // Carrega portfólios se logado
  useEffect(() => {
    if (session && !portfolios.length) fetchPortfolios();
  }, [session]);

  const defaultPortfolio = portfolios.find((p) => p.isDefault) ?? portfolios[0];

  const handleAdd = useCallback(async (card: SetCard) => {
    if (!session) return;
    if (!defaultPortfolio) {
      modal.error("Sem portfólio", "Crie um portfólio antes de adicionar cartas.");
      return;
    }
    setAddingId(card.tcgId);
    try {
      await addItem(
        defaultPortfolio._id,
        card.tcgId,
        1,
        "NM",
        false,
        "",
        null,
        {
          name:      card.name,
          setName:   card.setName,
          setCode:   setId ?? "",
          number:    card.number,
          rarity:    card.rarity,
          types:     card.types,
          imageUrl:  card.imageUrl,
          supertype: card.supertype,
          subtypes:  card.subtypes,
          hp:        card.hp,
        }
      );
      setOwnedIds((prev) => new Set([...prev, card.tcgId]));
    } catch {
      modal.error("Erro", "Não foi possível adicionar a carta.");
    } finally {
      setAddingId(null);
    }
  }, [session, defaultPortfolio, addItem, setId]);

  const handleLoginRequired = () => {
    navigate("/", { state: { openModal: "signup" } });
  };

  // Tipos únicos presentes no set
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
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="border-b border-border/50 bg-card/40 backdrop-blur sticky top-0 z-20">
        <div className="container flex items-center gap-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {setInfo?.logo && (
            <img src={setInfo.logo} alt={setInfo.name} className="h-8 object-contain" />
          )}

          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-lg truncate">
              {setInfo?.name ?? setId}
            </h1>
            <p className="text-xs text-muted-foreground">
              {setInfo?.series} · {setInfo?.releaseDate?.split("-")[0]} · {cards.length} cartas
            </p>
          </div>

          {session && cards.length > 0 && (
            <div className="hidden sm:flex flex-col items-end gap-1">
              <p className="text-xs text-muted-foreground">
                <span className="text-primary font-bold text-sm">{ownedCount}</span>
                /{cards.length} possuídas
              </p>
              <div className="w-32 h-1.5 rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-gradient-gold transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container py-6">

        {/* Progresso mobile */}
        {session && cards.length > 0 && (
          <div className="sm:hidden mb-5 p-4 rounded-xl border border-border/50 bg-card/40">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Progresso do set</p>
              <p className="text-sm">
                <span className="text-primary font-bold">{ownedCount}</span>/{cards.length} · {pct}%
              </p>
            </div>
            <div className="h-2 rounded-full bg-border">
              <div
                className="h-full rounded-full bg-gradient-gold transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Filtros */}
        {!loading && cards.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {/* Filtro por tipo */}
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                  filter === "all"
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "border-border/50 text-muted-foreground hover:text-foreground"
                )}
              >
                Todos
              </button>
              {allTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-colors",
                    filter === type
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "border-border/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <EnergyIcon type={type} size={12} />
                  {type}
                </button>
              ))}
            </div>

            {/* Filtro por raridade */}
            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              className="ml-auto px-2.5 py-1 rounded-full text-xs font-medium border border-border/50 bg-card/60 text-muted-foreground focus:outline-none focus:border-primary/40"
            >
              <option value="all">Todas raridades</option>
              {allRarities.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}

        {/* Contagem */}
        {!loading && (
          <p className="text-xs text-muted-foreground mb-4">
            {filtered.length === cards.length
              ? `${cards.length} cartas`
              : `${filtered.length} de ${cards.length} cartas`}
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
            <p>Nenhuma carta encontrada para os filtros selecionados.</p>
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
              />
            ))}
          </div>
        )}

        {/* CTA não logado */}
        {!session && !loading && (
          <div className="mt-8 text-center p-6 rounded-xl border border-border/40 bg-card/30">
            <p className="text-sm text-muted-foreground mb-3">
              Crie uma conta para marcar as cartas que você possui e acompanhar seu progresso.
            </p>
            <Link
              to="/"
              state={{ openModal: "signup" }}
              className="inline-flex items-center gap-2 bg-gradient-gold text-background font-semibold text-sm px-5 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Criar conta grátis
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetDetail;
