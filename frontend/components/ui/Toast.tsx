"use client";

import { useToastStore } from "@/store/toastStore";

const styles = {
  success: "bg-green-700 border-green-500",
  error: "bg-red-800 border-red-600",
  info: "bg-signal-sidebar border-signal-divider",
};

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-signal-text-primary text-sm max-w-sm pointer-events-auto animate-in slide-in-from-bottom-2 ${styles[toast.type]}`}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-signal-text-secondary hover:text-signal-text-primary flex-shrink-0"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
