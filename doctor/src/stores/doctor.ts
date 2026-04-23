import { create } from "zustand";
import { getDoctorProfile, updateDoctorProfile } from "../utils/api";
import { DoctorProfile } from "../types";

type DoctorState = {
  profile: DoctorProfile | null;
  loading: boolean;
  error: string | null;
  loadProfile: (token: string) => Promise<void>;
  saveProfile: (token: string, updates: Partial<DoctorProfile>) => Promise<DoctorProfile | null>;
};

export const useDoctorStore = create<DoctorState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,
  loadProfile: async (token) => {
    if (!token) return;
    try {
      set({ loading: true, error: null });
      const profile = await getDoctorProfile(token);
      set({ profile, loading: false });
    } catch (error) {
      set({ loading: false, error: "Could not load profile" });
    }
  },
  saveProfile: async (token, updates) => {
    if (!token) return null;
    try {
      set({ loading: true, error: null });
      const saved = await updateDoctorProfile(token, { name: updates.name });
      set({ profile: saved, loading: false });
      return saved;
    } catch (error) {
      set({ loading: false, error: "Update failed" });
      return null;
    }
  }
}));
