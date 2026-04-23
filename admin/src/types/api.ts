import { AdminMember, AdminCase, Doctor } from "../types";

export type AdminLockResponse = {
  disableRoleUntil: string | null;
  disableDeleteUntil: string | null;
};

export type AdminApiCasesResponse = AdminCase[];
export type AdminApiDoctorsResponse = Doctor[];
export type AdminApiAdminsResponse = AdminMember[];
