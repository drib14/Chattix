import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';

const DeleteMessageModal = ({ isOpen, onClose, message, isOwn, isGroup, onDeleteMe, onDeleteEveryone }) => {
  const [loading, setLoading] = useState(false);
  const { confirm } = useConfirm();

  if (!isOpen || !message) return null;

  const handleDeleteForMe = async () => {
    const confirmed = await confirm({
      title: 'Delete for Me',
      message: 'Are you sure you want to delete this message? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true
    });
    if (!confirmed) return;
    
    setLoading(true);
    await onDeleteMe(message);
    setLoading(false);
    onClose();
  };

  const handleDeleteForEveryone = async () => {
    const confirmed = await confirm({
      title: 'Delete for Everyone',
      message: 'Are you sure you want to delete this message for everyone? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true
    });
    if (!confirmed) return;
    
    setLoading(true);
    await onDeleteEveryone(message);
    setLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden relative"
        >
          <div className="absolute top-4 right-4">
            <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 text-red-600 rounded-full">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Message</h3>
            </div>
            
            <p className="text-gray-600 text-sm mb-6">
              Who do you want to delete this message for?
            </p>

            <div className="flex flex-col gap-3">
              {isOwn && (!isGroup || onDeleteEveryone) && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleDeleteForEveryone}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-colors text-left group disabled:opacity-50"
                >
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-red-700">Delete for everyone</p>
                    <p className="text-xs text-gray-500 group-hover:text-red-600/70">Remove this message for all members</p>
                  </div>
                  <AlertTriangle size={18} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
              
              <button
                type="button"
                disabled={loading}
                onClick={handleDeleteForMe}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-chattix-primary hover:bg-chattix-primary/5 transition-colors text-left group disabled:opacity-50"
              >
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-chattix-primary-dark">Delete for me</p>
                  <p className="text-xs text-gray-500 group-hover:text-chattix-primary/70">Remove this message from your device only</p>
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DeleteMessageModal;
