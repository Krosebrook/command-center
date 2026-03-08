"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const typeStyles: Record<ToastType, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  error: "border-red-500/30 bg-red-500/10 text-red-400",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
};

function ToastItem({ toast: t, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(t.id), t.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [t, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-sm",
        "animate-in slide-in-from-bottom-2 fade-in duration-300",
        typeStyles[t.type],
      )}
    >
      <span className="flex-1">{t.message}</span>
      <button
        onClick={() => onDismiss(t.id)}
        className="text-current opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
