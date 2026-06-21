import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const MediaGalleryModal = ({ isOpen, onClose, activeMediaUrl, setActiveMediaUrl, messages }) => {
  if (!isOpen || !activeMediaUrl) return null;

  // Extract all media in the active conversation
  const mediaList = messages
    .flatMap((m) => m.attachments || [])
    .filter((a) => a.type === 'image' || a.type === 'video');

  const currentIndex = mediaList.findIndex((m) => m.url === activeMediaUrl);

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setActiveMediaUrl(mediaList[currentIndex - 1].url);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentIndex < mediaList.length - 1) {
      setActiveMediaUrl(mediaList[currentIndex + 1].url);
    }
  };

  const activeMedia = mediaList[currentIndex] || { url: activeMediaUrl, type: 'image' };

  return (
    <div style={styles.overlay} onClick={onClose}>
      {/* Lightbox Header Close Button */}
      <button style={styles.closeBtn} onClick={onClose} title="Close Lightbox">
        <X size={24} />
      </button>

      {/* Main Attachment Render Pane */}
      <div style={styles.viewerContainer} onClick={(e) => e.stopPropagation()}>
        {currentIndex > 0 && (
          <button style={{ ...styles.navBtn, left: '20px' }} onClick={handlePrev} title="Previous Media">
            <ChevronLeft size={32} />
          </button>
        )}

        <div style={styles.mediaWrapper}>
          {activeMedia.type === 'video' ? (
            <video src={activeMedia.url} controls autoPlay style={styles.mediaElement} />
          ) : (
            <img src={activeMedia.url} alt="Lightbox Attachment" style={styles.mediaElement} />
          )}

          {/* Details Label */}
          <div style={styles.mediaHeader}>
            <span style={styles.filename} className="text-truncate">{activeMedia.filename}</span>
            <a href={activeMedia.url} target="_blank" rel="noreferrer" download style={styles.downloadLink} title="Download original">
              <Download size={18} />
            </a>
          </div>
        </div>

        {currentIndex < mediaList.length - 1 && (
          <button style={{ ...styles.navBtn, right: '20px' }} onClick={handleNext} title="Next Media">
            <ChevronRight size={32} />
          </button>
        )}
      </div>

      {/* Messenger-style bottom thumbnail preview strip */}
      <div style={styles.thumbnailStrip} onClick={(e) => e.stopPropagation()}>
        <div style={styles.scrollStrip}>
          {mediaList.map((m, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <div
                key={idx}
                onClick={() => setActiveMediaUrl(m.url)}
                style={{
                  ...styles.thumbWrapper,
                  ...(isSelected ? styles.thumbSelected : {}),
                }}
              >
                {m.type === 'video' ? (
                  <div style={styles.videoThumb}>
                    <div style={styles.playIcon}>▶</div>
                  </div>
                ) : (
                  <img src={m.url} alt="" style={styles.thumbImage} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.95)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    animation: 'popIn 0.25s ease-out',
  },
  closeBtn: {
    position: 'absolute',
    top: '24px',
    right: '24px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: '#ffffff',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  viewerContainer: {
    flex: 1,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    maxHeight: 'calc(100% - 100px)',
  },
  navBtn: {
    position: 'absolute',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: '#ffffff',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    zIndex: 10,
  },
  mediaWrapper: {
    maxWidth: '90%',
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  mediaElement: {
    maxWidth: '100%',
    maxHeight: '70vh',
    borderRadius: '16px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
    objectFit: 'contain',
  },
  mediaHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '14px',
  },
  filename: {
    maxWidth: '240px',
    fontWeight: 600,
  },
  downloadLink: {
    color: 'rgba(255,255,255,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  thumbnailStrip: {
    width: '100%',
    maxWidth: '700px',
    height: '80px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.06)',
    padding: '10px 16px',
    display: 'flex',
    justifyContent: 'center',
    marginTop: '20px',
  },
  scrollStrip: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    alignItems: 'center',
    width: '100%',
  },
  thumbWrapper: {
    width: '46px',
    height: '46px',
    borderRadius: '10px',
    overflow: 'hidden',
    cursor: 'pointer',
    flexShrink: 0,
    opacity: 0.5,
    transition: 'all 0.2s',
    border: '2px solid transparent',
  },
  thumbSelected: {
    opacity: 1,
    borderColor: 'var(--clay-primary)',
    transform: 'scale(1.08)',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  videoThumb: {
    width: '100%',
    height: '100%',
    background: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: '#ffffff',
    fontSize: '14px',
  },
};

export default MediaGalleryModal;
