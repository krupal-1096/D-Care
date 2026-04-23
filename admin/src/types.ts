export type AdminUser = {
  id: string;
  email: string;
  provider: "email" | "google";
  role: "super" | "admin";
};

export type AdminMember = {
  id: string;
  name: string;
  email: string;
  role: "super" | "admin";
  joinedOn: string;
  lastLogin: string;
  hasPassword?: boolean;
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

export type Doctor = {
  id: string;
  name: string;
  email: string;
  lastLogin: string;
  verifiedCount: number;
  firstLogin?: string;
  avatar?: string;
};
