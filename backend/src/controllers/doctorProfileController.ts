import { Request, Response } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase";
import { hashPassword, verifyPassword } from "../services/passwords";
import { Doctor } from "../types";

const DOCTORS_COLLECTION = "doctors";
const nowIso = () => new Date().toISOString();

async function getDoctorRef(email: string, uid: string) {
  const byEmail = await db.collection(DOCTORS_COLLECTION).where("email", "==", email).limit(1).get();
  if (!byEmail.empty) return byEmail.docs[0].ref;
  return db.collection(DOCTORS_COLLECTION).doc(uid);
}

export async function getCurrentDoctor(req: Request, res: Response) {
  const email = req.user?.email;
  const uid = req.user?.uid;
  if (!email || !uid) return res.status(401).json({ error: "Unauthorized" });

  const ref = await getDoctorRef(email, uid);
  const snap = await ref.get();

  if (!snap.exists) {
    const fallback: Omit<Doctor, "id"> = {
      name: email.split("@")[0],
      email,
      lastLogin: nowIso(),
      verifiedCount: 0
    };
    await ref.set(fallback, { merge: true });
    return res.json({ id: ref.id, ...fallback });
  }

  const data = snap.data() as Partial<Doctor>;
  const toDelete: Record<string, any> = {};
  if (data.firstLogin) {
    toDelete.firstLogin = FieldValue.delete();
    delete data.firstLogin;
  }
  if (data.avatar) {
    toDelete.avatar = FieldValue.delete();
    delete data.avatar;
  }
  if (Object.keys(toDelete).length > 0) {
    await ref.set(toDelete, { merge: true });
  }
  return res.json({ id: snap.id, ...data });
}

export async function updateCurrentDoctor(req: Request, res: Response) {
  const email = req.user?.email;
  const uid = req.user?.uid;
  if (!email || !uid) return res.status(401).json({ error: "Unauthorized" });

  const { name } = req.body as Partial<Doctor>;
  if (!name) return res.status(400).json({ error: "Nothing to update" });

  const ref = await getDoctorRef(email, uid);
  const snap = await ref.get();
  const existing = (snap.data() as Partial<Doctor>) ?? {};

  const updates: Partial<Doctor> = {
    name: name ?? existing.name ?? email.split("@")[0],
    email: existing.email ?? email,
    lastLogin: nowIso(),
    verifiedCount: existing.verifiedCount ?? 0
  };

  await ref.set({ ...updates, firstLogin: FieldValue.delete(), avatar: FieldValue.delete() }, { merge: true });
  res.json({ id: ref.id, ...existing, ...updates });
}

export async function changeDoctorPassword(req: Request, res: Response) {
  const email = req.user?.email;
  if (!email) return res.status(401).json({ error: "Unauthorized" });

  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Current and new password are required" });
  if (newPassword.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

  const credRef = db.collection("localCredentials").doc(email);
  const credSnap = await credRef.get();
  if (!credSnap.exists) return res.status(404).json({ error: "Account not found" });

  const { passwordHash } = credSnap.data() as { passwordHash: string };
  const valid = await verifyPassword(currentPassword, passwordHash);
  if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

  const newHash = await hashPassword(newPassword);
  await credRef.set({ passwordHash: newHash }, { merge: true });
  res.json({ ok: true });
}
