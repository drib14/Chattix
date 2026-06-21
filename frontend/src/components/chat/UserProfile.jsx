import { useSelector } from 'react-redux';
import { Mail, User, Shield } from 'lucide-react';

const UserProfile = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div style={styles.container}>
      <h3 style={styles.sectionTitle}>User Profile</h3>

      <div style={styles.card} className="clay-card">
        {/* Cover pattern */}
        <div style={styles.cover} />

        {/* Profile Details */}
        <div style={styles.profileHeader}>
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?background=6366F1&color=fff&name=${encodeURIComponent(user?.fullName || 'U')}`}
            alt="avatar"
            style={styles.avatar}
          />
          <h4 style={styles.name}>{user?.fullName}</h4>
          <p style={styles.username}>@{user?.username}</p>
        </div>

        <div style={styles.details}>
          <div style={styles.detailRow}>
            <Mail size={18} style={styles.icon} />
            <div style={styles.textGroup}>
              <span style={styles.label}>Email Address</span>
              <span style={styles.val} className="text-truncate">{user?.email}</span>
            </div>
          </div>

          <div style={styles.detailRow}>
            <User size={18} style={styles.icon} />
            <div style={styles.textGroup}>
              <span style={styles.label}>Chattix Account ID</span>
              <span style={styles.val} className="text-truncate">{user?._id}</span>
            </div>
          </div>

          <div style={styles.detailRow}>
            <Shield size={18} style={styles.icon} />
            <div style={styles.textGroup}>
              <span style={styles.label}>Identity Provider</span>
              <span style={styles.val}>Clerk Secure Sync</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '8px 4px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--text-light)',
    marginBottom: '16px',
    paddingLeft: '12px',
  },
  card: {
    background: '#ffffff',
    margin: '0 8px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  cover: {
    height: '80px',
    background: 'linear-gradient(135deg, var(--clay-primary-light) 0%, #ffe4e6 100%)',
    width: '100%',
  },
  profileHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '-40px',
    marginBottom: '24px',
    padding: '0 16px',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '24px',
    objectFit: 'cover',
    background: '#ffffff',
    border: '4px solid #ffffff',
    boxShadow: '0 8px 16px rgba(0,0,0,0.06)',
  },
  name: {
    fontSize: '18px',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginTop: '12px',
    letterSpacing: '-0.3px',
  },
  username: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  details: {
    padding: '0 20px 24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#f8fafc',
    padding: '12px 14px',
    borderRadius: '14px',
    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.02)',
  },
  icon: {
    color: 'var(--clay-primary)',
  },
  textGroup: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flex: 1,
  },
  label: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  val: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginTop: '1px',
  },
};

export default UserProfile;
