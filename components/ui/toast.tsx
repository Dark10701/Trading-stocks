"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const ICON_COLORS: Record<ToastType, string> = {
  success: "text-profit",
  error: "text-destructive",
  info: "text-primary",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast viewport: top-center on phones, top-right on desktop */}
      <div className="fixed top-20 inset-x-4 sm:inset-x-auto sm:right-6 z-[120] flex flex-col items-center sm:items-end gap-2 pointer-events-none">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              role="status"
              className="glass-card-strong pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-xl shadow-black/30 w-full max-w-sm sm:w-auto animate-fade-up"
            >
              <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${ICON_COLORS[t.type]}`} />
              <p className="text-sm text-foreground leading-snug">{t.message}</p>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
