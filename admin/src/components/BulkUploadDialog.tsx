import { useEffect, useMemo, useRef, useState } from "react";
import { AdminCase } from "../types";
import { Icon } from "./Icon";
import { ConfirmDialog } from "./ConfirmDialog";

type Props = {
  open: boolean;
  onClose: () => void;
  onImport: (rows: Omit<AdminCase, "id">[]) => void;
};

const sampleRows: Omit<AdminCase, "id">[] = [
  {
    patientName: "Excel Row - Manvi",
    email: "manvi@clinic.in",
    age: 33,
    condition: "Contact dermatitis - wrist",
    registeredDate: "2025-02-12",
    verified: false,
    doctor: "Dr. Leena Bose",
    priority: "medium"
  },
  {
    patientName: "Excel Row - Ryan",
    email: "ryan@clinic.in",
    age: 45,
    condition: "Psoriasis - elbow",
    registeredDate: "2025-02-10",
    verified: true,
    doctor: "Dr. Kavita Rao",
    priority: "high"
  },
  {
    patientName: "Excel Row - Siya",
    email: "siya@clinic.in",
    age: 27,
    condition: "Acne flare - chin",
    registeredDate: "2025-02-08",
    verified: false,
    doctor: "Dr. Ishan Mehta",
    priority: "low"
  }
];

