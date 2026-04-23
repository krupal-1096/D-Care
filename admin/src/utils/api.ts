import { AdminApiAdminsResponse, AdminApiCasesResponse, AdminApiDoctorsResponse, AdminLockResponse } from "../types/api";

const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:4000";

type LoginResponse = { token: string; role: string };

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = (await res.json().catch(() => ({} as any)))?.error ?? res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/local/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return handle<LoginResponse>(res);
}

export async function getCases(token: string): Promise<AdminApiCasesResponse> {
  const res = await fetch(`${API_BASE}/admin/cases`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handle(res);
}

export async function createCase(token: string, payload: any) {
  const res = await fetch(`${API_BASE}/admin/cases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handle(res);
}

export async function verifyCase(token: string, id: string, doctor?: string, note?: string) {
  const res = await fetch(`${API_BASE}/admin/cases/${id}/verify`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ doctor, note })
  });
  return handle(res);
}

export async function updateCase(token: string, id: string, payload: any) {
  const res = await fetch(`${API_BASE}/admin/cases/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handle(res);
}

export async function deleteCase(token: string, id: string) {
  const res = await fetch(`${API_BASE}/admin/cases/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handle(res);
}

export async function getDoctors(token: string): Promise<AdminApiDoctorsResponse> {
  const res = await fetch(`${API_BASE}/admin/doctors`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handle(res);
}

export async function createDoctor(token: string, payload: any) {
  const res = await fetch(`${API_BASE}/admin/doctors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handle(res);
}

export async function updateDoctor(token: string, id: string, payload: any) {
  const res = await fetch(`${API_BASE}/admin/doctors/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handle(res);
}

export async function deleteDoctor(token: string, id: string) {
  const res = await fetch(`${API_BASE}/admin/doctors/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handle(res);
}

export async function getAdmins(token: string): Promise<AdminApiAdminsResponse> {
  const res = await fetch(`${API_BASE}/admin/admins`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handle(res);
}

export async function createAdmin(token: string, payload: any) {
  const res = await fetch(`${API_BASE}/admin/admins`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handle(res);
}

export async function deleteAdmin(token: string, id: string) {
  const res = await fetch(`${API_BASE}/admin/admins/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handle(res);
}

export async function updateAdmin(token: string, id: string, payload: any) {
  const res = await fetch(`${API_BASE}/admin/admins/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handle(res);
}

export async function getAdminLock(token: string): Promise<AdminLockResponse> {
  const res = await fetch(`${API_BASE}/admin/admin-lock`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handle(res);
}

export async function setAdminLock(token: string, mode: "role" | "delete", disableUntil: string | null) {
  const res = await fetch(`${API_BASE}/admin/admin-lock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ mode, disableUntil })
  });
  return handle(res);
}
