"use client";

import { useModalStore } from "@/store/modalStore";

export default function ModalShell({ children }: { children: React.ReactNode }) {
  const closeModal = useModalStore((s) => s.closeModal);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeModal}
      />
      <div
        className="relative z-10 bg-signal-sidebar rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
