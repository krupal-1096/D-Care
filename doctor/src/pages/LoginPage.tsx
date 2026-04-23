import { FormEvent, useEffect, useMemo, useState } from "react";
import { Location, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth";

const passwordPattern = /^.{6,}$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loginWithEmail, registerWithEmail } = useAuthStore();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [buttonState, setButtonState] = useState<"idle" | "loading" | "success">("idle");

  const from = (location.state as { from?: Location })?.from?.pathname || "/";

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const validationMessage = useMemo(() => {
    if (!email.trim()) return "Enter doctor mail";
    if (mode === "signup" && !name.trim()) return "Enter your name";
    if (!passwordPattern.test(password)) {
      return "Password must be at least 6 characters.";
    }
    if (mode === "signup" && password !== confirm) return "Passwords do not match.";
    return "";
  }, [email, password, confirm, mode, name]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setBusy(true);
    setButtonState("loading");
    setError("");
    try {
      if (mode === "login") {
        await loginWithEmail(email.trim().toLowerCase(), password);
      } else {
        await registerWithEmail(name.trim(), email.trim().toLowerCase(), password);
      }
      setButtonState("success");
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg =
        err?.message && err.message.toLowerCase().includes("fetch")
          ? "Connection issue, please try again."
          : err?.message && err.message.toLowerCase().includes("invalid")
          ? "Wrong credentials! Try again."
          : "Unable to sign in. Please try again.";
      setError(msg);
      setButtonState("idle");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="glass-panel max-w-4xl w-full rounded-2xl overflow-hidden grid md:grid-cols-2">
        <div className="bg-gradient-to-br from-brand-400 to-brand-700 text-white p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.25em]">Doctor Access</p>
            <h1 className="text-3xl md:text-4xl font-semibold font-display leading-snug">
              Secure clinical gate for reviewing patient cases.
            </h1>
            <p className="text-sm text-white/85">Login with your doctor credentials or create an account.</p>
          </div>
        </div>

        <div className="p-8 bg-white/90">
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-ink">{mode === "login" ? "Login" : "Sign up"}</h2>
              <span className="text-xs text-stone">Doctors only</span>
            </div>

            {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}

            {mode === "signup" && (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink">Full name</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Dr. Priya Sharma"
                required
              />
            </label>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="username"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter doctor mail"
              required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 text-slate-500 hover:text-ink"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {showPassword ? (
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
                </button>
              </div>
            </label>

            {mode === "signup" && (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink">Confirm password</span>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirm-password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    placeholder="Repeat password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-3 text-slate-500 hover:text-ink"
                    aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      {showConfirm ? (
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
                  </button>
                </div>
              </label>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-brand-600 text-white rounded-xl py-3 font-semibold hover:bg-brand-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {buttonState === "loading" && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" aria-hidden />}
              {buttonState === "success" && (
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m5 13 4 4L19 7" />
                </svg>
              )}
              {buttonState === "loading"
                ? "Signing in..."
                : buttonState === "success"
                  ? "Success"
                  : mode === "login"
                    ? "Login"
                    : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-sm text-stone flex items-center justify-between">
            {mode === "login" ? (
              <>
                <span>New here?</span>
                <button className="text-brand-600 font-semibold" onClick={() => setMode("signup")}>
                  Create an account
                </button>
              </>
            ) : (
              <>
                <span>Already have an account?</span>
                <button className="text-brand-600 font-semibold" onClick={() => setMode("login")}>
                  Back to login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
