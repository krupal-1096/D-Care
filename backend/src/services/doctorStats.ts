import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase";

const DOCTORS_COLLECTION = "doctors";

/**
 * Increment verifiedCount for a doctor identified by email, name, or document id.
 * Handles the common cases without throwing to avoid blocking verification flows.
 */
export async function incrementDoctorVerifiedCount(identifier?: string | null) {
  if (!identifier) return;
  const trimmed = identifier.trim();
  if (!trimmed) return;
  const lower = trimmed.toLowerCase();
  if (lower === "any" || lower.includes("any doctor")) return;

  try {
    // Try by document id
    const docById = await db.collection(DOCTORS_COLLECTION).doc(trimmed).get();
    if (docById.exists) {
      await docById.ref.set({ verifiedCount: FieldValue.increment(1) }, { merge: true });
      return;
    }

    // Try by email
    const byEmail = await db.collection(DOCTORS_COLLECTION).where("email", "==", trimmed).limit(1).get();
    if (!byEmail.empty) {
      await byEmail.docs[0].ref.set({ verifiedCount: FieldValue.increment(1) }, { merge: true });
      return;
    }

    // Try by name
    const byName = await db.collection(DOCTORS_COLLECTION).where("name", "==", trimmed).limit(1).get();
    if (!byName.empty) {
      await byName.docs[0].ref.set({ verifiedCount: FieldValue.increment(1) }, { merge: true });
    }
  } catch (error) {
  }
}
