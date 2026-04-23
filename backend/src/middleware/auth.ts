import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { auth, db } from "../firebase";
import { AuthenticatedUser, Role } from "../types";

declare module "express" {
  interface Request {
    user?: AuthenticatedUser;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing Authorization bearer token" });
    }

    const token = header.split(" ")[1];
    // First try to verify Firebase ID token
    try {
      const decoded = await auth.verifyIdToken(token);

      const roleSnapshot = await db.collection("users").doc(decoded.uid).get();
      const roleData = roleSnapshot.data();
      const role = (roleData?.role as Role) || "doctor";

      req.user = {
        uid: decoded.uid,
        email: decoded.email ?? undefined,
        role,
        provider: decoded.firebase?.sign_in_provider
      };
      return next();
    } catch {
      // fall through to local JWT check
    }

    const secret = process.env.AUTH_SECRET || "dev-secret";
    const decodedLocal = jwt.verify(token, secret) as { uid: string; email?: string; role: Role };
    req.user = {
      uid: decodedLocal.uid,
      email: decodedLocal.email,
      role: decodedLocal.role,
      provider: "local"
    };
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRole(allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role === "super") return next();
    if (!allowed.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    return next();
  };
}
