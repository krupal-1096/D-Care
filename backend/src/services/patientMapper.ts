import { db } from "../firebase";
import { AdminCase, Patient } from "../types";
import { avatarPlaceholder, casePlaceholder } from "../utils/placeholders";

const PATIENTS_COLLECTION = "patients";

const normalizeDoctorValue = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower === "any" || lower.includes("any doctor")) return "any";
  return trimmed;
};

export async function toPatientFromCase(adminCase: AdminCase): Promise<Patient> {
  const accent = "#5ed483";
  const diseaseName = (adminCase.condition || "Skin condition").split(",")[0]?.trim() || "Skin condition";
  const normalizedDoctor = normalizeDoctorValue(adminCase.doctor);

  const providedImages = (adminCase.images ?? []).slice(0, 8);
  const images =
    providedImages.length > 0
      ? providedImages
      : [
          casePlaceholder(`${diseaseName} - sample 1`, accent),
          casePlaceholder(`${diseaseName} - sample 2`, accent)
        ];
  const labels =
    providedImages.length > 0
      ? providedImages.map((_, idx) => `${diseaseName} - sample ${idx + 1}`)
      : [`${diseaseName} - sample 1`, `${diseaseName} - sample 2`];

  const patient: Patient = {
    id: adminCase.id,
    name: adminCase.patientName,
    email: adminCase.email,
    age: adminCase.age,
    photo: avatarPlaceholder(adminCase.patientName),
    diseaseImages: images,
    diseaseImageLabels: labels,
    diseases: [
      {
        id: `d-${adminCase.id}`,
        name: diseaseName,
        severity: adminCase.priority === "high" ? 70 : adminCase.priority === "medium" ? 45 : 20,
        notes: adminCase.condition
      }
    ],
    registeredDate: adminCase.registeredDate,
    doctor: normalizedDoctor,
    verified: adminCase.verified,
    verifiedBy: normalizedDoctor,
    doctorNote: ""
  };

  await db.collection(PATIENTS_COLLECTION).doc(patient.id).set(patient, { merge: true });
  return patient;
}
