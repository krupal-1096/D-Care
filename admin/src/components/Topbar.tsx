import { useState } from "react";
import { useAuthStore } from "../store/auth";
import { useThemeStore } from "../store/theme";
import { Icon } from "./Icon";
import { ConfirmDialog } from "./ConfirmDialog";

type Props = {
  title?: string;
  subtitle?: string;
};

export function Topbar({ title, subtitle }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <header className="topbar">
      {title && (
        <div style={{ marginRight: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          <div className="page-title" style={{ fontWeight: 700 }}>{title}</div>
          {subtitle && <div className="muted" style={{ fontSize: 13 }}>{subtitle}</div>}
        </div>
      )}

      <div className="mono-switch" role="switch" aria-checked={theme === "dark"} onClick={toggleTheme}>
        <Icon name={theme === "dark" ? "moon" : "sun"} size={18} />
        <div className={`switch ${theme === "dark" ? "on" : ""}`}>
          <div className="switch-thumb" />
        </div>
      </div>

      {user && (
        <div className="button ghost" style={{ background: "var(--surface)" }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: "rgba(15, 157, 88, 0.15)",
              display: "grid",
              placeItems: "center",
              color: "var(--accent-strong)",
              fontWeight: 700
            }}
            aria-hidden
          >
            {user.email[0]?.toUpperCase() ?? "A"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontWeight: 700 }}>{user.email}</span>
            <span className="muted" style={{ fontSize: 12 }}>
              {user.provider === "google" ? "Google login" : "Email login"}
            </span>
          </div>
        </div>
      )}

      <button className="button ghost" onClick={() => setShowLogoutConfirm(true)}>
        Sign out
      </button>
      <ConfirmDialog
        open={showLogoutConfirm}
        title="Confirm logout"
        message="Sign out from D-Care admin console?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        showBadge={false}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          logout();
          setShowLogoutConfirm(false);
        }}
      />
    </header>
  );
}
