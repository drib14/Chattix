import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

const MediaModal = ({ isOpen, onClose, attachment }) => {
  if (!isOpen || !attachment) return null;

  const isImage = attachment.type === 'image' || attachment.type === 'gif';
  const isVideo = attachment.type === 'video';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-8"
      >
        <div className="absolute top-4 right-4 flex gap-3">
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            download
            onClick={(e) => e.stopPropagation()}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
            title="Download"
          >
            <Download size={24} />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-full max-h-full flex items-center justify-center"
        >
          {isImage && (
            <img
              src={attachment.url}
              alt="Media content"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          )}
          {isVideo && (
            <video
              src={attachment.url}
              controls
              autoPlay
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl bg-black"
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MediaModal;
