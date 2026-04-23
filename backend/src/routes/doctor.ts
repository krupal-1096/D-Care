import { Router } from "express";
import { listDoctorCases, verifyPatient } from "../controllers/doctorCasesController";
import { changeDoctorPassword, getCurrentDoctor, updateCurrentDoctor } from "../controllers/doctorProfileController";
import { requireAuth, requireRole } from "../middleware/auth";

export const doctorRouter = Router();

doctorRouter.use(requireAuth, requireRole(["doctor", "admin"]));
doctorRouter.get("/cases", listDoctorCases);
doctorRouter.patch("/cases/:id/verify", verifyPatient);
doctorRouter.get("/profile", getCurrentDoctor);
doctorRouter.patch("/profile", updateCurrentDoctor);
doctorRouter.patch("/password", changeDoctorPassword);
