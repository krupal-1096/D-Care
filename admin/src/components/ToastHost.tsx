import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useUiStore } from "../store/ui";

const toneClasses: Record<string, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
  info: "border-slate-200 bg-white text-slate-900"
};

export function ToastHost() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  useEffect(() => {
    if (toasts.length > 0) document.body.classList.add("toast-open");
    return () => document.body.classList.remove("toast-open");
  }, [toasts.length]);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toneClasses[toast.tone ?? "info"]}`}>
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
            ×
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
