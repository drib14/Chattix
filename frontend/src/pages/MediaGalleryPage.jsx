import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, X } from 'lucide-react';
import './MediaGalleryPage.css';

export default function MediaGalleryPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/chats/${chatId}/media`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        
        const mediaMessages = data
          .filter(msg => msg.attachments && msg.attachments.length > 0)
          .flatMap(msg => msg.attachments.map(att => ({ ...att, sender: msg.sender, createdAt: msg.createdAt })))
          .filter(att => att.type === 'image' || att.type === 'video');
        
        setMediaItems(mediaMessages);
      } catch (error) {
        console.error('Error fetching media:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [chatId, token]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  const handleKeyPress = (e) => {
    if (selectedMedia) {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') setSelectedMedia(null);
    }
  };

  useEffect(() => {
    if (selectedMedia) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [selectedMedia, currentIndex, mediaItems]);

  if (loading) {
    return (
      <div className="media-gallery loading">
        <div className="loader"></div>
      </div>
    );
  }

  const currentMedia = selectedMedia || (mediaItems[currentIndex] && mediaItems[currentIndex]);

  return (
    <div className="media-gallery">
      <div className="gallery-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>Media Gallery</h1>
        <div className="media-count">{mediaItems.length}</div>
      </div>

      {mediaItems.length === 0 ? (
        <div className="empty-state">
          <p>No media found in this chat</p>
        </div>
      ) : (
        <>
          <div className="gallery-grid">
            {mediaItems.map((media, index) => (
              <div
                key={index}
                className="gallery-item"
                onClick={() => {
                  setSelectedMedia(media);
                  setCurrentIndex(index);
                }}
              >
                {media.type === 'video' ? (
                  <video src={media.url} className="gallery-thumbnail" />
                ) : (
                  <img src={media.url} alt="gallery item" className="gallery-thumbnail" />
                )}
                <div className="overlay">
                  {media.type === 'video' && <div className="play-icon">▶</div>}
                </div>
              </div>
            ))}
          </div>

          {selectedMedia && (
            <div className="media-viewer">
              <div className="viewer-overlay" onClick={() => setSelectedMedia(null)} />
              <div className="viewer-content">
                <button className="close-btn" onClick={() => setSelectedMedia(null)}>
                  <X size={28} />
                </button>

                <div className="viewer-display">
                  {currentMedia.type === 'video' ? (
                    <video
                      src={currentMedia.url}
                      controls
                      className="media-display"
                      autoPlay
                    />
                  ) : (
                    <img src={currentMedia.url} alt="full media" className="media-display" />
                  )}
                </div>

                <div className="viewer-controls">
                  <button
                    className="nav-btn prev"
                    onClick={handlePrevious}
                    title="Previous (Arrow Left)"
                  >
                    ←
                  </button>

                  <div className="media-info">
                    <span>{currentIndex + 1} / {mediaItems.length}</span>
                    <span className="media-type">{currentMedia.type}</span>
                  </div>

                  <button
                    className="nav-btn next"
                    onClick={handleNext}
                    title="Next (Arrow Right)"
                  >
                    →
                  </button>

                  <a
                    href={currentMedia.url}
                    download
                    className="download-btn"
                    title="Download"
                  >
                    <Download size={20} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
