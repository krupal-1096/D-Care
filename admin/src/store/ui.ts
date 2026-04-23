import { create } from "zustand";

type Toast = {
  id: string;
  message: string;
  tone?: "success" | "error" | "info";
  duration?: number;
};

type UiState = {
  toasts: Toast[];
  pushToast: (message: string, tone?: Toast["tone"], duration?: number) => void;
  dismissToast: (id: string) => void;
};

const newId = () => Math.random().toString(16).slice(2, 8);

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  pushToast: (message, tone = "info", duration = 3500) => {
    const id = newId();
    set((state) => ({ toasts: [...state.toasts, { id, message, tone, duration }] }));
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
}));
