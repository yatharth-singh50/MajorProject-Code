import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((message, opts = {}) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, tone: opts.tone || "default" }]);
    setTimeout(() => dismiss(id), opts.duration || 3200);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none sm:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-rise pointer-events-auto rounded-full border border-border-strong bg-surface px-4 py-2 text-sm text-text shadow-lg shadow-black/20"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
