export type Role = "admin" | "doctor" | "super";

export type AuthenticatedUser = {
  uid: string;
  email?: string;
  role: Role;
  provider?: string;
};

export type AdminCase = {
  id: string;
  patientName: string;
  email: string;
  age: number;
  condition: string;
  registeredDate: string;
  verified: boolean;
  doctor?: string;
  priority?: "low" | "medium" | "high";
  images?: string[];
};

export type PatientDisease = {
  id: string;
  name: string;
  severity: number;
  notes?: string;
};

export type Patient = {
  id: string;
  name: string;
  email: string;
  age: number;
  photo: string;
  diseaseImages: string[];
  diseaseImageLabels?: string[];
  registeredDate: string;
  doctor?: string | null;
  verifiedDate?: string;
  doctorNote?: string;
  diseases: PatientDisease[];
  verified: boolean;
  verifiedBy?: string;
};

export type CreateCasePayload = Omit<AdminCase, "id" | "verified" | "registeredDate"> & {
  registeredDate?: string;
};

export type Doctor = {
  id: string;
  name: string;
  email: string;
  lastLogin: string;
  verifiedCount: number;
  firstLogin?: string;
  avatar?: string;
};

export type AdminMember = {
  id: string;
  name: string;
  email: string;
  role: Exclude<Role, "doctor">;
  joinedOn: string;
  lastLogin: string;
  hasPassword?: boolean;
};
