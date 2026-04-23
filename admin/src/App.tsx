import { ReactElement, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import CasesPage from "./pages/CasesPage";
import DoctorsPage from "./pages/DoctorsPage";
import AdminsPage from "./pages/AdminsPage";
import { Layout } from "./components/Layout";
import { useAuthStore } from "./store/auth";
import { useThemeStore } from "./store/theme";

function RequireAuth({ children }: { children: ReactElement }) {
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const location = useLocation();

  if (!hydrated) {
    return (
      <div className="page" style={{ padding: 32 }}>
        <div className="muted">Restoring your session...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route
          index
          element={
            <RequireAuth>
              <CasesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/cases"
          element={
            <RequireAuth>
              <CasesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/doctors"
          element={
            <RequireAuth>
              <DoctorsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admins"
          element={
            <RequireAuth>
              <AdminsPage />
            </RequireAuth>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/cases" replace />} />
    </Routes>
  );
}

export default function App() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
