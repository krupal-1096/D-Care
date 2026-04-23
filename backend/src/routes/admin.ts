import { Router } from "express";
import { createCase, deleteCase, listCases, updateCase, verifyCase } from "../controllers/adminCasesController";
import { createDoctor, deleteDoctor, listDoctors, updateDoctor } from "../controllers/adminDoctorsController";
import { listAdmins, createAdmin, deleteAdmin, updateAdmin, getAdminLock, setAdminLock } from "../controllers/adminAdminsController";
import { requireAuth, requireRole } from "../middleware/auth";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(["admin", "super"]));
adminRouter.get("/cases", listCases);
adminRouter.post("/cases", createCase);
adminRouter.patch("/cases/:id/verify", verifyCase);
adminRouter.patch("/cases/:id", updateCase);
adminRouter.delete("/cases/:id", deleteCase);

adminRouter.get("/doctors", listDoctors);
adminRouter.post("/doctors", createDoctor);
adminRouter.patch("/doctors/:id", updateDoctor);
adminRouter.delete("/doctors/:id", deleteDoctor);

adminRouter.get("/admins", requireRole(["super"]), listAdmins);
adminRouter.post("/admins", requireRole(["super"]), createAdmin);
adminRouter.patch("/admins/:id", requireRole(["super"]), updateAdmin);
adminRouter.delete("/admins/:id", requireRole(["super"]), deleteAdmin);
adminRouter.get("/admin-lock", requireRole(["super"]), getAdminLock);
adminRouter.post("/admin-lock", requireRole(["super"]), setAdminLock);
