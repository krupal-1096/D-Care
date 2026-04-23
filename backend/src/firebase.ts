import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import dotenv from "dotenv";

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!projectId) {
  throw new Error("Missing FIREBASE_PROJECT_ID");
}

const options =
  serviceAccountRaw && serviceAccountRaw.trim().length > 0
    ? {
        credential: cert(JSON.parse(Buffer.from(serviceAccountRaw, "base64").toString("utf8"))),
        projectId
      }
    : {
        credential: applicationDefault(),
        projectId
      };

const app = initializeApp(options);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
