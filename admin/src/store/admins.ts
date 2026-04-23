import { create } from "zustand";
import { AdminMember } from "../types";
import { createAdmin as createAdminRequest, deleteAdmin as deleteAdminRequest, getAdmins, updateAdmin as updateAdminRequest } from "../utils/api";

type AdminState = {
  admins: AdminMember[];
  loadAdmins: (token: string | null) => Promise<void>;
  addAdmin: (token: string | null, admin: Omit<AdminMember, "id" | "joinedOn" | "lastLogin" | "hasPassword"> & { password: string } & Partial<Pick<AdminMember, "joinedOn" | "lastLogin">>) => Promise<void>;
  removeAdmin: (token: string | null, id: string) => Promise<void>;
  updateAdmin: (token: string | null, id: string, payload: Partial<AdminMember> & { password?: string }) => Promise<void>;
};

const newAdminId = () => `a-${Math.random().toString(16).slice(2, 8)}`;

export const useAdminStore = create<AdminState>((set) => ({
  admins: [],
  loadAdmins: async (token) => {
    if (!token) return;
    try {
      const remote = await getAdmins(token);
      set({ admins: Array.isArray(remote) ? (remote as AdminMember[]) : [] });
    } catch (error) {
      console.error("Failed to load admins", error);
    }
  },
  addAdmin: async (token, admin) => {
    if (token) {
      try {
        const saved = (await createAdminRequest(token, admin)) as AdminMember;
        set((state) => ({ admins: [saved, ...state.admins] } as Partial<AdminState>));
        return;
      } catch (error) {
        console.error("Create admin failed, falling back to local", error);
      }
    }
    const { password, ...rest } = admin;
    set((state) => ({
      admins: [
        {
          ...(rest as AdminMember),
          id: newAdminId(),
          joinedOn: admin.joinedOn || new Date().toISOString().slice(0, 10),
          lastLogin: admin.lastLogin || "—",
          hasPassword: Boolean(password)
        },
        ...state.admins
      ]
    }));
  },
  removeAdmin: async (token, id) => {
    if (token) {
      try {
        await deleteAdminRequest(token, id);
      } catch (error) {
        console.error("Delete admin failed, removing locally", error);
      }
    }
    set((state) => ({
      admins: state.admins.filter((a) => a.id !== id)
    }));
  },
  updateAdmin: async (token, id, payload) => {
    if (token) {
      try {
        const updated = (await updateAdminRequest(token, id, payload)) as AdminMember;
        set((state) => ({
          admins: state.admins.map((admin) => (admin.id === id ? { ...admin, ...updated } : admin))
        } as Partial<AdminState>));
        return;
      } catch (error) {
        console.error("Update admin failed, falling back to local", error);
      }
    }
    const { password, ...rest } = payload;
    set((state) => ({
      admins: state.admins.map((admin) =>
        admin.id === id
          ? ({
              ...admin,
              ...(rest as Partial<AdminMember>),
              hasPassword: password ? true : admin.hasPassword
            } as AdminMember)
          : admin
      )
    }));
  }
}));
