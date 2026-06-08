import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ZoomIn, ZoomOut, RotateCw, RefreshCw } from 'lucide-react';
import CustomVideoPlayer from './CustomVideoPlayer';

const MediaModal = ({ isOpen, onClose, attachment }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !attachment) return null;

  const isImage = attachment.type === 'image' || attachment.type === 'gif';
  const isVideo = attachment.type === 'video';

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 sm:p-8"
      >
        {/* Top Control Bar */}
        <div className="absolute top-4 right-4 left-4 flex justify-between items-center z-50">
          {/* Filename / Title */}
          <span className="text-white/80 text-sm font-medium truncate max-w-[50%] hidden sm:inline-block">
            {attachment.filename || 'Media Viewer'}
          </span>

          <div className="flex gap-2 ml-auto">
            {/* Image custom controls */}
            {isImage && (
              <div className="flex gap-1.5 bg-white/10 p-1 rounded-full backdrop-blur-md mr-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
                  title="Zoom In"
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
                  title="Zoom Out"
                >
                  <ZoomOut size={18} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRotate(); }}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
                  title="Rotate"
                >
                  <RotateCw size={18} />
                </button>
                {(scale !== 1 || rotation !== 0) && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
                    title="Reset"
                  >
                    <RefreshCw size={18} />
                  </button>
                )}
              </div>
            )}

            {/* General Actions */}
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              download
              onClick={(e) => e.stopPropagation()}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
              title="Download File"
            >
              <Download size={18} />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Media Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-full max-h-[85vh] flex items-center justify-center overflow-hidden w-full h-full"
        >
          {isImage && (
            <div className="flex items-center justify-center w-full h-full max-w-full max-h-[80vh] overflow-auto select-none">
              <img
                src={attachment.url}
                alt="Media content"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
          )}
          {isVideo && (
            <div className="w-full max-w-4xl max-h-[80vh] rounded-xl overflow-hidden shadow-2xl border border-white/10">
              <CustomVideoPlayer src={attachment.url} className="w-full h-full" />
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MediaModal;
