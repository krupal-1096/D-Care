import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getDoctorCases, verifyDoctorCase } from "../utils/api";
import { Disease, Patient } from "../types";

const bodyParts = [
  "forearm skin sample",
  "calf skin sample",
  "shin skin sample",
  "dorsal hand skin sample",
  "neck lateral skin sample",
  "ankle skin sample",
  "upper arm skin sample",
  "cheek skin sample",
  "jawline skin sample",
  "shoulder skin sample",
  "knee skin sample",
  "wrist skin sample",
  "collarbone skin sample",
  "back skin sample",
  "elbow skin sample"
];

const seededNumber = (seedSource: string, min: number, max: number) => {
  const seed = seedSource.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const range = max - min + 1;
  return min + (seed % range);
};

type PatientState = {
  patients: Patient[];
  loading: boolean;
  lastFetchedAt?: string | null;
  error: string | null;
  loadPatients: (token: string, limit?: number, options?: { force?: boolean }) => Promise<boolean>;
  verifyPatient: (token: string, id: string, diseases: Disease[], verifiedBy: string, doctorNote?: string) => Promise<void>;
};

export const usePatientStore = create<PatientState>()(
  persist(
    (set, get) => ({
      patients: [],
      loading: false,
      error: null,
      lastFetchedAt: null,
      loadPatients: async (token, limit = 100, options) => {
        if (!token) {
          set({ patients: [], lastFetchedAt: null, error: null });
          return false;
        }
        const { patients, lastFetchedAt } = get();
        const now = Date.now();
        const last = lastFetchedAt ? new Date(lastFetchedAt).getTime() : 0;
        const isFresh = last > 0 && now - last < 2 * 60 * 1000; // 2 minutes
        if (isFresh && !options?.force && patients.length > 0) {
          return true;
        }
        try {
          set({ loading: patients.length === 0, error: null });
          const remote = await getDoctorCases(token, limit);
          set({
            patients: Array.isArray(remote) ? remote : [],
            loading: false,
            lastFetchedAt: new Date().toISOString(),
            error: null
          });
          return true;
        } catch (error) {
          set({ loading: false, error: "Unable to refresh patients. Check your connection." });
          return false;
        }
      },
      verifyPatient: async (token, id, diseases, verifiedBy, doctorNote) => {
        const payload = { diseases, doctorNote };
        try {
          await verifyDoctorCase(token, id, payload);
        } catch (error) {
        }
        set((state) => ({
          patients: state.patients.map((patient) =>
            patient.id === id
              ? {
                  ...patient,
                  diseases: diseases.map((disease) => ({ ...disease })),
                  verified: true,
                  verifiedBy,
                  verifiedDate: new Date().toISOString(),
                  doctorNote: doctorNote ?? state.patients.find((p) => p.id === id)?.doctorNote
                }
              : patient
          )
        }));
      }
    }),
    {
      name: "doctor-app-patients",
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
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PatientState> | undefined;
        const hasPersistedPatients = Array.isArray(persisted?.patients) && persisted.patients.length > 0;
        return {
          ...currentState,
          ...persisted,
          patients: hasPersistedPatients ? persisted!.patients : currentState.patients
        };
      }
    }
  )
);
