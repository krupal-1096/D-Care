import { FormEvent, useEffect, useRef, useState } from "react";
import { AdminCase } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";
import { Icon } from "./Icon";

type Props = {
  onSubmit: (data: Omit<AdminCase, "id">) => void;
  onCancel: () => void;
  doctorOptions: string[];
  submitting?: boolean;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const compressImage = (file: File, maxSide = 640, quality = 0.7): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * ratio));
      canvas.height = Math.max(1, Math.round(img.height * ratio));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const toData = (type: string) =>
        new Promise<Blob | null>((res) => canvas.toBlob((blob) => res(blob), type, quality));
      toData("image/webp")
        .then((blob) => blob ?? toData("image/jpeg"))
        .then((blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error("Failed to create image blob"));
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        })
        .catch((err) => {
          URL.revokeObjectURL(url);
          reject(err);
        });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
const diseaseGroups = [
  {
    label: "Common",
    items: ["Acne", "Eczema", "Psoriasis", "Dermatitis", "Rosacea", "Fungal infection", "Melasma"]
  },
  {
    label: "Moderate",
    items: ["Lichen planus", "Vitiligo", "Actinic keratosis", "Seborrheic dermatitis", "Alopecia areata"]
  },
  {
    label: "Severe",
    items: ["Basal cell carcinoma", "Squamous cell carcinoma", "Melanoma", "Stevens-Johnson syndrome", "Cellulitis"]
  }
];

type DiseaseGroupLabel = (typeof diseaseGroups)[number]["label"];

