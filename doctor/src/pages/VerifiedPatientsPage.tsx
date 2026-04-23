import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PatientCard from "../components/PatientCard";
import { useAuthStore } from "../stores/auth";
import { usePatientStore } from "../stores/patients";
import { ConfirmDialog } from "../components/ConfirmDialog";

export default function VerifiedPatientsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const patients = usePatientStore((state) => state.patients);
  const loadPatients = usePatientStore((state) => state.loadPatients);
  const loading = usePatientStore((state) => state.loading);
  const token = useAuthStore((s) => s.token);
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    if (!token) return;
    if (patients.length === 0) {
      loadPatients(token, 200);
    }
  }, [loadPatients, patients.length, token]);

  const initialLoading = loading && patients.length === 0;

  const verifiedPatients = patients.filter((patient) => {
    if (!patient.verified) return false;
    if (user?.email && patient.verifiedBy && patient.verifiedBy !== user.email) return false;
    return true;
  });
  useEffect(() => {
    setPage(1);
  }, [verifiedPatients.length]);
  const totalPages = Math.max(1, Math.ceil(verifiedPatients.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = verifiedPatients.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-stone">Verified by {user?.email || user?.id}</p>
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Verified {verifiedPatients.length}
            </span>
          </div>
          <p className="text-sm text-stone">Only patients you personally verified appear here. Reopen a card to adjust sliders if needed.</p>
        </div>
      </section>

      {initialLoading ? (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="glass-panel rounded-2xl p-4 animate-pulse space-y-3">
              <div className="h-10 bg-slate-200/60 rounded-xl" />
              <div className="h-6 bg-slate-200/60 rounded-lg" />
              <div className="h-24 bg-slate-200/60 rounded-xl" />
            </div>
          ))}
        </div>
      ) : verifiedPatients.length === 0 ? (
        <div className="glass-panel rounded-2xl p-6 text-center text-stone">
          No verified patients yet. Return to Home to review cases.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 max-h-[70vh] overflow-y-auto pr-1">
            {paged.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                showDoctorNote
                onClick={() => navigate(`/patients/${patient.id}`)}
                action={
                  <button
                    type="button"
                    onClick={() => setPendingEditId(patient.id)}
                    className="inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
                  >
                    Edit details
                  </button>
                }
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-full border border-slate-200 bg-white text-sm font-semibold disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-2 rounded-full border text-sm font-semibold ${
                      isActive ? "bg-brand-100 border-brand-300 text-brand-700" : "bg-white border-slate-200 text-stone"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-full border border-slate-200 bg-white text-sm font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      {loading && patients.length > 0 && (
        <div className="text-center text-sm text-stone">Refreshing verified list…</div>
      )}
      <ConfirmDialog
        open={Boolean(pendingEditId)}
        title="Edit verified case"
        message="Open this verified case for editing?"
        detail="You can adjust sliders and notes, then resubmit to update verification."
        confirmLabel="Open case"
        onCancel={() => setPendingEditId(null)}
        onConfirm={() => {
          if (pendingEditId) navigate(`/patients/${pendingEditId}`);
          setPendingEditId(null);
        }}
      />
    </div>
  );
}
