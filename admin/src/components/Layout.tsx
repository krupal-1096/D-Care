import { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ToastHost } from "./ToastHost";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/cases": { title: "Manage cases", subtitle: "Add, filter, and upload dermatology cases" },
  "/doctors": { title: "Manage doctors", subtitle: "Monitor doctor verification performance" },
  "/admins": { title: "Manage admin", subtitle: "Super admins control admin permissions" }
};

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const meta = useMemo(() => pageTitles[location.pathname] ?? { title: "", subtitle: "" }, [location.pathname]);

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div>
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <main className="page">
          <Outlet />
        </main>
        <ToastHost />
      </div>
    </div>
  );
}
