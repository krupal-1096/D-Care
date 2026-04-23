import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useAdminStore } from "../store/admins";
import { useAuthStore } from "../store/auth";
import { AdminMember } from "../types";
import { getAdminLock, setAdminLock } from "../utils/api";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export default function AdminsPage() {
  const { admins, addAdmin, removeAdmin, loadAdmins, updateAdmin } = useAdminStore();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isSuperAdmin = user?.role === "super";
  const [showForm, setShowForm] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ admin: AdminMember; nextRole: AdminMember["role"] } | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, { password: string; confirm: string; error?: string; saving?: boolean }>>({});
  const [showPasswordFields, setShowPasswordFields] = useState<Record<string, boolean>>({});
  const [deleteAttemptsLeft, setDeleteAttemptsLeft] = useState(3);
  const [roleAttemptsLeft, setRoleAttemptsLeft] = useState(3);
  const [disableRoleUntil, setDisableRoleUntil] = useState<number | null>(null);
  const [disableDeleteUntil, setDisableDeleteUntil] = useState<number | null>(null);
  const [captchaModal, setCaptchaModal] = useState<
    | {
        mode: "delete" | "role";
        admin: AdminMember;
        captcha: string;
        inputs: string[];
      }
    | null
  >(null);
  const captchaRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const ATTEMPT_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

  const formatRemaining = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];
    if (hours) parts.push(`${hours}h`);
    if (minutes || hours) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(" ");
  };

  useEffect(() => {
    const fetchLock = async () => {
      if (!token || !isSuperAdmin) return;
      try {
        const data = await getAdminLock(token);
        const roleLock = data?.disableRoleUntil ? new Date(data.disableRoleUntil).getTime() : null;
        const deleteLock = data?.disableDeleteUntil ? new Date(data.disableDeleteUntil).getTime() : null;
        setDisableRoleUntil(roleLock && roleLock > Date.now() ? roleLock : null);
        setDisableDeleteUntil(deleteLock && deleteLock > Date.now() ? deleteLock : null);
        setRoleAttemptsLeft(roleLock && roleLock > Date.now() ? 0 : 3);
        setDeleteAttemptsLeft(deleteLock && deleteLock > Date.now() ? 0 : 3);
      } catch (error) {
        console.error("Failed to fetch admin lock", error);
      }
    };
    fetchLock();
  }, [token, isSuperAdmin]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (disableRoleUntil && now >= disableRoleUntil) {
      setDisableRoleUntil(null);
      setRoleAttemptsLeft(3);
    }
    if (disableDeleteUntil && now >= disableDeleteUntil) {
      setDisableDeleteUntil(null);
      setDeleteAttemptsLeft(3);
    }
  }, [now, disableRoleUntil, disableDeleteUntil]);

  const createCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%";
    let value = "";
    while (value.length < 6) {
      value += chars[Math.floor(Math.random() * chars.length)];
    }
    return value;
  };

  const openCaptcha = (mode: "delete" | "role", admin: AdminMember, nextRole?: AdminMember["role"]) => {
    const roleLocked = disableRoleUntil ? now < disableRoleUntil : false;
    const deleteLocked = disableDeleteUntil ? now < disableDeleteUntil : false;
    if (mode === "delete" && (deleteAttemptsLeft <= 0 || deleteLocked)) return;
    if (mode === "role" && (roleAttemptsLeft <= 0 || roleLocked)) return;
    if (mode === "role" && nextRole) {
      setPendingAction({ admin, nextRole });
    } else if (mode === "delete") {
      setPendingAction(null);
    }
    const captcha = createCaptcha();
    setCaptchaModal({
      mode,
      admin,
      captcha,
      inputs: Array(6).fill("")
    });
    setCaptchaError(null);
    captchaRefs.current = [];
    setTimeout(() => {
      captchaRefs.current[0]?.focus();
    }, 10);
  };

  const handleCaptchaInputChange = (idx: number, value: string) => {
    if (!captchaModal) return;
    const char = value.slice(-1);
    setCaptchaError(null);
    setCaptchaModal((prev) => {
      if (!prev) return prev;
      const inputs = [...prev.inputs];
      inputs[idx] = char;
      return { ...prev, inputs };
    });
    if (char && captchaRefs.current[idx + 1]) {
      captchaRefs.current[idx + 1]?.focus();
    }
  };

  const handleCaptchaKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (!captchaModal) return;
    if (e.key === "Backspace" && !captchaModal.inputs[idx] && captchaRefs.current[idx - 1]) {
      captchaRefs.current[idx - 1]?.focus();
    }
  };

  const handleCaptchaSubmit = async () => {
    if (!captchaModal) return;
    const entered = captchaModal.inputs.join("");
    const isDelete = captchaModal.mode === "delete";
    const attemptsLeft = isDelete ? deleteAttemptsLeft : roleAttemptsLeft;
    const ttlUntil = Date.now() + ATTEMPT_TTL_MS;
    if (entered === captchaModal.captcha) {
      try {
        setUpdatingRole(true);
        if (isDelete) {
          await removeAdmin(token ?? null, captchaModal.admin.id);
          setDeleteAttemptsLeft(3);
          setDisableDeleteUntil(null);
          if (token) {
            await setAdminLock(token, "delete", null);
          }
        } else if (pendingAction) {
          await updateAdmin(token ?? null, pendingAction.admin.id, { role: pendingAction.nextRole });
          setRoleAttemptsLeft(3);
          setDisableRoleUntil(null);
          if (token) {
            await setAdminLock(token, "role", null);
          }
          setPendingAction(null);
        }
        setCaptchaModal(null);
        setCaptchaError(null);
      } catch (err: any) {
        setCaptchaError(err?.message || "Action failed. Try again.");
      } finally {
        setUpdatingRole(false);
      }
      return;
    }

    const updatedAttempts = Math.max(0, attemptsLeft - 1);
    if (isDelete) {
      if (updatedAttempts <= 0) {
        setDeleteAttemptsLeft(0);
        setDisableDeleteUntil(ttlUntil);
        if (token) {
          await setAdminLock(token, "delete", new Date(ttlUntil).toISOString());
        }
      } else {
        setDeleteAttemptsLeft(updatedAttempts);
      }
    } else {
      if (updatedAttempts <= 0) {
        setRoleAttemptsLeft(0);
        setDisableRoleUntil(ttlUntil);
        if (token) {
          await setAdminLock(token, "role", new Date(ttlUntil).toISOString());
        }
      } else {
        setRoleAttemptsLeft(updatedAttempts);
      }
    }
    const errorMsg =
      updatedAttempts <= 0
        ? "Captcha failed too many times. This action is disabled for 6 hours."
        : `Captcha mismatch. ${updatedAttempts} attempt(s) left.`;
    setCaptchaError(errorMsg);
    setCaptchaModal({
      ...captchaModal,
      captcha: createCaptcha(),
      inputs: Array(6).fill("")
    });
    captchaRefs.current = [];
    setTimeout(() => captchaRefs.current[0]?.focus(), 10);
  };

  useEffect(() => {
    if (token && isSuperAdmin) loadAdmins(token);
  }, [token, loadAdmins, isSuperAdmin]);

  const summary = useMemo(() => {
    const yourAdmin = admins.find((a) => a.email === user?.email);
    const fallbackLastLogin = admins.map((a) => a.lastLogin).filter(Boolean)[0];
    return {
      total: admins.length,
      supers: admins.filter((a) => a.role === "super").length,
      mostRecent: admins
        .map((a) => a.joinedOn)
        .filter(Boolean)
        .sort((a, b) => (a > b ? -1 : 1))[0],
      yourLastLogin:
        (yourAdmin?.lastLogin && yourAdmin.lastLogin !== "—" ? yourAdmin.lastLogin : null) ||
        fallbackLastLogin ||
        "—"
    };
  }, [admins, user?.email]);

  const handleAddAdmin = (payload: Omit<AdminMember, "id" | "joinedOn" | "lastLogin" | "hasPassword"> & { password: string }) => {
    addAdmin(token ?? null, payload);
    setShowForm(false);
  };

  const updateDraft = (id: string, patch: Partial<{ password: string; confirm: string; error?: string; saving?: boolean }>) => {
    setPasswordDrafts((prev) => {
      const current = prev[id] ?? { password: "", confirm: "", error: "", saving: false };
      return { ...prev, [id]: { ...current, ...patch } };
    });
  };

  const roleLocked = disableRoleUntil ? now < disableRoleUntil : false;
  const deleteLocked = disableDeleteUntil ? now < disableDeleteUntil : false;
  const roleAttemptsDisplay = roleLocked ? 0 : roleAttemptsLeft;
  const deleteAttemptsDisplay = deleteLocked ? 0 : deleteAttemptsLeft;

  if (!isSuperAdmin) {
    return (
      <>
        <div className="page-header">
          <div className="page-title">
            <span className="badge neutral">Manage admin</span>
            <span className="muted">Only super admins can manage other admins.</span>
          </div>
        </div>
        <div className="card" style={{ padding: 28 }}>
          <div className="page-title" style={{ gap: 10, alignItems: "flex-start" }}>
            <span
              className="badge neutral"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(107,114,128,0.12)" }}
            >
              <Icon name="lock" size={16} />
              Restricted
            </span>
            <div className="stack" style={{ gap: 6 }}>
              <h2 style={{ margin: 0 }}>You don’t have super admin access.</h2>
              <div className="muted">Contact your organisation for elevated access to manage admin users.</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <span className="badge neutral">Manage admin</span>
          <span className="muted">Super admin can add/remove. Others can only manage cases.</span>
          {roleLocked && (
            <div className="muted blink" style={{ fontWeight: 700, color: "#b91c1c" }}>
              Grant/Revoke access disabled for {formatRemaining((disableRoleUntil ?? 0) - now)} after 3 failed captcha attempts.
            </div>
          )}
        </div>
        <div className="dual-buttons">
          <button className="button ghost" onClick={() => setShowForm((v) => !v)}>
            <Icon name="plus" size={18} />
            {showForm ? "Hide add admin" : "Add admin"}
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card kpi compact">
          <div className="muted" style={{ fontSize: 12 }}>
            Access
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="status-dot" />
            <span
              className="chip"
              style={{
                background: isSuperAdmin ? "rgba(15,157,88,0.18)" : "rgba(251,191,36,0.2)",
                color: isSuperAdmin ? "var(--accent-strong)" : "#b45309"
              }}
            >
              <Icon name="shield" size={16} />
              {isSuperAdmin ? "Super admin" : "Admin"}
            </span>
            <span className="muted" style={{ fontSize: 12 }}>
              {user?.email}
            </span>
          </div>
        </div>
        <div className="card kpi compact">
          <div className="muted" style={{ fontSize: 12 }}>
            Total admins
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="status-dot" />
            <div style={{ fontSize: 24, fontWeight: 700 }}>{summary.total}</div>
            <span className="chip gray">team</span>
          </div>
        </div>
        <div className="card kpi compact">
          <div className="muted" style={{ fontSize: 12 }}>
            Super admins
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="status-dot" />
            <div style={{ fontSize: 24, fontWeight: 700 }}>{summary.supers}</div>
            <span className="chip gray">super</span>
          </div>
        </div>
        <div className="card kpi compact">
          <div className="muted" style={{ fontSize: 12 }}>
            Last login
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="status-dot" />
            <div style={{ fontSize: 18, fontWeight: 700 }}>{summary.yourLastLogin ?? "—"}</div>
            <span className="chip gray">activity</span>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="page-header">
            <div className="page-title" style={{ alignItems: "flex-start" }}>
              <span className="badge">Add admin</span>
              <div className="stack" style={{ gap: 4 }}>
                <h2 style={{ margin: 0, fontSize: 22 }}>Single admin entry</h2>
                <span className="muted">Matches the styling from Manage cases add form.</span>
              </div>
            </div>
          </div>
          <AdminForm onSubmit={handleAddAdmin} onCancel={() => setShowForm(false)} disabled={!isSuperAdmin} />
          {!isSuperAdmin && (
            <div className="muted" style={{ marginTop: 8, fontWeight: 600 }}>
              Only super admins can add team members.
            </div>
          )}
        </div>
      )}

      <div className="stacked-list">
        {admins.map((admin) => {
          const isCurrentUser = admin.email === user?.email;
          const draft = passwordDrafts[admin.id] ?? { password: "", confirm: "", error: "", saving: false };
          const showPasswords = showPasswordFields[admin.id] ?? false;
          const isRoleActionDisabled = roleLocked || roleAttemptsLeft <= 0;
          const isDeleteActionDisabled = deleteLocked || deleteAttemptsLeft <= 0;
          const isSuperRole = admin.role === "super";
          return (
            <article key={admin.id} className="card stack compact-card" style={{ gap: 10 }}>
              <div className="page-header">
                <div className="page-title" style={{ gap: 10 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: admin.role === "super" ? "rgba(15,157,88,0.16)" : "rgba(107,114,128,0.15)",
                      display: "grid",
                      placeItems: "center",
                      color: admin.role === "super" ? "var(--accent-strong)" : "var(--muted)",
                      boxShadow: "var(--shadow)"
                    }}
                    aria-hidden
                  >
                    <Icon name={admin.role === "super" ? "shield" : "badge"} size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{admin.name}</span>
                      <span className={`chip ${isSuperRole ? "info" : "success"}`} style={{ fontSize: 13, padding: "4px 8px" }}>
                        <Icon name={isSuperRole ? "shield" : "badge"} size={14} />
                        {isSuperRole ? "Super admin" : "Admin"}
                      </span>
                    </div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {admin.email}
                    </div>
                  </div>
                </div>
                <div className="dual-buttons" style={{ justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                  {isSuperAdmin && !isCurrentUser && (
                    <button
                      className="button compact"
                      style={{
                        background: admin.role === "super" ? "#fef2f2" : "#2563eb",
                        color: admin.role === "super" ? "#b91c1c" : "#fff",
                        borderColor: admin.role === "super" ? "#fecaca" : "transparent"
                      }}
                      disabled={isRoleActionDisabled}
                      onClick={() => openCaptcha("role", admin, admin.role === "super" ? "admin" : "super")}
                    >
                      <Icon name={admin.role === "super" ? "lock" : "shield"} size={14} />
                      {admin.role === "super" ? "Revoke super access" : "Grant Super user access"}
                    </button>
                  )}
                  {isSuperAdmin && !isCurrentUser && (
                    <button
                      className="button ghost compact"
                      title={isDeleteActionDisabled ? "Deletion disabled after captcha failures." : "Delete admin"}
                      disabled={isDeleteActionDisabled}
                      onClick={() => openCaptcha("delete", admin)}
                      style={{ color: "#b91c1c" }}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="tag-row" style={{ flexWrap: "wrap" }}>
                <span className="badge neutral">Joined {admin.joinedOn}</span>
                <span className="badge neutral">Last login {admin.lastLogin}</span>
              </div>
              {isSuperAdmin && !admin.hasPassword && (
                <div className="stack" style={{ gap: 8, marginTop: 6 }}>
                  <div className="muted" style={{ fontWeight: 600, fontSize: 13 }}>
                    Password not set — add one to enable login.
                  </div>
                  {draft.error && <div className="field-error">{draft.error}</div>}
                  <div className="dual-buttons" style={{ justifyContent: "flex-start" }}>
                    <button
                      className="button compact"
                      type="button"
                      style={{ background: "#111827", color: "#fff", borderColor: "#111827" }}
                      disabled={draft.saving}
                      onClick={async () => {
                        if (!showPasswords) {
                          setShowPasswordFields((prev) => ({ ...prev, [admin.id]: true }));
                          return;
                        }
                        if (draft.password.length < 6) {
                          updateDraft(admin.id, { error: "Password must be at least 6 characters." });
                          return;
                        }
                        if (draft.password !== draft.confirm) {
                          updateDraft(admin.id, { error: "Passwords do not match." });
                          return;
                        }
                        updateDraft(admin.id, { error: "", saving: true });
                        try {
                          await updateAdmin(token ?? null, admin.id, { password: draft.password });
                          updateDraft(admin.id, { password: "", confirm: "", saving: false });
                          setShowPasswordFields((prev) => ({ ...prev, [admin.id]: false }));
                        } catch (err: any) {
                          updateDraft(admin.id, { saving: false, error: err?.message || "Failed to set password" });
                        }
                      }}
                    >
                      {showPasswords ? (draft.saving ? "Saving..." : "Save password") : "Set password"}
                    </button>
                  </div>
                  {showPasswords && (
                    <div className="form-grid compact-grid">
                      <div className="stack">
                        <label className="label">Password</label>
                        <input
                          className="input dense"
                          type="password"
                          value={draft.password}
                          onChange={(e) => updateDraft(admin.id, { password: e.target.value })}
                          placeholder="Min 6 characters"
                        />
                      </div>
                      <div className="stack">
                        <label className="label">Confirm password</label>
                        <input
                          className="input dense"
                          type="password"
                          value={draft.confirm}
                          onChange={(e) => updateDraft(admin.id, { confirm: e.target.value })}
                          placeholder="Re-enter password"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {admins.length === 0 && <div className="empty-state">No admins yet.</div>}
      </div>
      {captchaModal && (
        <div className="modal-backdrop" onClick={() => setCaptchaError(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="stack" style={{ gap: 14 }}>
              <div className="page-title" style={{ gap: 6 }}>
                <span className="badge danger">
                  {captchaModal.mode === "delete"
                    ? "Confirm delete"
                    : pendingAction?.nextRole === "super"
                    ? "Grant Super access"
                    : "Revoke Super access"}
                </span>  Type following captcha below:
                <div className="captcha-letters">
                  {captchaModal.captcha.split("").map((ch, idx) => (
                    <span key={idx}>{ch}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                {captchaModal.inputs.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (captchaRefs.current[idx] = el)}
                    value={val}
                    onChange={(e) => handleCaptchaInputChange(idx, e.target.value)}
                    onKeyDown={(e) => handleCaptchaKeyDown(idx, e)}
                    maxLength={1}
                    className={`input captcha-input ${captchaError ? "error" : ""}`}
                    style={{ width: 48, textAlign: "center", fontSize: 18 }}
                  />
                ))}
              </div>
              <div className="muted" style={{ textAlign: "center" }}>
                Attempts left: {captchaModal.mode === "delete" ? deleteAttemptsDisplay : roleAttemptsDisplay}
              </div>
              {captchaError && <div className="field-error">{captchaError}</div>}
              <div className="dual-buttons" style={{ justifyContent: "flex-end" }}>
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => {
                    setCaptchaModal(null);
                    setCaptchaError(null);
                    setPendingAction(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="button primary"
                  type="button"
                  disabled={
                    (captchaModal.mode === "delete" ? deleteAttemptsDisplay <= 0 : roleAttemptsDisplay <= 0) || updatingRole
                  }
                  onClick={handleCaptchaSubmit}
                >
                  {updatingRole ? "Working..." : captchaModal.mode === "delete" ? "Verify & delete" : "Verify & continue"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type AdminFormProps = {
  onSubmit: (admin: Omit<AdminMember, "id" | "joinedOn" | "lastLogin" | "hasPassword"> & { password: string }) => void;
  onCancel: () => void;
  disabled?: boolean;
};

function AdminForm({ onSubmit, onCancel, disabled = false }: AdminFormProps) {
  const [form, setForm] = useState<Omit<AdminMember, "id" | "joinedOn" | "lastLogin" | "hasPassword"> & { password: string; confirm: string }>({
    name: "",
    email: "",
    role: "admin",
    password: "",
    confirm: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!emailPattern.test(form.email)) nextErrors.email = "Enter a valid email.";
    if (form.password.length < 6) nextErrors.password = "Password must be at least 6 characters.";
    if (form.password !== form.confirm) nextErrors.confirm = "Passwords do not match.";
    setErrors(nextErrors);
  }, [form]);

  const update = (patch: Partial<typeof form>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (disabled || Object.keys(errors).length > 0) return;
    const { confirm, ...rest } = form;
    onSubmit(rest);
    setForm({ name: "", email: "", role: "admin", password: "", confirm: "" });
  };

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="stack">
          <label className="label" htmlFor="adminName">
            Full name
          </label>
          {errors.name && <div className="field-error">{errors.name}</div>}
          <input
            id="adminName"
            className="input"
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g. Priya Sen"
            required
            disabled={disabled}
          />
        </div>
        <div className="stack">
          <label className="label" htmlFor="adminEmail">
            Work email
          </label>
          {errors.email && <div className="field-error">{errors.email}</div>}
          <input
            id="adminEmail"
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="admin@doctor.app"
            required
            disabled={disabled}
          />
        </div>
        <div className="stack">
          <label className="label" htmlFor="adminRole">
            Role
          </label>
          <select
            id="adminRole"
            className="dense"
            value={form.role}
            onChange={(e) => update({ role: e.target.value as AdminMember["role"] })}
            disabled={disabled}
          >
            <option value="admin">Admin - manage cases</option>
            <option value="super">Super admin - manage admins</option>
          </select>
        </div>
        <div className="stack">
          <label className="label" htmlFor="adminPassword">
            Password
          </label>
          {errors.password && <div className="field-error">{errors.password}</div>}
          <input
            id="adminPassword"
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => update({ password: e.target.value })}
            placeholder="Min 6 characters"
            required
            disabled={disabled}
          />
        </div>
        <div className="stack">
          <label className="label" htmlFor="adminConfirm">
            Confirm password
          </label>
          {errors.confirm && <div className="field-error">{errors.confirm}</div>}
          <input
            id="adminConfirm"
            className="input"
            type="password"
            value={form.confirm}
            onChange={(e) => update({ confirm: e.target.value })}
            placeholder="Re-enter password"
            required
            disabled={disabled}
          />
        </div>
      </div>
      <div className="dual-buttons" style={{ justifyContent: "space-between" }}>
        <div className="muted" style={{ fontSize: 13 }}>
          New admins inherit the case form styling for consistency.
        </div>
        <div className="dual-buttons" style={{ justifyContent: "flex-end" }}>
          <button className="button ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="button primary" type="submit" disabled={disabled || Object.keys(errors).length > 0}>
            Add admin
          </button>
        </div>
      </div>
    </form>
  );
}
