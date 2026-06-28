"use client";

import { useModalStore } from "@/store/modalStore";
import ModalShell from "./ModalShell";

export default function ComingSoonModal() {
  const closeModal = useModalStore((s) => s.closeModal);
  const data = useModalStore((s) => s.modalData);
  const feature = (data.feature as string) ?? "This feature";

  return (
    <ModalShell>
      <div className="p-8 flex flex-col items-center gap-4 text-center">
        <div className="text-5xl">🔜</div>
        <h2 className="text-xl font-semibold text-signal-text-primary">{feature}</h2>
        <p className="text-signal-text-secondary text-sm">
          This feature is coming soon. Signal clone only supports messaging for now.
        </p>
        <button
          onClick={closeModal}
          className="mt-2 bg-signal-accent hover:bg-blue-500 text-white font-medium px-8 py-2.5 rounded-lg transition-colors"
        >
          Got it
        </button>
      </div>
    </ModalShell>
  );
}
