import { create } from 'zustand';

const useSettingsDrawerStore = create((set) => ({
  isOpen: false,
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
}));

export default useSettingsDrawerStore;
