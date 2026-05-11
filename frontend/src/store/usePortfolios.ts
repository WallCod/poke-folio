import { create } from 'zustand';
import api from '@/lib/api';
import { cardApi } from '@/lib/api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Condition = 'Mint' | 'NM' | 'LP' | 'MP' | 'HP';

export interface TcgCard {
  _id: string;
  tcgId: string;
  name: string;
  setName: string;
  setCode: string;
  number: string;
  rarity: string;
  types: string[];
  artist: string;
  imageUrl: string;
  imageUrlHiRes: string;
  marketPriceUsd: number | null;
  marketPriceBrl: number | null;
  marketPriceBrlMin: number | null;
  marketPriceBrlMax: number | null;
  previousPriceBrl: number | null;
  priceChangePct: number | null;
  priceSource: string;
  supertype: string;
  subtypes: string[];
  hp: string;
  lang?: string;
  mypAvg?: number | null;
  mypTcgPriceUsd?: number | null;
  mypAvailableQty?: number | null;
  mypLink?: string | null;
  editionPt?: string | null;
  editionEn?: string | null;
}

export interface PortfolioItem {
  _id: string;
  portfolioId: string;
  tcgId: string;
  cardId: TcgCard;
  quantity: number;
  condition: Condition;
  foil: boolean;
  notes: string;
  purchasePrice: number | null;
  purchasedAt: string | null;
  addedAt: string;
}

export interface Portfolio {
  _id: string;
  name: string;
  description: string;
  isDefault: boolean;
  createdAt: string;
  totalCards: number;
  totalValueBrl: number;
}

