import { create } from "zustand";

type Theme = "light";

type ThemeState = {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
};

export const useThemeStore = create<ThemeState>(() => ({
  theme: "light",
  toggle: () => {},
  setTheme: () => {}
}));
