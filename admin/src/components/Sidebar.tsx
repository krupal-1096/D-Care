import { NavLink } from "react-router-dom";
import { Icon } from "./Icon";
import { useAuthStore } from "../store/auth";
import logoImg from "../../../assets/icons/android/ic_launcher-web.png";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

const navItems = [
  { to: "/cases", label: "Manage cases", icon: "cases" as const },
  { to: "/doctors", label: "Manage doctors", icon: "doctors" as const },
  { to: "/admins", label: "Manage admin", icon: "shield" as const }
];

export function Sidebar({ collapsed, onToggle }: Props) {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? null;
  const roleLabel = role === "super" ? "SUPER ADMIN" : "ADMIN";

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`} style={{ width: collapsed ? 84 : 240 }}>
      <div className="sidebar-inner">
        <div className="sidebar-head">
          <div
            className="sidebar-brand"
            aria-label={roleLabel}
            style={{
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              textAlign: "center",
              gap: collapsed ? 4 : 10
            }}
          >
            {!collapsed && (
              <span className="sidebar-logo" style={{ padding: 64, margin: "0 auto" }}>
                <img src={logoImg} alt="logo" style={{ width: 120, height: 120 }} />
              </span>
            )}
            {!collapsed && <div style={{ fontWeight: 800 }}>{roleLabel}</div>}
          </div>
          <button className="collapse-toggle" onClick={onToggle} aria-label="Toggle sidebar">
            <Icon name="menu" size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Admin navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <Icon name={item.to === "/admins" && role !== "super" ? "lock" : item.icon} className="nav-icon" />
              {!collapsed && (
                <span className="nav-label" style={item.to === "/admins" && role !== "super" ? { color: "var(--muted)" } : undefined}>
                  {item.label}
                </span>
              )}
              {!collapsed ? null : null}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