export function BulkUploadDialog({ open, onClose, onImport }: Props) {
  const [fileName, setFileName] = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);
  const [rows, setRows] = useState<Omit<AdminCase, "id">[]>([]);
  const [filter, setFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [imageMap, setImageMap] = useState<Record<number, string[]>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<"list" | "grid" | "single">("grid");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    message: string;
    detail?: string;
    confirmLabel?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setFileName("");
      setConfirmed(false);
      setRows([]);
      setFilter("");
      setSelectedIndex(null);
      setImageMap({});
      setPreviewOpen(false);
    }
  }, [open]);

  const makePlaceholder = (title: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#def7e4"/><stop offset="100%" stop-color="#35c96b"/></linearGradient></defs><rect width="320" height="220" fill="#f6fbf7"/><rect width="320" height="220" fill="url(#g)" opacity="0.45"/><circle cx="60" cy="60" r="30" fill="#35c96b" opacity="0.25"/><circle cx="270" cy="180" r="40" fill="#35c96b" opacity="0.25"/><text x="50%" y="55%" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="#0d1b2a" opacity="0.85">${title}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const handleFile = (file?: File | null) => {
    if (!file) return;
    setFileName(file.name);
    setConfirmed(false);
    setRows([]);
  };

  const confirmFetch = () => {
    setConfirmed(true);
    // In a real flow you'd parse the XLSX; here we mirror UI only.
    setRows(sampleRows);
    setSelectedIndex(0);
  };

  const allowImport = confirmed && rows.length > 0;

  const filteredRows = useMemo(() => {
    if (!filter.trim()) return rows;
    const q = filter.toLowerCase();
    return rows.filter((r) => `${r.patientName} ${r.email}`.toLowerCase().includes(q));
  }, [filter, rows]);

  const selectedRow =
    selectedIndex !== null && selectedIndex >= 0 && selectedIndex < rows.length ? rows[selectedIndex] : null;

  const addImagesForRow = (idx: number, files: FileList | null) => {
    if (!files) return;
    const current = imageMap[idx] ?? [];
    const allowed = Math.max(0, 8 - current.length);
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
      .then((values) => {
        setImageMap((prev) => ({ ...prev, [idx]: [...current, ...values].slice(0, 8) }));
      })
      .catch((err) => console.error("Image read failed", err));
  };

  const removeImage = (idx: number, imageIdx: number) => {
    setImageMap((prev) => {
      const current = prev[idx] ?? [];
      const updated = current.filter((_, i) => i !== imageIdx);
      return { ...prev, [idx]: updated };
    });
  };

  const previewLabel = useMemo(() => {
    if (!fileName) return "No file selected";
    return `${fileName} • ${rows.length || 3} rows ready`;
  }, [fileName, rows.length]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="page-header">
          <div className="page-title">
            <span className="badge">Upload Excel</span>
            <span className="muted">Multi-case ingestion preview</span>
          </div>
          <button className="button danger ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="stack">
          <label className="label">Upload .xlsx</label>
          <input
            className="input"
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="alert">
            <Icon name="upload" size={18} />
            <div>
              <div style={{ fontWeight: 700 }}>Fetch data from excel sheet?</div>
              <div className="muted" style={{ fontSize: 13 }}>
                We&apos;ll surface a preview before committing cases. Confirmation keeps admin in control.
              </div>
              <div className="dual-buttons" style={{ marginTop: 10 }}>
                <button
                  className="button"
                  onClick={() => {
                    if (!fileName) return;
                    setPendingConfirm({
                      message: "Fetch and preview rows from this file?",
                      detail: "We will read your Excel to show a preview before import.",
                      confirmLabel: "Fetch rows",
                      onConfirm: confirmFetch
                    });
                  }}
                  disabled={!fileName}
                >
                  Confirm fetch
                </button>
                <button className="button danger ghost" onClick={() => setRows([])}>
                  Reset preview
                </button>
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                {previewLabel}
              </div>
            </div>
          </div>

          {allowImport && (
            <div className="card">
              <div className="page-header">
                <div className="page-title">
                  <span className="badge">Preview</span>
                  <span className="muted">Review rows before adding</span>
                </div>
                <div className="dual-buttons">
                  <input
                    className="input"
                    placeholder="Filter by name or email"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <button
                    className="button primary"
                    onClick={() => {
                      setPendingConfirm({
                        message: `Add ${rows.length} cases from this upload?`,
                        detail: "These rows will be created as cases immediately.",
                        confirmLabel: "Add cases",
                        onConfirm: () =>
                          onImport(
                            rows.map((row, idx) => ({
                              ...row,
                              images: imageMap[idx] ?? []
                            }))
                          )
                      });
                    }}
                  >
                    <Icon name="check" size={18} />
                    Add {rows.length} cases
                  </button>
                </div>
              </div>
              <div className="modal" style={{ padding: 0, boxShadow: "none", border: "none" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Email</th>
                      <th>Age</th>
                      <th>Condition</th>
                      <th>Date</th>
                      <th>Verified</th>
                      <th>Doctor</th>
                      <th>Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, idx) => {
                      const originalIndex = rows.indexOf(row);
                      return (
                        <tr
                          key={idx}
                          style={{ cursor: "pointer", background: selectedIndex === originalIndex ? "rgba(15,157,88,0.06)" : undefined }}
                          onClick={() => setSelectedIndex(originalIndex)}
                        >
                          <td>{row.patientName}</td>
                          <td className="muted">{row.email}</td>
                          <td>{row.age}</td>
                          <td>{row.condition}</td>
                          <td>{row.registeredDate}</td>
                          <td>{row.verified ? "Yes" : "No"}</td>
                          <td>{row.doctor}</td>
                          <td>
                            <button
                              className="button compact"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIndex(originalIndex);
                                setPreviewOpen(true);
                              }}
                            >
                              <Icon name="image" size={14} />
                              Preview
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {previewOpen && selectedRow && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: "min(960px, 100%)" }}>
            <div className="page-header">
              <div className="page-title">
                <span className="badge">Preview card</span>
                <span className="muted">
                  {selectedRow.patientName} • {selectedRow.email}
                </span>
              </div>
              <button className="button ghost" onClick={() => setPreviewOpen(false)}>
                Close
              </button>
            </div>
            <div className="dual-buttons" style={{ justifyContent: "flex-start" }}>
              <button className={`button ${previewTab === "list" ? "primary" : ""}`} onClick={() => setPreviewTab("list")}>
                <Icon name="list" size={16} />
                List
              </button>
              <button className={`button ${previewTab === "grid" ? "primary" : ""}`} onClick={() => setPreviewTab("grid")}>
                <Icon name="grid" size={16} />
                Grid
              </button>
              <button className={`button ${previewTab === "single" ? "primary" : ""}`} onClick={() => setPreviewTab("single")}>
                <Icon name="image" size={16} />
                Single
              </button>
              <button
                className="button"
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
              >
                <Icon name="plus" size={16} />
                Add images
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => addImagesForRow(selectedIndex ?? 0, e.target.files)}
              />
            </div>

            {previewTab === "list" && (
              <div className="stack" style={{ maxHeight: 420, overflow: "auto" }}>
                {(imageMap[selectedIndex ?? 0] ?? [makePlaceholder(selectedRow.patientName)]).map((src, idx) => (
                  <div key={idx} className="image-preview-row">
                    <img src={src} alt={`Preview ${idx + 1}`} />
                    <div className="stack" style={{ gap: 4 }}>
                      <div className="muted">{selectedRow.patientName}</div>
                      <button
                        className="button ghost compact"
                        type="button"
                        onClick={() => removeImage(selectedIndex ?? 0, idx)}
                      >
                        <Icon name="minus" size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {previewTab === "grid" && (
              <div className="image-grid">
                {(imageMap[selectedIndex ?? 0] ?? [makePlaceholder(selectedRow.patientName)]).map((src, idx) => (
                  <div key={idx} className="image-card">
                    <img src={src} alt={`Preview ${idx + 1}`} />
                    <button
                      className="button ghost compact"
                      type="button"
                      onClick={() => removeImage(selectedIndex ?? 0, idx)}
                    >
                      <Icon name="minus" size={14} />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {previewTab === "single" && (
              <div className="image-single">
                <img src={(imageMap[selectedIndex ?? 0] ?? [makePlaceholder(selectedRow.patientName)])[0]} alt="Preview" />
                <div className="muted">
                  {selectedRow.patientName} • {selectedRow.condition}
                </div>
              </div>
            )}
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
        onConfirm={() => {
          pendingConfirm?.onConfirm();
          setPendingConfirm(null);
        }}
      />
    </div>
  );
}
