export type Disease = {
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
  // legacy field kept for persisted data
  diseaseImage?: string;
  diseaseImages: string[];
  diseaseImageLabels?: string[];
  registeredDate: string;
  verifiedDate?: string;
  doctorNote?: string;
  diseases: Disease[];
  verified: boolean;
  verifiedBy?: string;
};

export type User = {
  id: string;
  email?: string;
  provider: "email" | "google";
  name?: string;
};

export type DoctorProfile = {
  id: string;
  name: string;
  email: string;
  lastLogin?: string;
  verifiedCount?: number;
};
