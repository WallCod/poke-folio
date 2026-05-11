import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api',
  timeout: 10000,
});

// Injeta o token automaticamente em todas as requisições
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('pokefolio.session');
  if (raw) {
    try {
      const session = JSON.parse(raw);
      if (session.token) config.headers.Authorization = `Bearer ${session.token}`;
    } catch {}
  }
  return config;
});

// Se o access token expirou, tenta refresh automaticamente
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const raw = localStorage.getItem('pokefolio.session');
        const session = raw ? JSON.parse(raw) : null;
        if (session?.refreshToken) {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}/auth/refresh`,
            { refreshToken: session.refreshToken }
          );
          const updated = { ...session, token: data.token, refreshToken: data.refreshToken };
          localStorage.setItem('pokefolio.session', JSON.stringify(updated));
          original.headers.Authorization = `Bearer ${data.token}`;
          return api(original);
        }
      } catch {}
    }
    return Promise.reject(error);
  }
);

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    plan: string;
    planStatus: string;
  };
}

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
  marketPriceBrlMin: number | null;
  marketPriceBrlMax: number | null;
  priceSource: string;
  supertype: string;
  subtypes: string[];
  hp: string;
  lang?: string;          // 'EN' | 'JP' | 'POCKET' | 'PT'
  // Campos extras do MYP (presentes quando priceSource === 'mypcards')
  mypAvg?: number | null;
  mypTcgPriceUsd?: number | null;
  mypAvailableQty?: number | null;
  mypLink?: string | null;
  editionPt?: string | null;
  editionEn?: string | null;
}

export interface PricePoint {
  priceBrl: number;
  priceUsd: number | null;
  source: string;
  recordedAt: string;
}

export const cardApi = {
  search: (q: string, page = 1, pageSize = 48) =>
    api.get<{ cards: TcgSearchResult[]; totalCount: number; page: number; pageSize: number }>(
      `/cards/search`, { params: { q, page, pageSize } }
    ),

  getCard: (tcgId: string) =>
    api.get<{ card: TcgSearchResult; prices: { usd: number | null; brl: number | null }; fresh: boolean }>(
      `/cards/${tcgId}`
    ),

  priceHistory: (tcgId: string, days = 90) =>
    api.get<PricePoint[]>(`/cards/${tcgId}/price-history`, { params: { days } }),

  refreshPrices: () =>
    api.post<{ updated: number; total: number }>('/cards/refresh-prices'),
};

export interface MarketCard {
  tcgId: string;
  name: string;
  setName: string;
  setCode: string;
  rarity: string;
  imageUrl: string;
  imageUrlHiRes?: string;
  marketPriceBrl: number | null;
  marketPriceUsd: number | null;
  types: string[];
  totalQty?: number;
  holders?: number;
}

export interface MarketTop {
  topValued: MarketCard[];
  popular: MarketCard[];
  recent: MarketCard[];
}

export const marketApi = {
  top: () => api.get<MarketTop>('/market/top'),
};

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<{ message: string }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  verifyEmail: (token: string) =>
    api.get<AuthResponse>(`/auth/verify-email/${token}`),

  me: () => api.get('/auth/me'),
};

export default api;
