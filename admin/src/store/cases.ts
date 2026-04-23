import { create } from "zustand";
import { AdminCase, Doctor } from "../types";
import { createCase, deleteCase as deleteCaseRequest, getCases, getDoctors, updateCase as updateCaseRequest, verifyCase } from "../utils/api";

export const seedDoctors: Doctor[] = [
  {
    id: "d-01",
    name: "Dr. Kavita Rao",
    email: "kavita.rao@doctor.app",
    firstLogin: "2024-07-10",
    lastLogin: "2025-02-03",
    verifiedCount: 22
  },
  {
    id: "d-02",
    name: "Dr. Ishan Mehta",
    email: "ishan.mehta@doctor.app",
    firstLogin: "2024-08-14",
    lastLogin: "2025-01-30",
    verifiedCount: 18
  },
  {
    id: "d-03",
    name: "Dr. Leena Bose",
    email: "leena.bose@doctor.app",
    firstLogin: "2024-09-02",
    lastLogin: "2025-02-09",
    verifiedCount: 25
  },
  {
    id: "d-04",
    name: "Dr. Arjun Menon",
    email: "arjun.menon@doctor.app",
    firstLogin: "2024-10-11",
    lastLogin: "2025-02-06",
    verifiedCount: 12
  }
];

const seedCases: AdminCase[] = [
  {
    id: "c-01",
    patientName: "Aarav Sharma",
    email: "aarav.sharma@clinic.in",
    age: 32,
    condition: "Eczema flare - left forearm",
    registeredDate: "2025-01-05",
    verified: false,
    doctor: "Dr. Ishan Mehta",
    priority: "medium"
  },
  {
    id: "c-02",
    patientName: "Meera Iyer",
    email: "meera.iyer@clinic.in",
    age: 41,
    condition: "Psoriasis plaques - scalp crown",
    registeredDate: "2024-12-18",
    verified: true,
    doctor: "Dr. Kavita Rao",
    priority: "high"
  },
  {
    id: "c-03",
    patientName: "Kabir Singh",
    email: "kabir.singh@clinic.in",
    age: 29,
    condition: "Acne vulgaris - cheek",
    registeredDate: "2025-02-02",
    verified: false,
    doctor: "Dr. Arjun Menon",
    priority: "medium"
  },
  {
    id: "c-04",
    patientName: "Anika Patel",
    email: "anika.patel@clinic.in",
    age: 36,
    condition: "Vitiligo patches - shoulder",
    registeredDate: "2025-01-20",
    verified: true,
    doctor: "Dr. Leena Bose",
    priority: "low"
  },
  {
    id: "c-05",
    patientName: "Rohan Mehta",
    email: "rohan.mehta@clinic.in",
    age: 52,
    condition: "Chronic psoriasis - knee",
    registeredDate: "2024-11-28",
    verified: false,
    doctor: "Dr. Ishan Mehta",
    priority: "high"
  },
  {
    id: "c-06",
    patientName: "Leela Narayan",
    email: "leela.narayan@clinic.in",
    age: 64,
    condition: "Lichen planus - forearm",
    registeredDate: "2024-12-05",
    verified: true,
    doctor: "Dr. Kavita Rao",
    priority: "medium"
  },
  {
    id: "c-07",
    patientName: "Devanshi Kulkarni",
    email: "devanshi.kulkarni@clinic.in",
    age: 27,
    condition: "Inflammatory acne - jawline",
    registeredDate: "2025-02-10",
    verified: false,
    doctor: "Dr. Arjun Menon",
    priority: "medium"
  },
  {
    id: "c-08",
    patientName: "Om Prakash",
    email: "om.prakash@clinic.in",
    age: 71,
    condition: "Venous ulcer - lower leg",
    registeredDate: "2024-10-15",
    verified: true,
    doctor: "Dr. Leena Bose",
    priority: "high"
  }
];

type CaseState = {
  cases: AdminCase[];
  doctors: Doctor[];
  loading: boolean;
  error: string | null;
  loadCases: (token: string) => Promise<void>;
  loadDoctors: (token: string) => Promise<void>;
  addCase: (token: string, data: Omit<AdminCase, "id">) => Promise<void>;
  addBulkCases: (token: string, data: Omit<AdminCase, "id">[]) => Promise<void>;
  toggleVerify: (token: string, id: string) => Promise<void>;
  updateCase: (token: string | null, data: AdminCase) => Promise<void>;
  deleteCase: (token: string | null, id: string) => Promise<void>;
};

const newId = () => `c-${Math.random().toString(16).slice(2, 8)}`;

export const useCaseStore = create<CaseState>((set, get) => ({
  cases: [],
  doctors: [],
  loading: false,
  error: null,
  loadCases: async (token) => {
    if (!token) {
      if (get().cases.length === 0) set({ cases: seedCases, doctors: seedDoctors });
      return;
    }
    try {
      set({ loading: true, error: null });
      const [remoteCases, remoteDoctors] = await Promise.all([getCases(token), getDoctors(token)]);
      set({
        cases: Array.isArray(remoteCases) ? (remoteCases as AdminCase[]) : seedCases,
        doctors: Array.isArray(remoteDoctors) ? (remoteDoctors as Doctor[]) : seedDoctors,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error("Failed to load cases", error);
      if (get().cases.length === 0) set({ cases: seedCases, doctors: [] });
      set({ loading: false, error: "Could not load cases. Check your connection." });
    }
  },
  loadDoctors: async (token) => {
    if (!token) return;
    try {
      const remote = await getDoctors(token);
      set({ doctors: Array.isArray(remote) ? (remote as Doctor[]) : [] });
    } catch (error) {
      console.error("Failed to load doctors", error);
    }
  },
  addCase: async (token, data) => {
    if (!token) {
      set((state) => ({
        cases: [{ ...data, id: newId() }, ...state.cases]
      }));
      return;
    }
    try {
      const saved = (await createCase(token, data)) as AdminCase;
      set((state) => ({
        cases: [saved, ...state.cases]
      }));
    } catch (error) {
      console.error("Create case failed, falling back to local", error);
      set((state) => ({
        cases: [{ ...data, id: newId() }, ...state.cases]
      }));
    }
  },
  addBulkCases: async (token, data) => {
    for (const row of data) {
      // eslint-disable-next-line no-await-in-loop
      await get().addCase(token, row);
    }
  },
  toggleVerify: async (token, id) => {
    const current = get().cases.find((c) => c.id === id);
    if (!current) return;
    try {
      await verifyCase(token, id, current.doctor);
      set((state) => ({
        cases: state.cases.map((c) => (c.id === id ? { ...c, verified: true } : c))
      }));
    } catch (error) {
      console.error("Verify case failed", error);
    }
  },
  updateCase: async (token, data) => {
    if (token) {
      try {
        const saved = (await updateCaseRequest(token, data.id, data)) as AdminCase;
        set((state) => ({
          cases: state.cases.map((c) => (c.id === data.id ? { ...c, ...saved } : c))
        }));
        return;
      } catch (error) {
        console.error("Update case failed, falling back to local", error);
      }
    }
    set((state) => ({
      cases: state.cases.map((c) => (c.id === data.id ? { ...c, ...data } : c))
    }));
  },
  deleteCase: async (token, id) => {
    if (token) {
      try {
        await deleteCaseRequest(token, id);
      } catch (error) {
        console.error("Delete case failed, removing locally", error);
      }
    }
    set((state) => ({
      cases: state.cases.filter((c) => c.id !== id)
    }));
  }
}));
