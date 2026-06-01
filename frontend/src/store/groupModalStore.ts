import { create } from 'zustand';

interface GroupModalState {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const useGroupModalStore = create<GroupModalState>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}));

export default useGroupModalStore;
