import { Request, Response } from "express";
import { db } from "../firebase";
import { AdminCase, Patient } from "../types";
import { incrementDoctorVerifiedCount } from "../services/doctorStats";
import { toPatientFromCase } from "../services/patientMapper";

const PATIENTS_COLLECTION = "patients";

async function ensurePatientsFromCases(limit: number) {
  const casesSnap = await db.collection("cases").orderBy("registeredDate", "desc").limit(limit).get();
  if (casesSnap.empty) return;

  const cases: AdminCase[] = casesSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<AdminCase, "id">) }));
  await Promise.all(
    cases.map(async (adminCase) => {
      const patRef = db.collection(PATIENTS_COLLECTION).doc(adminCase.id);
      const patSnap = await patRef.get();
      if (!patSnap.exists) {
        await toPatientFromCase(adminCase);
      }
    })
  );
}

export async function listDoctorCases(req: Request, res: Response) {
  const doctorEmail = req.user?.email;
  const limitParam = Number(req.query.limit) || 100;
  const limitValue = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 2000) : 100;

  let doctorName: string | null = null;
  if (doctorEmail) {
    const profile = await db.collection("doctors").where("email", "==", doctorEmail).limit(1).get();
    doctorName = profile.empty ? null : (profile.docs[0].data().name as string | undefined) ?? null;
  }

  await ensurePatientsFromCases(limitValue);

  const snapshot = await db
    .collection(PATIENTS_COLLECTION)
    .orderBy("registeredDate", "desc")
    .limit(limitValue)
    .get();
  const allPatients: Patient[] = snapshot.docs.map((doc) => {
    const data = doc.data() as Partial<Patient>;
    const { id: _ignore, ...rest } = data;
    return { id: doc.id, ...(rest as Omit<Patient, "id">) };
  });

  const normalize = (value?: string | null) =>
    value
      ?.trim()
      .toLowerCase()
      .replace(/^dr\.?\s+/, "")
      .replace(/[^a-z0-9]/g, "") ?? "";
  const doctorEmailNorm = normalize(doctorEmail);
  const doctorEmailLocalNorm = normalize(doctorEmail?.split("@")[0]);
  const doctorNameNorm = normalize(doctorName);
  const isAny = (norm: string) => norm === "any" || norm.includes("anydoctor");
  const matchesDoctor = (norm: string) => {
    if (!norm) return false;
    if (isAny(norm)) return true;
    if (doctorEmailNorm && norm === doctorEmailNorm) return true;
    if (doctorEmailLocalNorm && norm === doctorEmailLocalNorm) return true;
    if (doctorNameNorm && norm === doctorNameNorm) return true;
    return false;
  };

  const visible = allPatients.filter((patient) => {
    const assignedNorm = normalize(patient.doctor);
    const verifiedByNorm = normalize(patient.verifiedBy);
    if (matchesDoctor(verifiedByNorm)) return true;
    if (!verifiedByNorm && matchesDoctor(assignedNorm)) return true;
    return false;
  });

  res.json(visible);
}

export async function verifyPatient(req: Request, res: Response) {
  const { id } = req.params;
  const { diseases, doctorNote } = req.body as { diseases: Patient["diseases"]; doctorNote?: string };

  const ref = db.collection(PATIENTS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: "Patient not found" });

  await ref.update({
    diseases,
    doctorNote: doctorNote ?? "",
    verified: true,
    verifiedBy: req.user?.email,
    doctor: req.user?.email,
    verifiedDate: new Date().toISOString()
  });

  await db.collection("cases").doc(id).set(
    {
      verified: true,
      doctor: req.user?.email
    },
    { merge: true }
  );

  await incrementDoctorVerifiedCount(req.user?.email);

  res.json({ ok: true });
}
