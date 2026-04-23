import { ReactElement } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import PatientDetailPage from "./pages/PatientDetailPage";
import VerifiedPatientsPage from "./pages/VerifiedPatientsPage";
import ProfilePage from "./pages/ProfilePage";
import { useAuthStore } from "./stores/auth";
import { useThemeStore } from "./stores/theme";
import { useEffect } from "react";

function RequireAuth({ children }: { children: ReactElement }) {
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const location = useLocation();

  if (!hydrated) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-stone">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function AppRoutes() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    setTheme(theme);
  }, [setTheme, theme]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route
          index
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/patients/:id"
          element={
            <RequireAuth>
              <PatientDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/verified"
          element={
            <RequireAuth>
              <VerifiedPatientsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
