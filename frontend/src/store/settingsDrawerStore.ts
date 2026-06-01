import { create } from 'zustand';

interface SettingsDrawerState {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const useSettingsDrawerStore = create<SettingsDrawerState>((set) => ({
  isOpen: false,
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
}));

export default useSettingsDrawerStore;
