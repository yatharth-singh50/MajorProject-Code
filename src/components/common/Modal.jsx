import { useEffect } from "react";
import { X } from "lucide-react";
import { cx } from "../../utils/format";

export default function Modal({ open, onClose, children, className = "" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/50 px-4 pt-6 pb-10 backdrop-blur-[2px] sm:pt-16">
      <div
        className={cx(
          "animate-rise w-full max-w-xl rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40",
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-end p-2">
          <button
            onClick={onClose}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-text-dim hover:bg-surface-hover hover:text-text"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
