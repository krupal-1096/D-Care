import { Request, Response } from "express";
import { db } from "../firebase";
import { AdminMember } from "../types";
import { hashPassword } from "../services/passwords";

const ADMINS_COLLECTION = "admins";
const ADMIN_LOCKS_COLLECTION = "adminLocks";

const seedAdmins: Omit<AdminMember, "id">[] = [
  {
    name: "Default Super",
    email: "default@admin.com",
    role: "super",
    joinedOn: "2024-08-10",
    lastLogin: "2025-02-12",
    hasPassword: false
  },
  {
    name: "Aisha Nambiar",
    email: "aisha.nambiar@doctor.app",
    role: "super",
    joinedOn: "2024-08-22",
    lastLogin: "2025-02-10",
    hasPassword: false
  },
  {
    name: "d-care",
    email: "d-care@admin.com",
    role: "super",
    joinedOn: "2024-08-01",
    lastLogin: "—",
    hasPassword: false
  },
  {
    name: "Rohan Deshpande",
    email: "rohan.deshpande@doctor.app",
    role: "admin",
    joinedOn: "2024-09-04",
    lastLogin: "2025-02-09",
    hasPassword: false
  },
  {
    name: "Sara Fernandes",
    email: "sara.fernandes@doctor.app",
    role: "admin",
    joinedOn: "2025-01-20",
    lastLogin: "—",
    hasPassword: false
  },
  {
    name: "Vikram Shetty",
    email: "vikram.shetty@doctor.app",
    role: "admin",
    joinedOn: "2024-07-12",
    lastLogin: "2024-12-30",
    hasPassword: false
  }
];

async function ensureSeededAdmins() {
  for (const admin of seedAdmins) {
    const existing = await db.collection(ADMINS_COLLECTION).where("email", "==", admin.email).limit(1).get();
    if (existing.empty) {
      await db.collection(ADMINS_COLLECTION).add(admin);
    }
  }
}

export async function listAdmins(_req: Request, res: Response) {
  await ensureSeededAdmins();
  const snapshot = await db.collection(ADMINS_COLLECTION).orderBy("joinedOn", "desc").get();
  const admins: AdminMember[] = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<AdminMember, "id">) }));
  const adminsWithPassword = await Promise.all(
    admins.map(async (admin) => {
      const cred = await db.collection("localCredentials").doc(admin.email).get();
      return { ...admin, hasPassword: cred.exists || admin.hasPassword === true };
    })
  );
  res.json(adminsWithPassword);
}

export async function createAdmin(req: Request, res: Response) {
  const { name, email, role, joinedOn, lastLogin, password } = req.body as Partial<AdminMember> & { password?: string };
  if (!name || !email || !role || !password) {
    return res.status(400).json({ error: "Name, email, role, and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const credRef = db.collection("localCredentials").doc(email);
  const credSnap = await credRef.get();
  if (credSnap.exists) {
    return res.status(409).json({ error: "User already exists" });
  }

  const uid = `local-${Buffer.from(email).toString("hex").slice(0, 16)}`;
  const passwordHash = await hashPassword(password);

  const today = new Date().toISOString().slice(0, 10);
  const payload: Omit<AdminMember, "id"> = {
    name,
    email,
    role,
    joinedOn: joinedOn ?? today,
    lastLogin: lastLogin ?? "—",
    hasPassword: true
  };

  await credRef.set({ passwordHash, role, uid });
  await db.collection("users").doc(uid).set({ email, role }, { merge: true });
  const docRef = await db.collection(ADMINS_COLLECTION).add(payload);
  res.status(201).json({ id: docRef.id, ...payload });
}

export async function updateAdmin(req: Request, res: Response) {
  const { id } = req.params;
  const payload = req.body as Partial<AdminMember> & { password?: string };
  const { password } = payload;

  const ref = db.collection(ADMINS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: "Admin not found" });

  const existing = snap.data() as AdminMember;
  const updates: Partial<AdminMember> = {
    name: payload.name ?? existing.name,
    email: payload.email ?? existing.email,
    role: payload.role ?? existing.role,
    joinedOn: payload.joinedOn ?? existing.joinedOn,
    lastLogin: payload.lastLogin ?? existing.lastLogin,
    hasPassword: payload.hasPassword ?? existing.hasPassword ?? false
  };

  const roleForCreds = updates.role ?? existing.role;
  if (password || payload.role) {
    if (password && password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    const credRef = db.collection("localCredentials").doc(existing.email);
    const credSnap = await credRef.get();
    const uid = (credSnap.data()?.uid as string | undefined) ?? `local-${Buffer.from(existing.email).toString("hex").slice(0, 16)}`;
    const credUpdate: Record<string, unknown> = { role: roleForCreds, uid };
    if (password) {
      credUpdate.passwordHash = await hashPassword(password);
      updates.hasPassword = true;
    }
    await credRef.set(credUpdate, { merge: true });
    await db.collection("users").doc(uid).set({ email: existing.email, role: roleForCreds }, { merge: true });
  }

  await ref.set(updates, { merge: true });
  res.json({ ...existing, ...updates, id });
}

export async function deleteAdmin(req: Request, res: Response) {
  const { id } = req.params;
  const ref = db.collection(ADMINS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: "Admin not found" });

  await ref.delete();
  res.json({ ok: true });
}

export async function getAdminLock(req: Request, res: Response) {
  const email = req.user?.email;
  if (!email) return res.status(400).json({ error: "Missing admin email" });
  const doc = await db.collection(ADMIN_LOCKS_COLLECTION).doc(email).get();
  const data = doc.data() as { disableRoleUntil?: string; disableDeleteUntil?: string } | undefined;
  res.json({
    disableRoleUntil: data?.disableRoleUntil ?? null,
    disableDeleteUntil: data?.disableDeleteUntil ?? null
  });
}

export async function setAdminLock(req: Request, res: Response) {
  const email = req.user?.email;
  if (!email) return res.status(400).json({ error: "Missing admin email" });
  const { mode, disableUntil } = req.body as { mode: "role" | "delete"; disableUntil?: string | null };
  if (mode !== "role" && mode !== "delete") return res.status(400).json({ error: "Invalid mode" });

  const ref = db.collection(ADMIN_LOCKS_COLLECTION).doc(email);
  const payload: Record<string, any> = {};
  if (mode === "role") {
    payload.disableRoleUntil = disableUntil ?? null;
  } else {
    payload.disableDeleteUntil = disableUntil ?? null;
  }
  await ref.set(payload, { merge: true });
  res.json({ ok: true, ...payload });
}
