import { ReactNode } from "react";
import { Patient } from "../types";
import { formatCaseDate } from "../utils/dates";

type PatientCardProps = {
  patient: Patient;
  onClick?: () => void;
  showDoctorNote?: boolean;
  action?: ReactNode;
  className?: string;
};

export default function PatientCard({
  patient,
  onClick,
  showDoctorNote,
  action,
  className,
}: PatientCardProps) {
  return (
    <div className={`relative ${className ?? ""}`}>
      {action && <div className="absolute right-3 bottom-3 z-10">{action}</div>}
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left glass-panel rounded-2xl overflow-hidden hover:-translate-y-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 relative ${
          action ? "pb-16" : ""
        }`}
      >
        <span
          className={`tag absolute right-4 top-4 pointer-events-none ${
            patient.verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {patient.verified
            ? `Verified ${formatCaseDate(patient.verifiedDate)}`
            : "Pending review"}
        </span>
        <div className="p-4 grid grid-cols-[auto,1fr] items-center gap-3">
          <img
            src={patient.photo}
            alt={patient.name}
            className="h-12 w-12 rounded-full object-cover border border-slate-200"
            loading="lazy"
          />
          <div className="min-w-0">
            <h3 className="font-semibold text-lg text-ink truncate">{patient.name}</h3>
            <p className="text-sm text-stone truncate">{patient.email}</p>
            <p className="text-xs text-stone truncate">
              Age {patient.age} • Registered {formatCaseDate(patient.registeredDate)}
            </p>
            <p className="text-xs text-stone truncate">
              {patient.verified
                ? `Verified by ${patient.verifiedBy || patient.doctor || "Any doctor"}`
                : `To be verified by ${patient.doctor || "Any doctor"}`}
            </p>
          </div>
        </div>
        {showDoctorNote && (
          <div className="px-4 pb-4">
            <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 px-3 py-2 text-sm text-ink">
              <p className="text-xs font-semibold text-amber-700 mb-1">Doctor note</p>
              <p className="leading-snug">
                {patient.doctorNote && patient.doctorNote.trim()
                  ? patient.doctorNote
                  : "No additional note by doctor."}
              </p>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