// Resultado de busca na API TCG (antes de salvar no BD)
export interface TcgSearchResult {
  tcgId: string;
  name: string;
  setName: string;
  setCode: string;
  number: string;
  rarity: string;
  types: string[];
  artist: string;
  imageUrl: string;
  imageUrlHiRes: string;
  marketPriceUsd: number | null;
  marketPriceBrl: number | null;
  supertype: string;
  subtypes: string[];
  hp: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface PortfolioStore {
  portfolios: Portfolio[];
  activePortfolioId: string | null;
  items: PortfolioItem[];
  currency: 'BRL' | 'USD';
  loadingPortfolios: boolean;
  loadingItems: boolean;

  setCurrency: (c: 'BRL' | 'USD') => void;
  setActivePortfolio: (id: string) => void;

  fetchPortfolios: () => Promise<void>;
  createPortfolio: (name: string, description?: string) => Promise<Portfolio>;
  updatePortfolio: (id: string, name: string, description?: string) => Promise<void>;
  deletePortfolio: (id: string) => Promise<void>;

  fetchItems: (portfolioId: string) => Promise<void>;
  fetchAllItems: () => Promise<void>;
  refreshPrices: () => Promise<void>;
  addItem: (portfolioId: string, tcgId: string, quantity: number, condition: Condition, foil: boolean, notes?: string, purchasePrice?: number | null, cardData?: Partial<TcgCard>) => Promise<void>;
  updateItem: (portfolioId: string, itemId: string, patch: Partial<Pick<PortfolioItem, 'quantity' | 'condition' | 'foil' | 'notes' | 'purchasePrice'>>) => Promise<void>;
  removeItem: (portfolioId: string, itemId: string) => Promise<void>;
}

export const usePortfolios = create<PortfolioStore>((set, get) => ({
  portfolios: [],
  activePortfolioId: null,
  items: [],
  currency: 'BRL',
  loadingPortfolios: false,
  loadingItems: false,

  setCurrency: (c) => set({ currency: c }),

  setActivePortfolio: (id) => {
    set({ activePortfolioId: id, items: [] });
    get().fetchItems(id);
  },

  fetchPortfolios: async () => {
    set({ loadingPortfolios: true });
    try {
      const { data } = await api.get<Portfolio[]>('/portfolios');
      const activeId = get().activePortfolioId ?? data.find((p) => p.isDefault)?._id ?? data[0]?._id ?? null;
      set({ portfolios: data, activePortfolioId: activeId, loadingPortfolios: false });
      if (activeId) get().fetchItems(activeId);
    } catch {
      set({ loadingPortfolios: false });
    }
  },

  createPortfolio: async (name, description = '') => {
    const { data } = await api.post<Portfolio>('/portfolios', { name, description });
    set((s) => ({ portfolios: [...s.portfolios, data] }));
    return data;
  },

  updatePortfolio: async (id, name, description) => {
    const { data } = await api.patch<Portfolio>(`/portfolios/${id}`, { name, description });
    set((s) => ({
      portfolios: s.portfolios.map((p) => (p._id === id ? { ...p, ...data } : p)),
    }));
  },

  deletePortfolio: async (id) => {
    await api.delete(`/portfolios/${id}`);
    const remaining = get().portfolios.filter((p) => p._id !== id);
    const newActive = remaining.find((p) => p.isDefault)?._id ?? remaining[0]?._id ?? null;
    set({ portfolios: remaining, activePortfolioId: newActive, items: [] });
    if (newActive) get().fetchItems(newActive);
  },

  fetchItems: async (portfolioId) => {
    set({ loadingItems: true });
    try {
      const { data } = await api.get<PortfolioItem[]>(`/portfolios/${portfolioId}/items`);
      set({ items: data, loadingItems: false });
    } catch {
      set({ loadingItems: false });
    }
  },

  fetchAllItems: async () => {
    const { portfolios } = get();
    if (!portfolios.length) return;
    set({ loadingItems: true });
    try {
      const results = await Promise.all(
        portfolios.map((p) => api.get<PortfolioItem[]>(`/portfolios/${p._id}/items`))
      );
      const allItems = results.flatMap((r) => r.data);
      set({ items: allItems, loadingItems: false });
    } catch {
      set({ loadingItems: false });
    }
  },

  // Força refresh de preços no backend e depois recarrega todos os itens
  refreshPrices: async () => {
    const { portfolios } = get();
    if (!portfolios.length) return;
    try {
      await cardApi.refreshPrices().catch(() => {});
      // Recarrega itens de todos os portfolios e totais atualizados
      const [itemResults, { data: pfs }] = await Promise.all([
        Promise.all(portfolios.map((p) => api.get<PortfolioItem[]>(`/portfolios/${p._id}/items`))),
        api.get<Portfolio[]>('/portfolios'),
      ]);
      const allItems = itemResults.flatMap((r) => r.data);
      set({ items: allItems, portfolios: pfs });
    } catch {}
  },

  addItem: async (portfolioId, tcgId, quantity, condition, foil, notes = '', purchasePrice = null, cardData) => {
    const { data } = await api.post<PortfolioItem>(`/portfolios/${portfolioId}/items`, {
      tcgId, quantity, condition, foil, notes, purchasePrice,
      ...(cardData ? { cardData } : {}),
    });
    set((s) => {
      const idx = s.items.findIndex((i) => i._id === data._id);
      const items = idx >= 0
        ? s.items.map((i) => (i._id === data._id ? data : i))
        : [data, ...s.items];
      return {
        items,
        portfolios: s.portfolios.map((p) =>
          p._id === portfolioId
            ? { ...p, totalCards: p.totalCards + quantity }
            : p
        ),
      };
    });
  },

  updateItem: async (portfolioId, itemId, patch) => {
    const { data } = await api.patch<PortfolioItem>(`/portfolios/${portfolioId}/items/${itemId}`, patch);
    set((s) => ({
      items: s.items.map((i) => (i._id === itemId ? { ...i, ...data } : i)),
    }));
  },

  removeItem: async (portfolioId, itemId) => {
    const item = get().items.find((i) => i._id === itemId);
    await api.delete(`/portfolios/${portfolioId}/items/${itemId}`);
    set((s) => ({
      items: s.items.filter((i) => i._id !== itemId),
      portfolios: s.portfolios.map((p) =>
        p._id === portfolioId
          ? { ...p, totalCards: Math.max(0, p.totalCards - (item?.quantity ?? 1)) }
          : p
      ),
    }));
  },
}));
