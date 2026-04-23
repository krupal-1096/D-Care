const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body?.error || res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function loginDoctor(email: string, password: string): Promise<{ token: string; role: string; name?: string }> {
  const res = await fetch(`${API_BASE}/auth/local/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return handle(res);
}

export async function registerDoctor(name: string, email: string, password: string): Promise<{ token: string; role: string }> {
  const res = await fetch(`${API_BASE}/auth/local/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role: "doctor" })
  });
  return handle(res);
}

export async function logoutDoctor(token: string) {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handle(res);
}

export async function getDoctorCases(token: string, limit = 100) {
  const res = await fetch(`${API_BASE}/doctor/cases?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handle(res);
}

export async function verifyDoctorCase(
  token: string,
  id: string,
  payload: { diseases: any; doctorNote?: string }
) {
  const res = await fetch(`${API_BASE}/doctor/cases/${id}/verify`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handle(res);
}

export async function getDoctorProfile(token: string) {
  const res = await fetch(`${API_BASE}/doctor/profile`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handle(res);
}

export async function updateDoctorProfile(token: string, payload: { name?: string }) {
  const res = await fetch(`${API_BASE}/doctor/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handle(res);
}

export async function changeDoctorPassword(token: string, payload: { currentPassword: string; newPassword: string }) {
  const res = await fetch(`${API_BASE}/doctor/password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handle(res);
}
