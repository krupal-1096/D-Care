import { Request, Response } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase";
import { Doctor } from "../types";

const DOCTORS_COLLECTION = "doctors";

export async function listDoctors(_req: Request, res: Response) {
  const snapshot = await db.collection(DOCTORS_COLLECTION).orderBy("name").get();
  const doctors: Doctor[] = snapshot.docs.map((doc) => {
    const data = doc.data() as Partial<Doctor>;
    const { id: _ignore, ...rest } = data;
    return { id: doc.id, ...(rest as Omit<Doctor, "id">) };
  });
  res.json(doctors);
}

export async function createDoctor(req: Request, res: Response) {
  const { name, email, lastLogin, verifiedCount, avatar } = req.body as Partial<Doctor>;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  const today = new Date().toISOString().slice(0, 10);
  const payload: Omit<Doctor, "id"> = {
    name,
    email,
    lastLogin: lastLogin ?? today,
    verifiedCount: verifiedCount ?? 0,
    avatar
  };

  const docRef = await db.collection(DOCTORS_COLLECTION).add(payload);
  res.status(201).json({ id: docRef.id, ...payload });
}

export async function updateDoctor(req: Request, res: Response) {
  const { id } = req.params;
  const payload = req.body as Partial<Doctor>;

  const ref = db.collection(DOCTORS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: "Doctor not found" });

  const existing = snap.data() as Doctor;
  const updates: Partial<Doctor> = {
    name: payload.name ?? existing.name,
    email: payload.email ?? existing.email,
    lastLogin: payload.lastLogin ?? existing.lastLogin,
    verifiedCount: payload.verifiedCount ?? existing.verifiedCount,
    avatar: payload.avatar ?? existing.avatar
  };

  await ref.set({ ...updates, firstLogin: FieldValue.delete() }, { merge: true });
  const sanitized = { ...existing, ...updates, firstLogin: undefined, id };
  res.json(sanitized);
}

export async function deleteDoctor(req: Request, res: Response) {
  const { id } = req.params;
  const ref = db.collection(DOCTORS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: "Doctor not found" });

  await ref.delete();
  res.json({ ok: true });
}
