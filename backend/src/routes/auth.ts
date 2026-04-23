import { Router } from "express";
import { ensureUserRole, loginLocal, logoutUser, registerLocal } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/local/register", registerLocal);
authRouter.post("/local/login", loginLocal);
authRouter.post("/ensure-role", requireAuth, ensureUserRole);
authRouter.post("/logout", requireAuth, logoutUser);
