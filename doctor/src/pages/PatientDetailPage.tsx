import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DiseaseSlider from "../components/DiseaseSlider";
import { useAuthStore } from "../stores/auth";
import { usePatientStore } from "../stores/patients";
import { Disease } from "../types";
import { formatCaseDate } from "../utils/dates";
import { ConfirmDialog } from "../components/ConfirmDialog";

const severityTone = (value: number) => {
  if (value > 70) {
    return { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", label: "Severe" };
  }
  if (value > 40) {
    return {
      bg: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-200",
      label: "Moderate"
    };
  }
  return {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "Safe"
  };
};

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const patients = usePatientStore((state) => state.patients);
  const loadPatients = usePatientStore((state) => state.loadPatients);
  const verifyPatient = usePatientStore((state) => state.verifyPatient);
  const loading = usePatientStore((state) => state.loading);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (token) loadPatients(token);
  }, [loadPatients, token]);

  const patient = useMemo(
    () => patients.find((candidate) => candidate.id === id),
    [patients, id]
  );

  const [status, setStatus] = useState("");
  const [galleryView, setGalleryView] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [allowEditing, setAllowEditing] = useState(!patient?.verified);
  const [diseaseValues, setDiseaseValues] = useState<Disease[]>(patient?.diseases || []);
  const [doctorNote, setDoctorNote] = useState(patient?.doctorNote || "");

  useEffect(() => {
    if (patient) {
      setDiseaseValues(patient.diseases.map((disease) => ({ ...disease })));
      setAllowEditing(!patient.verified);
      setDoctorNote(patient.doctorNote || "");
    }
  }, [patient]);

  useEffect(() => {
    if (galleryView === "grid") {
      setCurrentPage(1);
    }
  }, [galleryView, patient?.id]);

  if (!patient) {
    return (
      <div className="space-y-4">
        <p className="text-lg font-semibold text-ink">Patient not found.</p>
        <Link to="/" className="text-brand-600 underline">
          Go back
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="glass-panel rounded-3xl p-6 animate-pulse space-y-4">
          <div className="h-12 bg-slate-200/60 rounded-xl" />
          <div className="h-24 bg-slate-200/60 rounded-xl" />
          <div className="h-32 bg-slate-200/60 rounded-xl" />
        </div>
      </div>
    );
  }

  const diseaseImages =
    patient.diseaseImages && patient.diseaseImages.length > 0
      ? patient.diseaseImages
      : patient.diseaseImage
        ? [patient.diseaseImage]
        : [];
  const diseaseGallery = diseaseImages.map((image, index) => ({
    image,
    label: patient.diseaseImageLabels?.[index] || `Skin sample ${index + 1}`,
    globalIndex: index
  }));

  const handleChange = (diseaseId: string, value: number) => {
    setDiseaseValues((prev) =>
      prev.map((disease) => (disease.id === diseaseId ? { ...disease, severity: value } : disease))
    );
  };

  const gridPageSize = 6;
  const totalPages = Math.max(1, Math.ceil(diseaseGallery.length / gridPageSize));
  const clampedPage = Math.min(currentPage, totalPages);
  const pageStart = (clampedPage - 1) * gridPageSize;
  const pageItems = galleryView === "grid" ? diseaseGallery.slice(pageStart, pageStart + gridPageSize) : diseaseGallery;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setShowVerifyConfirm(true);
  };

  const confirmVerify = () => {
    if (!user) return;
    if (!token) return;
    verifyPatient(token, patient.id, diseaseValues, user.id, doctorNote.trim() || undefined);
    const verifiedOn = formatCaseDate(new Date().toISOString());
    setStatus(`Patient marked as verified on ${verifiedOn}.`);
    setShowVerifyConfirm(false);
    setTimeout(() => navigate("/verified"), 800);
  };

  const handleCancel = () => {
    if (allowEditing) {
      setShowCancelConfirm(true);
    } else {
      navigate(-1);
    }
  };

  const openLightbox = (absoluteIndex: number) => {
    setLightboxIndex(absoluteIndex);
  };

  const closeLightbox = () => setLightboxIndex(null);

  const nextLightbox = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % diseaseGallery.length);
  };

  const prevLightbox = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + diseaseGallery.length) % diseaseGallery.length);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-3xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="grid grid-cols-[auto,1fr] gap-3 items-center">
            <img
              src={patient.photo}
              alt={patient.name}
              className="h-14 w-14 rounded-full object-cover border border-slate-200"
              loading="lazy"
            />
            <div>
              <p className="text-lg font-semibold text-ink">{patient.name}</p>
              <p className="text-sm text-stone">{patient.email}</p>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-stone">
                <span className="tag bg-brand-50 text-brand-700 border border-brand-100">
                  Age {patient.age}
                </span>
                <span className="tag bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Registered {formatCaseDate(patient.registeredDate)}
                </span>
                <span
                  className={`tag ${
                    patient.verified
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-100"
                  }`}
                >
                  {patient.verified
                    ? `Verified ${formatCaseDate(patient.verifiedDate)}`
                    : "Awaiting verification"}
                </span>
              </div>
              <p className="text-sm text-stone mt-2">
                {patient.verified
                  ? `Verified by ${patient.verifiedBy || patient.doctor || "Any doctor"}`
                  : `To be verified by ${patient.doctor || "Any doctor"}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGalleryView("grid")}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                galleryView === "grid"
                  ? "border-brand-400 text-brand-700 bg-brand-50"
                  : "border-slate-200 text-stone"
              }`}
            >
              Grid view
            </button>
            <button
              type="button"
              onClick={() => setGalleryView("list")}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                galleryView === "list"
                  ? "border-brand-400 text-brand-700 bg-brand-50"
                  : "border-slate-200 text-stone"
              }`}
            >
              List view
            </button>
          </div>
        </div>

        {galleryView === "grid" ? (
          <div className="grid gap-1.5 grid-cols-3 sm:grid-cols-4 min-h-[160px]">
            {pageItems.map((item, index) => (
              <div
                key={`${item.image}-${index}`}
                className="relative rounded-lg overflow-hidden border border-slate-200 bg-white aspect-square cursor-pointer"
                onClick={() => openLightbox(item.globalIndex)}
              >
                <img
                  src={item.image}
                  alt={`${patient.name} ${item.label}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-2 min-h-[160px] max-h-64 overflow-y-auto pr-1">
            {pageItems.map((item, index) => (
              <div
                key={`${item.image}-${index}`}
                className="glass-panel rounded-xl p-2 grid grid-cols-[72px,1fr] gap-3 items-center cursor-pointer"
                onClick={() => openLightbox(item.globalIndex)}
              >
                <img
                  src={item.image}
                  alt={`${patient.name} ${item.label}`}
                  className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                  loading="lazy"
                />
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-ink">{item.label}</p>
                  <span className="text-[11px] text-stone">Documented skin sample</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {galleryView === "grid" && diseaseGallery.length > gridPageSize && (
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={clampedPage === 1}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-ink disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:border-brand-300 transition"
            >
              Previous
            </button>
            <span className="text-xs text-stone">
              Page {clampedPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={clampedPage === totalPages}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-ink disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:border-brand-300 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-stone">
              {allowEditing ? "Severity sliders" : "Verified scores"}
            </p>
            <h3 className="text-xl font-semibold text-ink">
              {allowEditing ? "Adjust and submit to verify" : "Review verified readings"}
            </h3>
          </div>
          <span
            className={`tag ${
              patient.verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {patient.verified ? "Verified" : "Pending"}
          </span>
        </div>

        {allowEditing ? (
          <div className="grid gap-3">
            {diseaseValues.map((disease) => (
              <DiseaseSlider
                key={disease.id}
                label={disease.name}
                value={disease.severity}
                notes={disease.notes}
                onChange={(value) => handleChange(disease.id, value)}
                disabled={!allowEditing}
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-2">
            {diseaseValues.map((disease) => {
              const tone = severityTone(disease.severity);
              return (
                <div
                  key={disease.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${tone.bg} ${tone.border}`}
                >
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold text-ink">{disease.name}</p>
                    {disease.notes && <span className="text-xs text-stone">{disease.notes}</span>}
                  </div>
                  <span className={`tag ${tone.bg} ${tone.text} ${tone.border}`}>
                    {tone.label} • {disease.severity}%
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {allowEditing ? (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink">Additional note (optional)</label>
            <textarea
              value={doctorNote}
              onChange={(event) => setDoctorNote(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 min-h-[100px]"
              placeholder="Add a brief note for this case..."
            />
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 px-3 py-2">
            <p className="text-xs font-semibold text-amber-700 mb-1">Doctor note</p>
            <p className="text-sm text-ink">
              {doctorNote && doctorNote.trim() ? doctorNote : "No additional note by doctor."}
            </p>
          </div>
        )}

        {status && <p className="text-sm text-emerald-700">{status}</p>}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {patient.verified && !allowEditing ? (
            <button
              type="button"
              onClick={() => {
                setShowEditConfirm(true);
              }}
              className="bg-brand-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-brand-700 transition"
            >
              Edit details
            </button>
          ) : (
            <button
              type="submit"
              className="bg-brand-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-brand-700 transition"
            >
              Submit &amp; Verify
            </button>
          )}
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-3 rounded-xl font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition"
          >
            Cancel
          </button>
        </div>
      </form>

      {lightboxIndex !== null && diseaseGallery[lightboxIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div
            className="absolute inset-0"
            onClick={closeLightbox}
            aria-label="Close image viewer"
          />
          <div className="relative z-10 max-w-3xl w-full bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200">
              <p className="text-sm font-semibold text-ink">
                {diseaseGallery[lightboxIndex].label}
              </p>
              <button
                type="button"
                onClick={closeLightbox}
                className="text-stone hover:text-ink text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="relative bg-slate-50">
              <img
                src={diseaseGallery[lightboxIndex].image}
                alt={diseaseGallery[lightboxIndex].label}
                className="w-full h-[360px] object-contain bg-white"
              />
              <div className="absolute inset-y-0 left-0 flex items-center">
                <button
                  type="button"
                  onClick={prevLightbox}
                  className="m-2 h-10 w-10 rounded-full bg-white/80 border border-slate-200 shadow hover:bg-white"
                  aria-label="Previous image"
                >
                  ‹
                </button>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center">
                <button
                  type="button"
                  onClick={nextLightbox}
                  className="m-2 h-10 w-10 rounded-full bg-white/80 border border-slate-200 shadow hover:bg-white"
                  aria-label="Next image"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showVerifyConfirm && (
        <ConfirmDialog
          open
          title="Confirm verify"
          message="Submit and verify this patient?"
          detail="This will mark the case as verified and lock current slider values."
          confirmLabel="Yes, verify"
          onCancel={() => setShowVerifyConfirm(false)}
          onConfirm={confirmVerify}
        />
      )}
      <ConfirmDialog
        open={showCancelConfirm}
        title="Cancel editing"
        message="Discard changes and go back?"
        detail="Unsaved severity scores or notes will be lost."
        confirmLabel="Discard changes"
        onCancel={() => setShowCancelConfirm(false)}
        onConfirm={() => {
          setShowCancelConfirm(false);
          navigate(-1);
        }}
      />
      <ConfirmDialog
        open={showEditConfirm}
        title="Edit verified case"
        message="Enable editing for this verified case?"
        detail="You can adjust scores and notes, then resubmit to update verification."
        confirmLabel="Enable editing"
        onCancel={() => setShowEditConfirm(false)}
        onConfirm={() => {
          setAllowEditing(true);
          setStatus("");
          setShowEditConfirm(false);
        }}
      />
    </div>
  );
}
