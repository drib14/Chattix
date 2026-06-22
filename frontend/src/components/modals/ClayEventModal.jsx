import { useState } from 'react';
import { X, Calendar, MapPin, AlignLeft, Info, Upload } from 'lucide-react';
import api from '../../services/api';

const ClayEventModal = ({ isOpen, onClose, chatId, onEventCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [image, setImage] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingCover(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await api.upload('/messages/upload', formData);
      if (uploadRes && uploadRes.attachment && uploadRes.attachment.url) {
        setImage(uploadRes.attachment.url);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to upload event cover:', err);
      setError('Failed to upload cover image. Please try again.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !startDate) {
      setError('Title and Start Date are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const eventData = {
        chatId,
        title: title.trim(),
        description: description.trim(),
        startDate,
        endDate: endDate || undefined,
        location: location.trim(),
        color,
        image,
      };

      const event = await api.post('/events', eventData);
      
      if (onEventCreated) {
        onEventCreated(event);
      }
      
      // Reset form
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setLocation('');
      setColor('#6366f1');
      setImage('');
      onClose();
    } catch (err) {
      console.error('Failed to create event:', err);
      setError(err.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    { value: '#6366f1', label: 'Indigo' },
    { value: '#f43f5e', label: 'Rose' },
    { value: '#10b981', label: 'Emerald' },
    { value: '#eab308', label: 'Yellow' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#f97316', label: 'Orange' },
  ];

  return (
    <div className="clay-modal-backdrop">
      <div className="clay-modal-card clay-card animate-pop-in" id="event-creation-modal" style={{ maxWidth: '480px', width: '90%' }}>
        <div className="clay-modal-header">
          <div className="flex-center" style={{ gap: '8px' }}>
            <Calendar className="clay-icon-primary" size={20} />
            <h3 className="clay-modal-title">Create New Event</h3>
          </div>
          <button onClick={onClose} className="clay-modal-close-btn" id="event-close-x-btn">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="clay-modal-form" id="event-creation-form">
          {error && <div className="clay-modal-error">{error}</div>}

          <div className="clay-form-group">
            <label className="clay-form-label">Event Title *</label>
            <input
              type="text"
              placeholder="e.g. Brainstorming Session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="clay-input"
              required
              id="event-title-input"
            />
          </div>

          <div className="clay-form-group">
            <label className="clay-form-label">Event Cover Image (Optional)</label>
            {image ? (
              <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px' }}>
                <img src={image} alt="Event cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => setImage('')}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  background: '#f8fafc',
                  textAlign: 'center',
                  transition: 'border-color 0.2s',
                }}
              >
                <Upload size={20} className="text-light" style={{ marginBottom: '6px', color: '#64748b' }} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                  {uploadingCover ? 'Uploading...' : 'Upload Cover Image'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>

          <div className="clay-form-group">
            <label className="clay-form-label">Description</label>
            <div className="clay-input-wrapper">
              <AlignLeft size={16} className="clay-input-icon" />
              <textarea
                placeholder="What is this event about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="clay-input clay-textarea"
                rows={3}
                id="event-desc-input"
              />
            </div>
          </div>

          <div className="clay-form-row" style={{ display: 'flex', gap: '12px' }}>
            <div className="clay-form-group" style={{ flex: 1 }}>
              <label className="clay-form-label">Starts *</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="clay-input"
                required
                id="event-start-date"
              />
            </div>
            <div className="clay-form-group" style={{ flex: 1 }}>
              <label className="clay-form-label">Ends</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="clay-input"
                id="event-end-date"
              />
            </div>
          </div>

          <div className="clay-form-group">
            <label className="clay-form-label">Location / Call Link</label>
            <div className="clay-input-wrapper">
              <MapPin size={16} className="clay-input-icon" />
              <input
                type="text"
                placeholder="e.g. Google Meet, Meeting Room 3"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="clay-input"
                id="event-location-input"
              />
            </div>
          </div>

          <div className="clay-form-group">
            <label className="clay-form-label">Event Category Color</label>
            <div className="clay-color-swatches" style={{ display: 'flex', gap: '8px' }}>
              {colors.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`clay-color-swatch-btn ${color === c.value ? 'active' : ''}`}
                  style={{
                    backgroundColor: c.value,
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: color === c.value ? '2px solid #000' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                  title={c.label}
                  id={`event-color-btn-${c.label.toLowerCase()}`}
                />
              ))}
            </div>
          </div>

          <div className="clay-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="clay-btn clay-btn-secondary"
              disabled={loading}
              id="event-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="clay-btn clay-btn-primary"
              disabled={loading}
              id="event-submit-btn"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClayEventModal;
