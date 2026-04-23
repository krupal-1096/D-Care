import { Request, Response } from "express";
import { db } from "../firebase";
import { hashPassword, verifyPassword } from "../services/passwords";
import { Role } from "../types";
import jwt from "jsonwebtoken";

const nowIso = () => new Date().toISOString();
const strongPassword = (value: string) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/.test(value);

export async function registerLocal(req: Request, res: Response) {
  const { email, password, role, name } = req.body as { email: string; password: string; role: Role; name?: string };
  if (!email || !password || !role) return res.status(400).json({ error: "Email, password, role required" });
  if (!strongPassword(password)) return res.status(400).json({ error: "Password is too weak" });

  const existing = await db.collection("localCredentials").doc(email).get();
  if (existing.exists) {
    return res.status(409).json({ error: "User already exists" });
  }

  const uid = `local-${Buffer.from(email).toString("hex").slice(0, 16)}`;
  const passwordHash = await hashPassword(password);
  await db.collection("localCredentials").doc(email).set({ passwordHash, role, uid });
  await db.collection("users").doc(uid).set({ email, role }, { merge: true });

  if (role === "doctor") {
    const docRef = db.collection("doctors").doc(uid);
    await docRef.set(
      {
        name: name || email.split("@")[0],
        email,
        lastLogin: nowIso(),
        verifiedCount: 0
      },
      { merge: true }
    );
  }

  const secret = process.env.AUTH_SECRET || "dev-secret";
  const signed = jwt.sign({ uid, email, role }, secret, { expiresIn: "12h" });
  res.status(201).json({ token: signed, role, name: name || email.split("@")[0] });
}

export async function loginLocal(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const credSnap = await db.collection("localCredentials").doc(email).get();
  if (!credSnap.exists) {
    const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || "default@admin.com";
    const defaultPass = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
    const dcareEmail = process.env.DCARE_ADMIN_EMAIL || "d-care@admin.com";
    const dcarePass = process.env.DCARE_ADMIN_PASSWORD || "dcare@123";

    if (email === dcareEmail && password === dcarePass) {
      const uid = "local-dcare";
      const role: Role = "super";
      await db.collection("users").doc(uid).set({ email, role }, { merge: true });
      const secret = process.env.AUTH_SECRET || "dev-secret";
      const signed = jwt.sign({ uid, email, role }, secret, { expiresIn: "12h" });
      return res.json({ token: signed, role });
    }

    if (email === defaultEmail && password === defaultPass) {
      const uid = "local-admin";
      const role: Role = "super";
      await db.collection("users").doc(uid).set({ email, role }, { merge: true });
      const secret = process.env.AUTH_SECRET || "dev-secret";
      const signed = jwt.sign({ uid, email, role }, secret, { expiresIn: "12h" });
      return res.json({ token: signed, role });
    }
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const { passwordHash, role, uid } = credSnap.data() as { passwordHash: string; role: Role; uid: string };
  const valid = await verifyPassword(password, passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const secret = process.env.AUTH_SECRET || "dev-secret";
  const signed = jwt.sign({ uid, email, role }, secret, { expiresIn: "12h" });

  let doctorName: string | undefined;
  if (role === "doctor") {
    const docRef = db.collection("doctors").doc(uid);
    const snap = await docRef.get();
    const fallbackName = email.split("@")[0];
    doctorName = snap.data()?.name || fallbackName;
    if (snap.exists) {
      await docRef.set({ lastLogin: nowIso() }, { merge: true });
    } else {
      await docRef.set(
        {
          name: fallbackName,
          email,
          lastLogin: nowIso(),
          verifiedCount: 0
        },
        { merge: true }
      );
    }
  }

  res.json({ token: signed, role, name: doctorName });
}

export async function ensureUserRole(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  await db.collection("users").doc(req.user.uid).set(
    {
      email: req.user.email,
      role: req.user.role
    },
    { merge: true }
  );
  res.json({ ok: true, role: req.user.role });
}

export async function logoutUser(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role === "doctor") {
    await db.collection("doctors").doc(req.user.uid).set({ lastLogin: nowIso() }, { merge: true });
  }
  res.json({ ok: true });
}
