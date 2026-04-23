import { useEffect, useMemo, useState } from "react";
import { useCaseStore } from "../store/cases";
import { useAuthStore } from "../store/auth";
import { Doctor } from "../types";
import { Icon } from "../components/Icon";

type DoctorFilters = {
  search: string;
  sort: "name" | "verified" | "pending";
};

const defaultFilters: DoctorFilters = {
  search: "",
  sort: "name"
};

export default function DoctorsPage() {
  const { doctors, cases, loadCases } = useCaseStore();
  const token = useAuthStore((s) => s.token);
  const [filters, setFilters] = useState<DoctorFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    if (token) {
      loadCases(token);
    }
  }, [token, loadCases]);

  const derived = useMemo(() => {
    return doctors.map((doc) => {
      const assigned = cases.filter((c) => {
        if (!c.doctor) return false;
        const assignedTo = c.doctor.trim();
        return assignedTo === doc.email || assignedTo === doc.name;
      });
      const verifiedFromCases = assigned.filter((c) => c.verified).length;
      const pending = assigned.filter((c) => !c.verified).length;
      return {
        ...doc,
        verifiedCount: verifiedFromCases > 0 ? verifiedFromCases : doc.verifiedCount ?? 0,
        assignedCount: assigned.length,
        pendingCount: pending
      };
    });
  }, [cases, doctors]);

  const filtered = useMemo(() => {
    return derived.filter((doc) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!`${doc.name} ${doc.email}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [derived, filters]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (filters.sort === "verified") return b.verifiedCount - a.verifiedCount;
      if (filters.sort === "pending") return b.pendingCount - a.pendingCount;
      return a.name.localeCompare(b.name);
    });
  }, [filtered, filters.sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedDoctors = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const totalVerified = cases.filter((c) => c.verified).length;
  const pendingTotal = cases.filter((c) => !c.verified).length;
  const pendingDotClass =
    pendingTotal === 0 ? "" : pendingTotal > 1 ? "status-dot warning blink" : "status-dot warning";

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <span className="badge neutral">Manage doctors</span>
          <span className="muted">Stats: verified patients, recency, pending queue</span>
          <button className="chip gray" onClick={() => setShowFilters((v) => !v)}>
            <Icon name="filter" size={16} />
            {showFilters ? "Hide filters" : "Filters"}
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card kpi compact">
          <div className="muted" style={{ fontSize: 13 }}>
            Doctors onboarded
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="status-dot" />
            <div style={{ fontSize: 32, fontWeight: 700 }}>{doctors.length}</div>
            <span className="chip gray">active</span>
          </div>
        </div>
        <div className="card kpi compact">
          <div className="muted" style={{ fontSize: 13 }}>
            Verified cases
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{totalVerified}</div>
          </div>
        </div>
        <div className="card kpi compact">
          <div className="muted" style={{ fontSize: 13 }}>
            Pending cases for review
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {pendingDotClass ? <div className={pendingDotClass} /> : null}
            <div style={{ fontSize: 32, fontWeight: 700 }}>{pendingTotal}</div>
            <span className="chip warning">needs review</span>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="card compact">
          <div className="page-header">
            <div className="page-title">
              <span className="badge neutral">Filters</span>
              <span className="muted">Search and sort queues</span>
            </div>
            <div className="dual-buttons">
              <button className="button ghost" onClick={() => setFilters(defaultFilters)}>
                Reset
              </button>
            </div>
          </div>
          <div className="form-grid compact-grid">
            <div className="stack">
              <label className="label">Search</label>
              <input
                className="input dense"
                placeholder="Doctor name or email"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="stack">
              <label className="label">Sort</label>
              <select
                className="dense"
                value={filters.sort}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value as DoctorFilters["sort"] })}
              >
                <option value="name">Name A-Z</option>
                <option value="verified">Most verified</option>
                <option value="pending">Largest pending queue</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="stacked-list">
        {pagedDoctors.map((doc: Doctor & { assignedCount: number; pendingCount: number }) => (
          <article key={doc.id} className="card stack compact-card" style={{ gap: 10 }}>
            <div className="page-header">
              <div className="page-title" style={{ gap: 8 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: "rgba(15,157,88,0.12)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                    color: "var(--accent-strong)"
                  }}
                  aria-hidden
                >
                  {doc.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{doc.name}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {doc.email}
                  </div>
                </div>
              </div>
              <div className="chip">Verified {doc.verifiedCount}</div>
            </div>
            <div className="tag-row">
              <span className="badge neutral">Last login {doc.lastLogin}</span>
              <span className="badge">Assisted cases {doc.assignedCount}</span>
              <span className="badge warning">Pending {doc.pendingCount}</span>
            </div>
          </article>
        ))}
        {sorted.length === 0 && <div className="empty-state">No doctors match filters yet.</div>}
      </div>
      {sorted.length > pageSize && (
        <div className="pagination">
          <button className="button ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
            Prev
          </button>
          <div className="muted">
            Page {currentPage} of {totalPages}
          </div>
          <button
            className="button ghost"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
