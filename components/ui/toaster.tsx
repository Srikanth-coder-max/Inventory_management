"use client";

import { useEffect, useState } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

// Simple global toast store
let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toastList: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach((fn) => fn([...toastList]));
}

export function toast(
  message: string,
  type: Toast["type"] = "info"
) {
  const id = `toast-${Date.now()}-${Math.random()}`;
  toastList = [...toastList, { id, message, type }];
  notifyListeners();

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toastList = toastList.filter((t) => t.id !== id);
    notifyListeners();
  }, 4000);
}

const typeStyles: Record<Toast["type"], string> = {
  success: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  error: "bg-red-500/15 border-red-500/30 text-red-300",
  warning: "bg-amber-500/15 border-amber-500/30 text-amber-300",
  info: "bg-blue-500/15 border-blue-500/30 text-blue-300",
};

const typeIcons: Record<Toast["type"], string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (updated: Toast[]) => setToasts(updated);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl animate-slide-up ${typeStyles[t.type]}`}
          role="alert"
        >
          <span className="text-base font-bold mt-0.5 shrink-0">
            {typeIcons[t.type]}
          </span>
          <p className="text-sm font-medium leading-snug">{t.message}</p>
        </div>
      ))}
    </div>
  );
}