export function CaseForm({ onSubmit, onCancel, doctorOptions, submitting = false }: Props) {
  const [form, setForm] = useState<Omit<AdminCase, "id">>({
    patientName: "",
    email: "",
    age: 0,
    condition: "",
    registeredDate: new Date().toISOString().slice(0, 10),
    verified: false,
    doctor: "Any doctor",
    priority: "medium",
    images: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [diseaseModalOpen, setDiseaseModalOpen] = useState(false);
  const [diseaseSearch, setDiseaseSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<DiseaseGroupLabel>("Common");
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);
  const [draftDiseases, setDraftDiseases] = useState<string[]>([]);
  const [selectionMessage, setSelectionMessage] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imagePreviewTab, setImagePreviewTab] = useState<"list" | "grid" | "single">("grid");
  const [inlineImageTab, setInlineImageTab] = useState<"list" | "grid">("grid");
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [confirmDiseaseSelection, setConfirmDiseaseSelection] = useState(false);
  const [confirmImages, setConfirmImages] = useState(false);
  const [confirmClearImages, setConfirmClearImages] = useState(false);
  const [showInlineImages, setShowInlineImages] = useState(true);
  const [imagesCommitted, setImagesCommitted] = useState(false);
  const addMoreInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const nextErrors: Record<string, string> = {};
    if (!form.patientName.trim()) nextErrors.patientName = "Patient name is required.";
    if (!emailPattern.test(form.email)) nextErrors.email = "Enter a valid email.";
    if (form.age < 1) nextErrors.age = "Age must be positive.";
    if (!form.registeredDate) nextErrors.registeredDate = "Select a registered date.";
    setErrors(nextErrors);
  }, [form, selectedDiseases]);

  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({ ...form, images: imagePreviews });
  };

  const update = (patch: Partial<AdminCase>) => setForm((prev) => ({ ...prev, ...patch }));

  const normalizedSearch = diseaseSearch.toLowerCase();
  const filteredDiseases = diseaseGroups
    .flatMap((group) => group.items.map((item) => ({ group: group.label, value: item })))
    .filter((entry) => entry.group === activeGroup)
    .filter((entry) => entry.value.toLowerCase().includes(normalizedSearch));
  const visibleDiseaseValues = filteredDiseases.map((entry) => entry.value);

  const toggleDisease = (value: string) => {
    setDraftDiseases((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]));
  };

  const resetDraftDiseases = () => setDraftDiseases([]);

  const selectAllVisible = () => {
    setDraftDiseases((prev) => {
      const next = new Set(prev);
      visibleDiseaseValues.forEach((value) => next.add(value));
      return Array.from(next);
    });
  };

  const openDiseaseModal = () => {
    setDraftDiseases(selectedDiseases);
    setDiseaseSearch("");
    setActiveGroup("Common");
    setDiseaseModalOpen(true);
    setSelectionMessage("");
  };

  const handleConfirmDiseases = () => {
    setConfirmDiseaseSelection(true);
  };

  const handleCancelDiseases = () => {
    setDiseaseModalOpen(false);
    setSelectionMessage("Selection canceled. Previous choices retained.");
  };

  const readFiles = (files: FileList | null) => {
    if (!files) return;
    const existing = imagePreviews.length;
    const allowed = Math.max(0, 8 - existing);
    const slice = Array.from(files).slice(0, allowed);
    Promise.all(slice.map((file) => compressImage(file)))
      .then((values) => {
        const next = [...imagePreviews, ...values].slice(0, 8);
        setImagePreviews(next);
        update({ images: next });
        setShowInlineImages(true);
        setImagesCommitted(false);
      })
      .catch(() => setImagesCommitted(false));
  };

  const removeImage = (idx: number) => {
    const next = imagePreviews.filter((_, i) => i !== idx);
    setImagePreviews(next);
    update({ images: next });
  };

  return (
    <div className="card">
      <div className="page-header">
        <div className="page-title" style={{ alignItems: "flex-start" }}>
          <span className="badge">Add case</span>
          <div className="stack" style={{ gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>Single case entry</h2>
            <span className="muted">Focused single-entry capture without bulk validation text.</span>
          </div>
        </div>
      </div>

      <form id="case-form" className="stack" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="stack">
            <label className="label" htmlFor="patientName">
              Patient name
            </label>
            {errors.patientName && <div className="field-error">{errors.patientName}</div>}
            <input
              id="patientName"
              className="input"
              value={form.patientName}
              onChange={(e) => update({ patientName: e.target.value })}
              placeholder="e.g. Aarav Sharma"
              required
            />
          </div>
          <div className="stack">
            <label className="label" htmlFor="email">
              Email
            </label>
            {errors.email && <div className="field-error">{errors.email}</div>}
            <input
              id="email"
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="patient@mail.com"
              required
            />
          </div>
          <div className="stack">
            <label className="label" htmlFor="age">
              Age
            </label>
            {errors.age && <div className="field-error">{errors.age}</div>}
            <input
              id="age"
              className="input"
              type="number"
              value={form.age || ""}
              onChange={(e) => update({ age: Number(e.target.value) })}
              placeholder="32"
              min={1}
              required
            />
          </div>
          <div className="stack">
            <label className="label" htmlFor="condition">
              Condition / case note
            </label>
            {errors.condition && <div className="field-error">{errors.condition}</div>}
            <input
              id="condition"
              className="input"
              value={form.condition}
              readOnly
              onClick={openDiseaseModal}
              placeholder="Tap to choose skin conditions (optional)"
            />
            {selectionMessage && <div className="muted" style={{ color: "var(--accent-strong)" }}>{selectionMessage}</div>}
          </div>
          <div className="stack">
            <label className="label" htmlFor="registeredDate">
              Registered date
            </label>
            {errors.registeredDate && <div className="field-error">{errors.registeredDate}</div>}
            <input
              id="registeredDate"
              className="input"
              type="date"
              value={form.registeredDate}
              onChange={(e) => update({ registeredDate: e.target.value })}
              required
            />
          </div>
          <div className="stack">
            <label className="label" htmlFor="doctor">
              Assign to doctor
            </label>
            <select
              id="doctor"
              value={form.doctor}
              onChange={(e) => update({ doctor: e.target.value })}
              className="input"
            >
              <option>Any doctor</option>
              {doctorOptions.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="stack">
            <label className="label" htmlFor="priority">
              Priority
            </label>
            <select
              id="priority"
              value={form.priority ?? "medium"}
              onChange={(e) => update({ priority: e.target.value as AdminCase["priority"] })}
              className="input"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="stack">
          <label className="label" htmlFor="images">
            Case images (max 8)
          </label>
          <input
            id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => readFiles(e.target.files)}
            />
            <input
              ref={addMoreInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => readFiles(e.target.files)}
            />
            {imagesCommitted && imagePreviews.length > 0 && (
              <div className="muted" style={{ marginTop: 6 }}>
                Images added: {imagePreviews.length}{" "}
                <button
                  type="button"
                  className="button link"
                  style={{ padding: 0, marginLeft: 6 }}
                  onClick={() => {
                    setShowInlineImages(true);
                    setImagesCommitted(false);
                  }}
                >
                  [edit]
                </button>
              </div>
            )}
          </div>
        </div>
        {showInlineImages && imagePreviews.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="page-header">
            <div className="page-title">
              <span className="badge">Images</span>
              <span className="muted">Grid/List preview with remove</span>
            </div>
            <div className="dual-buttons" style={{ justifyContent: "flex-end" }}>
              <button
                type="button"
                className="button"
                onClick={() => {
                  if (addMoreInputRef.current) addMoreInputRef.current.click();
                }}
              >
                <Icon name="plus" size={16} />
                Add more
              </button>
              <button
                type="button"
                className={`button ${inlineImageTab === "grid" ? "primary" : ""}`}
                onClick={() => setInlineImageTab("grid")}
              >
                <Icon name="grid" size={16} />
                Grid
              </button>
              <button
                type="button"
                className={`button ${inlineImageTab === "list" ? "primary" : ""}`}
                onClick={() => setInlineImageTab("list")}
              >
                <Icon name="list" size={16} />
                List
              </button>
            </div>
          </div>
          {imagePreviews.length === 0 && <div className="muted">No images added yet.</div>}
          {inlineImageTab === "grid" && imagePreviews.length > 0 && (
            <div className="image-grid">
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="image-card" style={{ position: "relative" }}>
                  <img src={src} alt={`Preview ${idx + 1}`} />
                  <button
                    className="button ghost compact"
                    type="button"
                    style={{ position: "absolute", top: 6, right: 6 }}
                    onClick={() => removeImage(idx)}
                    aria-label="Remove image"
                  >
                    <Icon name="minus" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {inlineImageTab === "list" && imagePreviews.length > 0 && (
            <div className="stack" style={{ maxHeight: 320, overflow: "auto" }}>
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="image-preview-row" style={{ position: "relative" }}>
                  <img src={src} alt={`Preview ${idx + 1}`} />
                  <button
                    className="button ghost compact"
                    type="button"
                    style={{ position: "absolute", top: 8, right: 8 }}
                    onClick={() => removeImage(idx)}
                    aria-label="Remove image"
                  >
                    <Icon name="minus" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {imagePreviews.length > 0 && (
            <div className="dual-buttons" style={{ justifyContent: "flex-end", marginTop: 12 }}>
              <button
                type="button"
                className="button ghost"
                onClick={() => setConfirmImages(true)}
              >
                Submit images
              </button>
              <button
                type="button"
                className="button danger ghost"
                onClick={() => setConfirmClearImages(true)}
              >
                Cancel images
              </button>
            </div>
          )}
        </div>
        )}
        <div className="dual-buttons" style={{ justifyContent: "flex-end" }}>
          <button className="button danger ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="button primary" type="submit" form="case-form" disabled={!isValid || submitting}>
            {submitting ? "Saving..." : "Save case"}
          </button>
        </div>
      </form>

      {diseaseModalOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: "min(960px, 100%)" }}>
            <div className="page-header">
              <div className="page-title">
                <span className="badge">Skin conditions</span>
                <span className="muted">Select one or more and confirm</span>
              </div>
              <button className="button danger compact" type="button" onClick={handleCancelDiseases}>
                Close
              </button>
            </div>
            <div className="stack">
              <input
                className="input"
                placeholder="Search conditions"
                value={diseaseSearch}
                onChange={(e) => setDiseaseSearch(e.target.value)}
                style={{ marginTop: 8 }}
                autoFocus
              />
              <div className="tab-row">
                {diseaseGroups.map((group) => (
                  <button
                    key={group.label}
                    type="button"
                    className={`tab-button ${activeGroup === group.label ? "active" : ""}`}
                    onClick={() => setActiveGroup(group.label as DiseaseGroupLabel)}
                  >
                    {group.label}
                    <span className="tab-count">{group.items.length}</span>
                  </button>
                ))}
                <div className="tab-actions">
                  <button className="button ghost" type="button" onClick={resetDraftDiseases}>
                    Reset checked
                  </button>
                  <button
                    className="button"
                    type="button"
                    onClick={selectAllVisible}
                    disabled={!filteredDiseases.length}
                  >
                    Select all
                  </button>
                </div>
              </div>
              <div className="disease-grid">
                {filteredDiseases.map((entry) => (
                  <label key={entry.value} className={`disease-chip ${entry.group.toLowerCase()}`}>
                    <input
                      type="checkbox"
                      checked={draftDiseases.includes(entry.value)}
                      onChange={() => toggleDisease(entry.value)}
                    />
                    <span className="disease-name">{entry.value}</span>
                    <span className={`disease-tag ${entry.group.toLowerCase()}`}>{entry.group}</span>
                  </label>
                ))}
                {filteredDiseases.length === 0 && (
                  <div className="empty-state" style={{ padding: 12 }}>
                    No conditions match your search.
                  </div>
                )}
              </div>
              <div className="dual-buttons" style={{ justifyContent: "flex-end" }}>
                <button className="button ghost" type="button" onClick={handleCancelDiseases}>
                  Cancel
                </button>
                <button className="button primary" type="button" onClick={handleConfirmDiseases}>
                  Confirm selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {imageModalOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: "min(960px, 100%)" }}>
            <div className="page-header">
              <div className="page-title">
                <span className="badge">Image preview</span>
                <span className="muted">Up to 8 images</span>
              </div>
              <button className="button ghost" type="button" onClick={() => setImageModalOpen(false)}>
                Close
              </button>
            </div>

            <div className="dual-buttons" style={{ justifyContent: "flex-start" }}>
              <button
                type="button"
                className={`button ${imagePreviewTab === "list" ? "primary" : ""}`}
                onClick={() => setImagePreviewTab("list")}
              >
                <Icon name="list" size={16} />
                List view
              </button>
              <button
                type="button"
                className={`button ${imagePreviewTab === "grid" ? "primary" : ""}`}
                onClick={() => setImagePreviewTab("grid")}
              >
                <Icon name="grid" size={16} />
                Grid view
              </button>
              <button
                type="button"
                className={`button ${imagePreviewTab === "single" ? "primary" : ""}`}
                onClick={() => setImagePreviewTab("single")}
              >
                <Icon name="image" size={16} />
                Single image
              </button>
              <button className="button" type="button" onClick={() => setImageModalOpen(false)}>
                Confirm
              </button>
            </div>

            {imagePreviewTab === "list" && (
              <div className="stack" style={{ maxHeight: 420, overflow: "auto" }}>
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="image-preview-row">
                    <img src={src} alt={`Case ${idx + 1}`} />
                    <div className="stack" style={{ gap: 4 }}>
                      <div className="muted">Image {idx + 1}</div>
                      <button className="button ghost compact" type="button" onClick={() => removeImage(idx)}>
                        <Icon name="minus" size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {!imagePreviews.length && <div className="muted">No images added yet.</div>}
              </div>
            )}

            {imagePreviewTab === "grid" && (
              <div className="image-grid">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="image-card">
                    <img src={src} alt={`Case ${idx + 1}`} />
                    <button className="button ghost compact" type="button" onClick={() => removeImage(idx)}>
                      <Icon name="minus" size={14} />
                      Remove
                    </button>
                  </div>
                ))}
                {!imagePreviews.length && <div className="muted">No images added yet.</div>}
              </div>
            )}

            {imagePreviewTab === "single" && imagePreviews[0] && (
              <div className="image-single">
                <img src={imagePreviews[0]} alt="Case" />
                <div className="muted">Showing first image</div>
              </div>
            )}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmDiseaseSelection}
        message="Confirm selected skin conditions?"
        detail="This will populate the condition field for the case."
        confirmLabel="Confirm"
        onCancel={() => setConfirmDiseaseSelection(false)}
        onConfirm={() => {
          setSelectedDiseases(draftDiseases);
          const conditionValue = draftDiseases.length ? draftDiseases.join(", ") : "";
          update({ condition: conditionValue });
          setDiseaseModalOpen(false);
          setSelectionMessage(
            draftDiseases.length ? "Conditions added to the case note." : "No conditions selected. Please add one."
          );
          setConfirmDiseaseSelection(false);
        }}
      />
      <ConfirmDialog
        open={confirmImages}
        message="Submit selected images?"
        detail="These images will be attached to the case record."
        confirmLabel="Submit images"
        onCancel={() => setConfirmImages(false)}
        onConfirm={() => {
          setConfirmImages(false);
          setImagesCommitted(true);
          setShowInlineImages(false);
        }}
      />
      <ConfirmDialog
        open={confirmClearImages}
        message="Clear all selected images?"
        detail="Images will be removed from this case."
        confirmLabel="Clear images"
        onCancel={() => setConfirmClearImages(false)}
        onConfirm={() => {
          setImagePreviews([]);
          update({ images: [] });
          setImagesCommitted(false);
          setShowInlineImages(false);
          setConfirmClearImages(false);
        }}
      />
    </div>
  );
}
