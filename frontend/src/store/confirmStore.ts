import { create } from 'zustand';

interface ConfirmOptions {
  title: string;
  message: string;
  type?: 'danger' | 'info' | 'success' | 'warning';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'danger' | 'info' | 'success' | 'warning';
  confirmText: string;
  cancelText: string;
  onConfirm: (() => void | Promise<void>) | null;
  onCancel: (() => void) | null;
  showConfirm: (options: ConfirmOptions) => void;
  closeConfirm: () => void;
}

const useConfirmStore = create<ConfirmState>((set) => ({
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
