import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AdminUser } from "../types";
import { login as loginRequest } from "../utils/api";

type AuthState = {
  user: AdminUser | null;
  token: string | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  markHydrated: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hydrated: false,
      login: async (email, password) => {
        const { token, role } = await loginRequest(email, password);
        if (role !== "admin" && role !== "super") {
          throw new Error("Not authorized for admin console");
        }
        const normalizedRole: AdminUser["role"] = role === "super" ? "super" : "admin";
        set({
          token,
          user: {
            id: email,
            email,
            provider: "email",
            role: normalizedRole
          },
          hydrated: true
        });
      },
      logout: () => set({ user: null, token: null, hydrated: true }),
      markHydrated: () => set({ hydrated: true })
    }),
    {
      name: "admin-auth",
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Failed to rehydrate auth store", error);
        }
        state?.markHydrated();
      }
    }
  )
);
