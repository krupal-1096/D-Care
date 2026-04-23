import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { useThemeStore } from "../store/theme";
import { Icon } from "../components/Icon";
import "../index.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const [email, setEmail] = useState("default@admin.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!emailPattern.test(email)) {
      setError("Enter a valid admin email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setPending(true);
    try {
      await login(email, password);
      navigate("/cases");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="app-shell" style={{ gridTemplateColumns: "1fr" }}>
      <div style={{ padding: "34px" }}>
        <div className="topbar" style={{ position: "static", background: "transparent", border: "none" }}>
          <div className="sidebar-brand">
            <span
              className="sidebar-logo"
              style={{
                background: "rgba(15, 157, 88, 0.12)",
                color: "var(--accent-strong)",
                borderColor: "rgba(15, 157, 88, 0.28)"
              }}
            >
              <Icon name="logo" size={18} strokeWidth={2.2} />
            </span>
            <div>
              <div style={{ fontWeight: 800 }}>D-Care</div>
              <div className="muted" style={{ fontSize: 12 }}>
                Admin console
              </div>
            </div>
          </div>
          <div className="mono-switch" role="switch" aria-checked={theme === "dark"} onClick={toggleTheme}>
            <Icon name={theme === "dark" ? "moon" : "sun"} size={18} />
            <div className={`switch ${theme === "dark" ? "on" : ""}`}>
              <div className="switch-thumb" />
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            maxWidth: 720,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 16
          }}
        >
          <div className="stack">
            <div className="badge">Admin login</div>
            <h1 style={{ margin: 0 }}>Clinical dashboard access</h1>
            <p className="muted" style={{ maxWidth: 520 }}>
              Sign in to review dermatology cases and doctor queues. For new admin access, contact the D-Care team
              so we can provision your dashboard entry.
            </p>

            <form className="stack" onSubmit={handleSubmit}>
              <div className="stack">
                <label className="label" htmlFor="email">
                  Admin email
                </label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  value={email}
                  placeholder="admin@doctor.app"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="stack">
                <label className="label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  className="input"
                  type="password"
                  value={password}
                  placeholder="Min 6 characters"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <div className="alert">{error}</div>}
              <div className="dual-buttons">
                <button type="submit" className="button primary" disabled={pending}>
                  <Icon name="check" size={18} />
                  {pending ? "Signing in..." : "Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
