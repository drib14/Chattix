import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Mail, User, Shield, Camera } from 'lucide-react';
import { api } from '../../services/api';
import { setCredentials } from '../../redux/slices/authSlice';

const UserProfile = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.user) {
        dispatch(setCredentials({ user: data.user, token }));
      }
    } catch (err) {
      console.error('Failed to upload avatar:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-container">
      <h3 className="profile-title">User Profile</h3>

      <div className="profile-card clay-card">
        {/* Cover pattern */}
        <div className="profile-cover" />

        {/* Profile Details */}
        <div className="profile-header">
          <div className="profile-avatar-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?background=6366F1&color=fff&name=${encodeURIComponent(user?.fullName || 'U')}`}
              alt="avatar"
              className="profile-avatar"
              style={{ opacity: uploading ? 0.5 : 1 }}
            />
            <button
              className="profile-avatar-edit-btn"
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: 5,
                right: -5,
                background: 'var(--clay-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              <Camera size={16} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </div>
          <h4 className="profile-name">{user?.fullName}</h4>
          <p className="profile-username">@{user?.username}</p>
        </div>

        <div className="profile-details">
          <div className="profile-detail-row">
            <Mail size={18} className="profile-icon" />
            <div className="profile-text-group">
              <span className="profile-label">Email Address</span>
              <span className="profile-val text-truncate">{user?.email}</span>
            </div>
          </div>

          <div className="profile-detail-row">
            <User size={18} className="profile-icon" />
            <div className="profile-text-group">
              <span className="profile-label">Chattix Account ID</span>
              <span className="profile-val text-truncate">{user?._id}</span>
            </div>
          </div>

          <div className="profile-detail-row">
            <Shield size={18} className="profile-icon" />
            <div className="profile-text-group">
              <span className="profile-label">Identity Provider</span>
              <span className="profile-val">Clerk Secure Sync</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

