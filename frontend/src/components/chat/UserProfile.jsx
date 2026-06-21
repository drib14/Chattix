import { useSelector } from 'react-redux';
import { Mail, User, Shield } from 'lucide-react';

const UserProfile = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="profile-container">
      <h3 className="profile-title">User Profile</h3>

      <div className="profile-card clay-card">
        {/* Cover pattern */}
        <div className="profile-cover" />

        {/* Profile Details */}
        <div className="profile-header">
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?background=6366F1&color=fff&name=${encodeURIComponent(user?.fullName || 'U')}`}
            alt="avatar"
            className="profile-avatar"
          />
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

