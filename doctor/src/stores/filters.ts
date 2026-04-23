import { create } from "zustand";
import { persist } from "zustand/middleware";

type FilterState = {
  name: string;
  minAge?: number;
  maxAge?: number;
  registeredFrom?: string;
  registeredTo?: string;
  showVerified: boolean;
  appliedName: string;
  appliedMinAge?: number;
  appliedMaxAge?: number;
  appliedRegisteredFrom?: string;
  appliedRegisteredTo?: string;
  appliedShowVerified: boolean;
  setName: (value: string) => void;
  setAgeRange: (min?: number, max?: number) => void;
  setRegisteredRange: (from?: string, to?: string) => void;
  setShowVerified: (value: boolean) => void;
  apply: () => void;
  reset: () => void;
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      name: "",
      minAge: undefined,
      maxAge: undefined,
      registeredFrom: undefined,
      registeredTo: undefined,
      showVerified: true,
      appliedName: "",
      appliedMinAge: undefined,
      appliedMaxAge: undefined,
      appliedRegisteredFrom: undefined,
      appliedRegisteredTo: undefined,
      appliedShowVerified: true,
      setName: (value) => set({ name: value }),
      setAgeRange: (min, max) => set({ minAge: min, maxAge: max }),
      setRegisteredRange: (from, to) => set({ registeredFrom: from, registeredTo: to }),
      setShowVerified: (value) => set({ showVerified: value }),
      apply: () =>
        set((state) => ({
          appliedName: state.name,
          appliedMinAge: state.minAge,
          appliedMaxAge: state.maxAge,
          appliedRegisteredFrom: state.registeredFrom,
          appliedRegisteredTo: state.registeredTo,
          appliedShowVerified: state.showVerified
        })),
      reset: () =>
        set({
          name: "",
          minAge: undefined,
          maxAge: undefined,
          registeredFrom: undefined,
          registeredTo: undefined,
          showVerified: true,
          appliedName: "",
          appliedMinAge: undefined,
          appliedMaxAge: undefined,
          appliedRegisteredFrom: undefined,
          appliedRegisteredTo: undefined,
          appliedShowVerified: true
        })
    }),
    {
      name: "doctor-filter-state",
      storage: {
        getItem: (name) => {
          const raw = sessionStorage.getItem(name);
          if (!raw) return null;
          try {
            return JSON.parse(raw);
          } catch {
            sessionStorage.removeItem(name);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            sessionStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            sessionStorage.removeItem(name);
          }
        },
        removeItem: (name) => sessionStorage.removeItem(name)
      }
    }
  )
);
