import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  isDestructive,
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden pointer-events-auto"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-full ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-chattix-primary/10 text-chattix-primary'}`}>
                    {isDestructive ? <AlertTriangle size={24} /> : <Info size={24} />}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {message}
                </p>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    className={`flex-1 py-2.5 px-4 font-semibold rounded-xl text-white transition-colors ${
                      isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-chattix-primary hover:bg-chattix-secondary'
                    }`}
                  >
                    {confirmText}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
