import { Outlet, useLocation, useMatch } from "react-router-dom";
import Header from "./Header";
import FooterNav from "./FooterNav";
import { usePatientStore } from "../stores/patients";

const TITLE_MAP: Record<string, string> = {
  "/": "Home",
  "/verified": "Verified Patients",
  "/profile": "Profile"
};

export default function Layout() {
  const location = useLocation();
  const patientMatch = useMatch("/patients/:id");
  const patients = usePatientStore((state) => state.patients);
  const patientTitle =
    patientMatch?.params?.id &&
    patients.find((patient) => patient.id === patientMatch.params.id)?.name;

  const title = patientTitle || TITLE_MAP[location.pathname] || "Doctor Workspace";

  return (
    <div className="min-h-screen flex flex-col text-ink">
      <Header title={title} />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pb-24 pt-4 sm:pt-8">
        <Outlet />
      </main>
      <FooterNav />
    </div>
  );
}
