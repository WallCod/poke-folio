import { create } from "zustand";

export type ModalType = "success" | "error" | "warning" | "info";

interface ModalState {
  open: boolean;
  type: ModalType;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  show: (opts: {
    type: ModalType;
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  }) => void;
  hide: () => void;
}

export const useAppModal = create<ModalState>((set) => ({
  open: false,
  type: "info",
  title: "",
  message: "",
  actionLabel: undefined,
  onAction: undefined,
  show: (opts) => set({ open: true, ...opts }),
  hide: () => set({ open: false }),
}));

// Helpers estilo toast — mesma API de uso
export const modal = {
  success: (title: string, message = "") =>
    useAppModal.getState().show({ type: "success", title, message }),
  error: (title: string, message = "") =>
    useAppModal.getState().show({ type: "error", title, message }),
  warning: (title: string, message = "") =>
    useAppModal.getState().show({ type: "warning", title, message }),
  info: (title: string, message = "") =>
    useAppModal.getState().show({ type: "info", title, message }),
  action: (opts: {
    type: ModalType;
    title: string;
    message: string;
    actionLabel: string;
    onAction: () => void;
  }) => useAppModal.getState().show(opts),
};
