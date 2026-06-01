import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import useConfirmStore from '../../store/confirmStore';

const ConfirmModal = () => {
  const {
    isOpen,
    title,
    message,
    type,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    closeConfirm,
  } = useConfirmStore();

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    closeConfirm();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    closeConfirm();
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-8 h-8 text-amber-500" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-emerald-500" />;
      case 'info':
      default:
        return <Info className="w-8 h-8 text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)] border-red-500/20',
          btn: 'bg-red-500 hover:bg-red-600 focus:ring-red-500/50 shadow-lg shadow-red-500/20',
          bgIcon: 'bg-red-500/10 border-red-500/20',
        };
      case 'warning':
        return {
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)] border-amber-500/20',
          btn: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500/50 shadow-lg shadow-amber-500/20',
          bgIcon: 'bg-amber-500/10 border-amber-500/20',
        };
      case 'success':
        return {
          glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)] border-emerald-500/20',
          btn: 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500/50 shadow-lg shadow-emerald-500/20',
          bgIcon: 'bg-emerald-500/10 border-emerald-500/20',
        };
      case 'info':
      default:
        return {
          glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)] border-blue-500/20',
          btn: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500/50 shadow-lg shadow-blue-500/20',
          bgIcon: 'bg-blue-500/10 border-blue-500/20',
        };
    }
  };

  const colors = getColors();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className={`relative w-full max-w-md bg-neutral-900/80 border backdrop-blur-2xl rounded-3xl p-6 flex flex-col items-center text-center ${colors.glow} z-10`}
          >
            {/* Close Button */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Icon Header */}
            <div className={`p-4 rounded-2xl border mb-4 ${colors.bgIcon} flex items-center justify-center`}>
              {getIcon()}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-2 leading-snug">
              {title}
            </h3>

            {/* Message */}
            <p className="text-neutral-300 text-sm leading-relaxed mb-6 max-w-sm">
              {message}
            </p>

            {/* Action Buttons */}
            <div className="flex w-full space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 px-4 rounded-xl border border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 text-neutral-200 hover:text-white font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-neutral-700/50 cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 py-3 px-4 rounded-xl text-white font-semibold text-sm transition-all focus:outline-none focus:ring-2 cursor-pointer ${colors.btn}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
