import { useEffect } from "react";
import { createPortal } from "react-dom";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  loadingLabel?: string;
  showBadge?: boolean;
  badgeClassName?: string;
};

export function ConfirmDialog({
  open,
  title = "Please confirm",
  message,
  detail,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  loadingLabel,
  showBadge = true,
  badgeClassName
}: ConfirmDialogProps) {
  if (!open) return null;

  useEffect(() => {
    document.body.classList.toggle("modal-open", open);
    return () => document.body.classList.remove("modal-open");
  }, [open]);

  return createPortal(
    <div className="modal-backdrop" role="presentation">
      <div className="modal" style={{ maxWidth: 520 }} role="dialog" aria-modal="true">
        <div className="stack" style={{ gap: 14 }}>
          <div className="page-title" style={{ gap: 6 }}>
            {showBadge && <span className={`badge ${badgeClassName ?? ""}`}>{title}</span>}
            <div style={{ fontWeight: 700, fontSize: 18 }}>{message}</div>
            {detail && <div className="muted">{detail}</div>}
          </div>
          <div className="dual-buttons" style={{ justifyContent: "flex-end" }}>
            <button className="button ghost" type="button" onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </button>
            <button className="button primary" type="button" onClick={onConfirm} disabled={loading}>
              {loading ? loadingLabel ?? "Working..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
