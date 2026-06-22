import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Mail, Calendar, FileText } from 'lucide-react';
import './ProfilePage.css';

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/user/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setProfileUser(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, token]);

  if (loading) {
    return (
      <div className="profile-page loading">
        <div className="loader"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="profile-page">
        <p>User not found</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === userId;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>{isOwnProfile ? 'My Profile' : 'User Profile'}</h1>
        <div style={{ width: 24 }}></div>
      </div>

      <div className="profile-card">
        <div className="profile-avatar-section">
          <img 
            src={profileUser.avatar || `https://ui-avatars.com/api/?name=${profileUser.fullName}`}
            alt={profileUser.fullName}
            className="profile-avatar"
          />
          {isOwnProfile && (
            <label className="avatar-edit-btn">
              <input 
                type="file" 
                accept="image/*" 
                hidden 
                onChange={(e) => {
                  // Handle profile image upload
                  console.log('Image selected:', e.target.files[0]);
                }}
              />
              📷
            </label>
          )}
        </div>

        <div className="profile-info">
          <h2>{profileUser.fullName}</h2>
          <p className="username">@{profileUser.username}</p>
          
          <div className="profile-details">
            <div className="detail-item">
              <Mail size={16} />
              <span>{profileUser.email}</span>
            </div>
            <div className="detail-item">
              <Calendar size={16} />
              <span>Joined {new Date(profileUser.createdAt).toLocaleDateString()}</span>
            </div>
            {profileUser.bio && (
              <div className="detail-item bio">
                <FileText size={16} />
                <span>{profileUser.bio}</span>
              </div>
            )}
          </div>

          <div className="profile-status">
            <span className={`status-badge ${profileUser.status || 'available'}`}>
              {profileUser.status || 'Available'}
            </span>
            <span className={`online-indicator ${profileUser.isOnline ? 'online' : 'offline'}`}>
              {profileUser.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {isOwnProfile && (
          <div className="profile-actions">
            <button className="edit-btn">Edit Profile</button>
          </div>
        )}
      </div>
    </div>
  );
}
