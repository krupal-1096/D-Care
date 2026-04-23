import { useEffect, useMemo, useState } from "react";
import { CaseFilters, CaseFiltersState } from "../components/CaseFilters";
import { CaseForm } from "../components/CaseForm";
import { BulkUploadDialog } from "../components/BulkUploadDialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useCaseStore } from "../store/cases";
import { useUiStore } from "../store/ui";
import { AdminCase } from "../types";
import { Icon } from "../components/Icon";
import { useAuthStore } from "../store/auth";

const defaultFilters: CaseFiltersState = {
  query: "",
  startDate: "",
  endDate: "",
  minAge: "",
  maxAge: "",
  verified: "all",
  sort: "newest"
};

const dateValue = (value: string) => new Date(value).getTime();

export default function CasesPage() {
  const { cases, addCase, addBulkCases, doctors, loadCases, updateCase, deleteCase, loading, error } = useCaseStore();
  const token = useAuthStore((s) => s.token);
  const pushToast = useUiStore((s) => s.pushToast);
  const [filters, setFilters] = useState<CaseFiltersState>(defaultFilters);
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [editingCase, setEditingCase] = useState<AdminCase | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 4;
  const [pendingConfirm, setPendingConfirm] = useState<{
    message: string;
    detail?: string;
    confirmLabel?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingEdit, setDeletingEdit] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin-case-filters");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CaseFiltersState;
        setFilters({ ...defaultFilters, ...parsed });
      } catch {
        sessionStorage.removeItem("admin-case-filters");
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("admin-case-filters", JSON.stringify(filters));
  }, [filters]);

  const filteredCases = useMemo(() => {
    return cases
      .filter((c) => {
        if (filters.query) {
          const q = filters.query.toLowerCase();
          if (!`${c.patientName} ${c.condition}`.toLowerCase().includes(q)) return false;
        }
        if (filters.startDate && dateValue(c.registeredDate) < dateValue(filters.startDate)) return false;
        if (filters.endDate && dateValue(c.registeredDate) > dateValue(filters.endDate) + 1000 * 60 * 60 * 24)
          return false;
        const minAge = filters.minAge ? Number(filters.minAge) : undefined;
        const maxAge = filters.maxAge ? Number(filters.maxAge) : undefined;
        if (minAge && c.age < minAge) return false;
        if (maxAge && c.age > maxAge) return false;
        if (filters.verified === "verified" && !c.verified) return false;
        if (filters.verified === "pending" && c.verified) return false;
        return true;
      })
      .sort((a, b) =>
        filters.sort === "newest"
          ? dateValue(b.registeredDate) - dateValue(a.registeredDate)
          : dateValue(a.registeredDate) - dateValue(b.registeredDate)
      );
  }, [cases, filters]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    if (token) loadCases(token);
  }, [token, loadCases]);

  const handleCaseSubmit = async (data: Omit<AdminCase, "id">) => {
    setPendingConfirm({
      message: "Save this new case?",
      detail: "A patient record will be created and visible to admins.",
      confirmLabel: "Save case",
      onConfirm: async () => {
        setSavingNew(true);
        await addCase(token ?? "", data);
        setSavingNew(false);
        setShowCaseForm(false);
        pushToast("Case saved", "success");
      }
    });
  };

  useEffect(() => {
    if (!token && cases.length === 0) {
      loadCases("");
    }
  }, [token, cases.length, loadCases]);

  const openEdit = (item: AdminCase) => {
    setEditingCase({ ...item, images: item.images ?? [] });
  };

  const verifiedCount = cases.filter((c) => c.verified).length;
  const pendingCount = cases.length - verifiedCount;
  const pendingDotClass =
    pendingCount === 0 ? "" : pendingCount > 1 ? "status-dot warning blink" : "status-dot warning";
  const totalPages = Math.max(1, Math.ceil(filteredCases.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedCases = filteredCases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const activeFilters = useMemo(() => {
    const chips: string[] = [];
    if (filters.query) chips.push(`Query: ${filters.query}`);
    if (filters.startDate || filters.endDate) {
      const from = filters.startDate || "start";
      const to = filters.endDate || "now";
      chips.push(`Registered ${from} → ${to}`);
    }
    if (filters.minAge || filters.maxAge) {
      chips.push(`Age ${filters.minAge || "0"}–${filters.maxAge || "∞"}`);
    }
    if (filters.verified !== "all") {
      chips.push(filters.verified === "verified" ? "Verified only" : "Pending only");
    }
    if (filters.sort !== "newest") chips.push("Oldest first");
    return chips;
  }, [filters]);

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <span className="badge neutral">Manage cases</span>
          <span className="muted">By default all cases are visible.</span>
          <button className="chip gray" onClick={() => setShowFilters((v) => !v)}>
            <Icon name="filter" size={16} />
            {showFilters ? "Hide filters" : "Filters"}
          </button>
        </div>
        <div className="dual-buttons">
          <button className="button" type="button" onClick={() => setShowUpload(true)}>
            <Icon name="upload" size={18} />
            Upload multiple cases
          </button>
          <button
            className="button primary"
            type="button"
            onClick={() => {
              setEditingCase(null);
              setShowCaseForm(true);
            }}
          >
            <Icon name="plus" size={18} />
            Add case
          </button>
        </div>
      </div>

      {error && (
        <div className="card warning" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>Could not load latest cases. Showing cached data.</div>
          <button className="button ghost" onClick={() => token && loadCases(token)}>
            Retry
          </button>
        </div>
      )}

      <div className="kpi-grid">
        <div className="card kpi compact">
          <div className="muted" style={{ fontSize: 13 }}>
            Current cases
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="status-dot" />
            <div style={{ fontSize: 32, fontWeight: 700 }}>{cases.length}</div>
            <span className="chip">live</span>
          </div>
        </div>
        <div className="card kpi compact">
          <div className="muted" style={{ fontSize: 13 }}>
            Verified case
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{verifiedCount}</div>
            <span className="chip">Verified</span>
          </div>
        </div>
        <div className="card kpi compact">
          <div className="muted" style={{ fontSize: 13 }}>
            Pending cases
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {pendingDotClass ? <div className={pendingDotClass} /> : null}
            <div style={{ fontSize: 32, fontWeight: 700 }}>{pendingCount}</div>
            <span className="chip warning">needs review</span>
          </div>
        </div>
      </div>

      {showFilters && (
        <CaseFilters filters={filters} onChange={setFilters} onReset={() => setFilters(defaultFilters)} />
      )}

      {activeFilters.length > 0 && (
        <div className="tag-row" style={{ gap: 10 }}>
          {activeFilters.map((chip) => (
            <span key={chip} className="badge neutral">
              {chip}
            </span>
          ))}
          <button className="chip gray" onClick={() => setFilters(defaultFilters)}>
            Clear filters
          </button>
        </div>
      )}

      <div className="stacked-list">
        {loading && cases.length === 0 &&
          Array.from({ length: 4 }).map((_, idx) => (
            <article key={idx} className="card stack compact-card skeleton-card">
              <div className="skeleton-line w-40" />
              <div className="skeleton-line w-60" />
              <div className="skeleton-line w-32" />
              <div className="skeleton-block" />
            </article>
          ))}
        {!loading &&
        pagedCases.map((c) => (
          <article key={c.id} className="card stack compact-card" onClick={() => openEdit(c)} style={{ cursor: "pointer" }}>
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
                  {c.patientName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{c.patientName}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {c.email}
                  </div>
                </div>
              </div>
              <div className="stack" style={{ alignItems: "flex-end", gap: 6 }}>
                {c.verified ? (
                  <div className="muted" style={{ fontSize: 13 }}>
                    Verified by {c.doctor ?? "Any doctor"}
                  </div>
                ) : (
                  <div className="muted" style={{ fontSize: 13 }}>
                    To be verified by {c.doctor ?? "Any doctor"}
                  </div>
                )}
                <div className="muted" style={{ fontSize: 12 }}>
                  Skin conditions: {c.condition ? c.condition.split(",").filter((v) => v.trim()).length : 0}
                </div>
              </div>
            </div>
            <div className="muted" style={{ fontSize: 14 }}>
              {c.condition || "No condition provided"}
            </div>
            <div className="page-header" style={{ gap: 10 }}>
              <div className="tag-row">
                <span
                  className={`badge ${
                    (c.priority ?? "medium") === "high"
                      ? "danger"
                      : (c.priority ?? "medium") === "medium"
                      ? "warning"
                      : "success"
                  }`}
                >
                  {c.priority ?? "medium"}
                </span>
                <span className="badge neutral">
                  Registered: {c.registeredDate} • Age {c.age}
                </span>
                <span className="badge neutral">Images uploaded {c.images?.length ?? 0}</span>
              </div>
              <div>
                {c.verified ? (
                  <span className="chip">Verified on {c.registeredDate}</span>
                ) : (
                  <span className="chip warning">Unverified</span>
                )}
              </div>
            </div>
            {c.images && c.images.length > 0 && (
              <div className="thumb-row">
                {c.images.slice(0, 3).map((img, idx) => (
                  <img key={idx} src={img} loading="lazy" alt="thumb" className="thumb" />
                ))}
                {c.images.length > 3 && <span className="badge neutral">+{c.images.length - 3} more</span>}
              </div>
            )}
          </article>
        ))}
        {!loading && filteredCases.length === 0 && <div className="empty-state">No cases match filters yet.</div>}
      </div>
      {filteredCases.length > pageSize && (
        <div className="pagination">
          <button
            className="button ghost"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
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

      <BulkUploadDialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onImport={(rows) => {
          if (token) addBulkCases(token, rows);
          setShowUpload(false);
          pushToast(`Imported ${rows.length} rows`, "success");
        }}
      />
      {showCaseForm && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: "min(960px, 100%)", maxHeight: "90vh", overflow: "auto", paddingTop: 28 }}>
            <div className="page-header">
              <div className="page-title">
                <span className="badge">Add patient case</span>
                <span className="muted">Single case entry</span>
              </div>
            </div>
            <CaseForm
              doctorOptions={doctors.map((d) => d.name)}
              onSubmit={handleCaseSubmit}
              onCancel={() => setShowCaseForm(false)}
              submitting={savingNew}
            />
          </div>
        </div>
      )}
      {editingCase && (
        <div className="modal-backdrop">
          <div className="modal slide-over" style={{ width: "min(920px, 100%)", marginLeft: "auto" }}>
            <div className="page-header">
              <div className="page-title">
                <span className="badge">Edit patient</span>
                <span className="muted">
                  {editingCase.patientName} • {editingCase.email}
                </span>
              </div>
            </div>

            <EditCaseForm
              initial={editingCase}
              onClose={() => setEditingCase(null)}
              onSave={(updated) => {
                setPendingConfirm({
                  message: "Save changes to this case?",
                  detail: "Updates will sync to the patient record.",
                  confirmLabel: "Save changes",
                  onConfirm: async () => {
                    setSavingEdit(true);
                    await updateCase(token ?? null, updated);
                    setSavingEdit(false);
                    setEditingCase(null);
                    pushToast("Case updated", "success");
                  }
                });
              }}
              onDelete={(id) => {
                setPendingConfirm({
                  message: "Delete this case and patient record?",
                  detail: "This action removes the case and its mirrored patient entry.",
                  confirmLabel: "Delete case",
                  onConfirm: async () => {
                    setDeletingEdit(true);
                    await deleteCase(token ?? null, id);
                    setDeletingEdit(false);
                    setEditingCase(null);
                    pushToast("Case removed", "info");
                  }
                });
              }}
              saving={savingEdit}
              deleting={deletingEdit}
            />
          </div>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(pendingConfirm)}
        title="Confirm action"
        message={pendingConfirm?.message ?? ""}
        detail={pendingConfirm?.detail}
        confirmLabel={pendingConfirm?.confirmLabel}
        onCancel={() => setPendingConfirm(null)}
        loading={confirmBusy}
        loadingLabel="Working..."
        onConfirm={async () => {
          if (!pendingConfirm) return;
          setConfirmBusy(true);
          try {
            await pendingConfirm.onConfirm();
          } finally {
            setConfirmBusy(false);
            setPendingConfirm(null);
          }
        }}
      />
    </>
  );
}

type EditCaseFormProps = {
  initial: AdminCase;
  onSave: (data: AdminCase) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  saving?: boolean;
  deleting?: boolean;
};

function EditCaseForm({ initial, onSave, onDelete, onClose, saving = false, deleting = false }: EditCaseFormProps) {
  const [form, setForm] = useState<AdminCase>({ ...initial, images: initial.images ?? [] });
  const [previewTab, setPreviewTab] = useState<"list" | "grid" | "single">("grid");

  const update = (patch: Partial<AdminCase>) => setForm((prev) => ({ ...prev, ...patch }));

  const readFiles = (files: FileList | null) => {
    if (!files) return;
    const allowed = Math.max(0, 8 - (form.images?.length ?? 0));
    const slice = Array.from(files).slice(0, allowed);
    Promise.all(
      slice.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          })
      )
    )
      .then((values) => update({ images: [...(form.images ?? []), ...values].slice(0, 8) }))
      .catch((err) => console.error(err));
  };

  const removeImage = (idx: number) => {
    update({ images: (form.images ?? []).filter((_, i) => i !== idx) });
  };

  return (
    <div className="stack">
      <div className="form-grid">
        <div className="stack">
          <label className="label">Patient name</label>
          <input className="input" value={form.patientName} onChange={(e) => update({ patientName: e.target.value })} />
        </div>
        <div className="stack">
          <label className="label">Email</label>
          <input className="input" value={form.email} onChange={(e) => update({ email: e.target.value })} />
        </div>
        <div className="stack">
          <label className="label">Age</label>
          <input
            className="input"
            type="number"
            value={form.age}
            onChange={(e) => update({ age: Number(e.target.value) })}
          />
        </div>
        <div className="stack">
          <label className="label">Condition</label>
          <input className="input" value={form.condition} onChange={(e) => update({ condition: e.target.value })} />
        </div>
      </div>

      <div className="dual-buttons" style={{ justifyContent: "flex-start" }}>
        <button
          className={`button ${previewTab === "list" ? "primary" : ""}`}
          type="button"
          onClick={() => setPreviewTab("list")}
        >
          <Icon name="list" size={16} />
          List
        </button>
        <button
          className={`button ${previewTab === "grid" ? "primary" : ""}`}
          type="button"
          onClick={() => setPreviewTab("grid")}
        >
          <Icon name="grid" size={16} />
          Grid
        </button>
        <button
          className={`button ${previewTab === "single" ? "primary" : ""}`}
          type="button"
          onClick={() => setPreviewTab("single")}
        >
          <Icon name="image" size={16} />
          Single
        </button>
        <label className="button" style={{ cursor: "pointer" }}>
          <Icon name="plus" size={16} />
          Add images
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => readFiles(e.target.files)}
          />
        </label>
        <button className="button ghost" type="button" onClick={() => update({ images: [] })}>
          <Icon name="minus" size={16} />
          Clear
        </button>
      </div>

      {previewTab === "list" && (
        <div className="stack" style={{ maxHeight: 320, overflow: "auto" }}>
          {(form.images ?? []).map((src, idx) => (
            <div key={idx} className="image-preview-row">
              <img src={src} alt={`Case ${idx + 1}`} loading="lazy" className="thumb" style={{ width: 72, height: 72 }} />
              <div className="dual-buttons">
                <button className="button ghost compact" type="button" onClick={() => removeImage(idx)}>
                  <Icon name="minus" size={14} />
                  Remove
                </button>
              </div>
            </div>
          ))}
          {(form.images ?? []).length === 0 && <div className="muted">No images attached.</div>}
        </div>
      )}

      {previewTab === "grid" && (
        <div className="image-grid">
          {(form.images ?? []).map((src, idx) => (
            <div key={idx} className="image-card">
              <img src={src} alt={`Case ${idx + 1}`} loading="lazy" />
              <button className="button ghost compact" type="button" onClick={() => removeImage(idx)}>
                <Icon name="minus" size={14} />
                Remove
              </button>
            </div>
          ))}
          {(form.images ?? []).length === 0 && <div className="muted">No images attached.</div>}
        </div>
      )}

      {previewTab === "single" && (
        <div className="image-single">
          {form.images?.[0] ? (
            <img src={form.images[0]} alt="Case" loading="lazy" />
          ) : (
            <div className="muted">Add an image to preview</div>
          )}
          <div className="muted">Showing first image</div>
        </div>
      )}

      <div className="dual-buttons" style={{ justifyContent: "space-between" }}>
        <button className="button danger ghost" type="button" onClick={() => onDelete(form.id)}>
          {deleting ? "Deleting..." : "Delete case"}
        </button>
        <div className="dual-buttons" style={{ justifyContent: "flex-end" }}>
          <button className="button danger ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" type="button" onClick={() => onSave(form)} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
