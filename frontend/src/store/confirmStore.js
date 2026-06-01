import { create } from 'zustand';

const useConfirmStore = create((set) => ({
  isOpen: false,
  title: '',
  message: '',
  type: 'danger',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  onConfirm: null,
  onCancel: null,
  showConfirm: (options) =>
    set({
      isOpen: true,
      title: options.title,
      message: options.message,
      type: options.type || 'danger',
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel || null,
    }),
  closeConfirm: () =>
    set({
      isOpen: false,
      title: '',
      message: '',
      type: 'danger',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      onConfirm: null,
      onCancel: null,
    }),
}));

export default useConfirmStore;
