import { create } from "zustand";

type ModalName = "newChat" | "newGroup" | "groupInfo" | "comingSoon" | null;

interface ModalState {
  activeModal: ModalName;
  modalData: Record<string, unknown>;
  openModal: (name: Exclude<ModalName, null>, data?: Record<string, unknown>) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  activeModal: null,
  modalData: {},
  openModal: (name, data = {}) => set({ activeModal: name, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: {} }),
}));
