import { create } from "zustand";

export type AuthView = "login" | "signup" | "forgot" | "forgot-sent" | "reset" | null;

interface AuthModalState {
  view: AuthView;
  open: (v: Exclude<AuthView, null>) => void;
  close: () => void;
}

export const useAuthModal = create<AuthModalState>((set) => ({
  view: null,
  open: (v) => set({ view: v }),
  close: () => set({ view: null }),
}));
