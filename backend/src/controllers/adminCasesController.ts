import { Request, Response } from "express";
import { db } from "../firebase";
import { AdminCase, CreateCasePayload } from "../types";
import { toPatientFromCase } from "../services/patientMapper";
import { incrementDoctorVerifiedCount } from "../services/doctorStats";

const CASES_COLLECTION = "cases";

const normalizeDoctorValue = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const lower = trimmed.toLowerCase();
  if (lower === "any" || lower.includes("any doctor")) return "any";
  return trimmed;
};

export async function listCases(_req: Request, res: Response) {
  const snapshot = await db.collection(CASES_COLLECTION).orderBy("registeredDate", "desc").get();
  const cases: AdminCase[] = snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data()
      }) as AdminCase
  );
  res.json(cases);
}

export async function createCase(req: Request, res: Response) {
  const payload = req.body as CreateCasePayload;
  if (!payload.patientName || !payload.email || !payload.age || !payload.condition) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const images = Array.isArray(payload.images) ? payload.images.slice(0, 8) : [];
  const normalizedDoctor = normalizeDoctorValue(payload.doctor);

  const now = new Date().toISOString();
  const toSave: Omit<AdminCase, "id"> = {
    patientName: payload.patientName,
    email: payload.email,
    age: payload.age,
    condition: payload.condition,
    doctor: normalizedDoctor,
    priority: payload.priority ?? "medium",
    registeredDate: payload.registeredDate ?? now,
    verified: false,
    images
  };

  const docRef = await db.collection(CASES_COLLECTION).add(toSave);
  const saved: AdminCase = { id: docRef.id, ...toSave };

  // Mirror into doctor-facing patients collection
  await toPatientFromCase(saved);

  res.status(201).json(saved);
}

export async function verifyCase(req: Request, res: Response) {
  const { id } = req.params;
  const { doctor, note } = req.body as { doctor?: string; note?: string };

  const ref = db.collection(CASES_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return res.status(404).json({ error: "Case not found" });
  }

  const resolvedDoctor = normalizeDoctorValue(doctor ?? snap.data()?.doctor);
  await ref.update({ verified: true, doctor: resolvedDoctor });
  await db.collection("patients").doc(id).set(
    {
      verified: true,
      verifiedBy: resolvedDoctor,
      doctorNote: note,
      verifiedDate: new Date().toISOString()
    },
    { merge: true }
  );

  await incrementDoctorVerifiedCount(resolvedDoctor);

  res.json({ ok: true });
}

export async function updateCase(req: Request, res: Response) {
  const { id } = req.params;
  const payload = req.body as Partial<AdminCase>;

  const ref = db.collection(CASES_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return res.status(404).json({ error: "Case not found" });
  }

  const existing = snap.data() as AdminCase;
  const updates: Partial<AdminCase> = {
    patientName: payload.patientName ?? existing.patientName,
    email: payload.email ?? existing.email,
    age: payload.age ?? existing.age,
    condition: payload.condition ?? existing.condition,
    doctor: normalizeDoctorValue(payload.doctor ?? existing.doctor),
    priority: payload.priority ?? existing.priority ?? "medium",
    registeredDate: payload.registeredDate ?? existing.registeredDate,
    verified: payload.verified ?? existing.verified ?? false,
    images: Array.isArray(payload.images) ? payload.images.slice(0, 8) : existing.images ?? []
  };

  await ref.set(updates, { merge: true });
  const saved: AdminCase = { ...existing, ...updates, id };
  await toPatientFromCase(saved);

  res.json(saved);
}

export async function deleteCase(req: Request, res: Response) {
  const { id } = req.params;

  const ref = db.collection(CASES_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return res.status(404).json({ error: "Case not found" });
  }

  await ref.delete();
  await db.collection("patients").doc(id).delete().catch(() => null);

  res.json({ ok: true });
}
