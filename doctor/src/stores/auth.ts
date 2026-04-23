import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { loginDoctor, logoutDoctor, registerDoctor } from "../utils/api";
import { User } from "../types";

type AuthState = {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserName: (name: string) => void;
  setHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      hydrated: false,
      loginWithEmail: async (email, password) => {
        const { token, role, name } = await loginDoctor(email, password);
        if (role !== "doctor") {
          throw new Error("Only doctors can sign in here.");
        }
        set({
          token,
          user: {
            id: email,
            email,
            provider: "email",
            name: name || email.split("@")[0]
          },
          hydrated: true
        });
      },
      registerWithEmail: async (name, email, password) => {
        const { token, role } = await registerDoctor(name, email, password);
        if (role !== "doctor") {
          throw new Error("Signup is restricted to doctors.");
        }
        set({
          token,
          user: {
            id: email,
            email,
            provider: "email",
            name: name || email.split("@")[0]
          },
          hydrated: true
        });
      },
      logout: async () => {
        const token = get().token;
        if (token) {
          try {
            await logoutDoctor(token);
          } catch (error) {
          }
        }
        set({ user: null, token: null, hydrated: true });
      },
      updateUserName: (name) => {
        set((state) => ({
          user: state.user ? { ...state.user, name } : state.user
        }));
      },
      setHydrated: (value) => {
        set({ hydrated: value });
      }
    }),
    {
      name: "doctor-app-auth",
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      }
    }
  )
);
