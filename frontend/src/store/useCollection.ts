import { create } from "zustand";

export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "holo"
  | "ultra"
  | "secret";

export type Condition = "Mint" | "NM" | "LP" | "MP" | "HP";

export interface Card {
  id: string;
  name: string;
  set: string;
  setCode: string;
  number: string;
  rarity: Rarity;
  type: string;
  artist: string;
  year: number;
  imageUrl?: string;
  marketPrice: number; // in selected currency
}

export interface OwnedCard extends Card {
  quantity: number;
  condition: Condition;
  foil: boolean;
  addedAt: string;
}

interface CollectionState {
  cards: OwnedCard[];
  loading: boolean;
  currency: "BRL" | "USD";
  setCurrency: (c: "BRL" | "USD") => void;
  addCard: (card: OwnedCard) => void;
  removeCard: (id: string) => void;
}

export const useCollection = create<CollectionState>((set) => ({
  cards: [],
  loading: false,
  currency: "BRL",
  setCurrency: (c) => set({ currency: c }),
  addCard: (card) =>
    set((s) => ({ cards: [card, ...s.cards] })),
  removeCard: (id) =>
    set((s) => ({ cards: s.cards.filter((c) => c.id !== id) })),
}));

interface UserState {
  name: string;
  email: string;
  memberSince: string;
}

export const useUser = create<UserState>(() => ({
  name: "Treinador",
  email: "treinador@pokefolio.app",
  memberSince: "2024",
}));
