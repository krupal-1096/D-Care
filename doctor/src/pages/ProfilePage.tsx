import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "../stores/auth";
import { useDoctorStore } from "../stores/doctor";
import { changeDoctorPassword } from "../utils/api";
import { usePatientStore } from "../stores/patients";

const fieldLabel = "text-xs font-semibold text-stone uppercase tracking-[0.18em]";
const fmtDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
};

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {open ? (
      <>
        <path d="M3 3l18 18" />
        <path d="M10.477 10.489a2.5 2.5 0 0 0 3.034 3.034" />
        <path d="M9.88 4.644a9.05 9.05 0 0 1 2.12-.144C16.667 4.5 20 8 20 12c0 1.1-.242 2.146-.68 3.095" />
        <path d="M6.61 6.62C4.478 7.874 3 9.798 3 12c0 4 3.333 7.5 8 7.5 1.28 0 2.482-.238 3.548-.672" />
      </>
    ) : (
      <>
        <path d="M2.5 12C4 7.5 8 4.5 12 4.5s8 3 9.5 7.5c-1.5 4.5-5.5 7.5-9.5 7.5s-8-3-9.5-7.5Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    )}
  </svg>
);

export default function ProfilePage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const updateUserName = useAuthStore((s) => s.updateUserName);
  const { profile, loading, error, loadProfile, saveProfile } = useDoctorStore();
  const patients = usePatientStore((s) => s.patients);
  const [name, setName] = useState(user?.name ?? "");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [pwdStatus, setPwdStatus] = useState<"idle" | "success" | "error">("idle");
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (token) {
      loadProfile(token);
    }
  }, [token, loadProfile]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
    }
  }, [profile]);

  const verifiedCount = useMemo(() => {
    if (!user?.email) return 0;
    return patients.filter((p) => p.verified && p.verifiedBy === user.email).length;
  }, [patients, user?.email]);

  const allocatedCount = useMemo(() => {
    if (!user?.email) return 0;
    return patients.filter((p) => p.doctor && p.doctor === user.email).length;
  }, [patients, user?.email]);

  const showSavedBanner = status === "success" || pwdStatus === "success";

  const initials = useMemo(() => {
    const source = profile?.name || user?.name || user?.email || "DR";
    return source
      .split("@")[0]
      .split(/[\s._-]/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [profile?.name, user?.email, user?.name]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setStatus("idle");
    setPwdStatus("idle");
    setPwdError(null);

    const trimmedName = name.trim();
    const payload: { name?: string } = {};
    if (trimmedName) payload.name = trimmedName;

    let profileOk = true;
    if (Object.keys(payload).length > 0) {
      const saved = await saveProfile(token, payload);
      if (saved) {
        if (payload.name) updateUserName(saved.name);
        setStatus("success");
      } else {
        setStatus("error");
        profileOk = false;
      }
    }

    const pwdTouched = currentPassword || newPassword || confirmPassword;
    let passwordOk = true;
    if (pwdTouched) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setPwdError("Enter current, new, and confirm password to update.");
        setPwdStatus("error");
        passwordOk = false;
      } else if (newPassword.length < 6) {
        setPwdError("New password must be at least 6 characters.");
        setPwdStatus("error");
        passwordOk = false;
      } else if (newPassword !== confirmPassword) {
        setPwdError("New password and confirmation do not match.");
        setPwdStatus("error");
        passwordOk = false;
      } else {
        try {
          await changeDoctorPassword(token, { currentPassword, newPassword });
          setPwdStatus("success");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setShowCurrentPwd(false);
          setShowNewPwd(false);
          setShowConfirmPwd(false);
        } catch (error: any) {
          const message = error?.message || "Password update failed.";
          setPwdError(message);
          setPwdStatus("error");
          passwordOk = false;
        }
      }
    }

    if (profileOk && (!pwdTouched || passwordOk)) {
      setStatus("success");
    } else if (!profileOk || !passwordOk) {
      setStatus("error");
    }
  };

  if (loading && !profile) {
    return (
      <div className="space-y-4">
        <section className="glass-panel rounded-2xl p-4 sm:p-5 animate-pulse space-y-3">
          <div className="h-10 w-10 rounded-2xl bg-slate-200" />
          <div className="h-6 bg-slate-200 rounded-lg" />
          <div className="h-4 bg-slate-100 rounded" />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="glass-panel rounded-2xl p-4 sm:p-5 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-brand-100 text-brand-800 font-semibold grid place-items-center">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-ink truncate">{profile?.name || user?.name || "Doctor"}</p>
            <p className="text-xs text-slate-500 truncate">{profile?.email || user?.email}</p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2 items-center justify-end">
            <div className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 shadow-sm">
              Verified {verifiedCount}
            </div>
            <div className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
              Allocated {allocatedCount}
            </div>
            <div className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold border border-slate-700 shadow-sm">
              Last login {fmtDateTime(profile?.lastLogin)}
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => setEditMode((prev) => !prev)}
            className="inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
          >
            {editMode ? "Close editor" : "Edit details"}
          </button>
        </div>
        {showSavedBanner && (
          <div className="mt-2 text-xs text-emerald-700 font-semibold">Saved • just now</div>
        )}
      </section>

      <AnimatePresence initial={false}>
        {editMode && (
          <motion.section
            className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4 overflow-hidden"
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">Profile & password</p>
                <p className="text-xs text-stone">Update your display info or password.</p>
              </div>
              {status === "success" && <span className="text-xs text-emerald-600 font-semibold">Saved</span>}
              {status === "error" && <span className="text-xs text-rose-600 font-semibold">Save failed</span>}
            </div>
            <form className="grid gap-3" onSubmit={handleSubmit}>
              <label className="grid gap-1">
                <span className={fieldLabel}>Display name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Dr. Priya Menon"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white text-ink"
                />
              </label>
              {error && <p className="text-xs text-rose-600">{error}</p>}

              <div className="h-px bg-slate-200" />

              <label className="grid gap-1">
                <span className={fieldLabel}>Current password</span>
                <div className="relative">
                  <input
                    type={showCurrentPwd ? "text" : "password"}
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white text-ink"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500"
                    onClick={() => setShowCurrentPwd((v) => !v)}
                    aria-label={showCurrentPwd ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showCurrentPwd} />
                  </button>
                </div>
              </label>
              <label className="grid gap-1">
                <span className={fieldLabel}>New password</span>
                <div className="relative">
                  <input
                    type={showNewPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white text-ink"
                    autoComplete="new-password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500"
                    onClick={() => setShowNewPwd((v) => !v)}
                    aria-label={showNewPwd ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showNewPwd} />
                  </button>
                </div>
              </label>
              <label className="grid gap-1">
                <span className={fieldLabel}>Confirm new password</span>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white text-ink"
                    autoComplete="new-password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500"
                    onClick={() => setShowConfirmPwd((v) => !v)}
                    aria-label={showConfirmPwd ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showConfirmPwd} />
                  </button>
                </div>
              </label>
              {pwdError && <p className="text-xs text-rose-600">{pwdError}</p>}
              <div className="flex items-center gap-2 justify-between">
                <button
                  type="button"
                  className="rounded-full border border-rose-300 text-rose-700 px-4 py-2 text-sm font-semibold hover:border-rose-400 bg-white"
                  onClick={() => {
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setShowCurrentPwd(false);
                    setShowNewPwd(false);
                    setShowConfirmPwd(false);
                    setPwdStatus("idle");
                    setPwdError(null);
                  }}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full border border-brand-300 text-brand-700 px-4 py-2 text-sm font-semibold hover:border-brand-400 bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : status === "success" ? "Saved" : "Save changes"}
                </button>
              </div>
              {pwdStatus === "success" && <span className="text-xs text-emerald-600 font-semibold">Password updated</span>}
              {pwdStatus === "error" && <span className="text-xs text-rose-600 font-semibold">Update failed</span>}
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
