import React, { useState, useContext, useEffect } from 'react';
import { Save } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import Avatar from '../UI/Avatar';
import api from '../../api/axios';

const SettingsPane = () => {
  const { currentUser, login } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    profilePic: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        profilePic: currentUser.profilePic || ''
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await api.put(`/users/${currentUser.id || currentUser._id}`, formData);
      const updatedUser = response.data;
      
      // Update global context by re-logging in with new user data
      const currentToken = localStorage.getItem('token');
      login(currentToken, updatedUser);
      
      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile', error);
      setMessage('Failed to update profile.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Preview user object for Avatar
  const previewUser = { ...currentUser, ...formData };

  return (
    <div className="inbox-pane" style={{ overflowY: 'auto' }}>
      <div className="inbox-header">
        <h2>Settings</h2>
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar user={previewUser} size={100} className="settings-avatar" />
        <h3 style={{ marginTop: '1rem', fontSize: '1.2rem' }}>@{currentUser?.username}</h3>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {message && (
          <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: message.includes('success') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.includes('success') ? '#10b981' : '#ef4444', fontSize: '0.9rem', textAlign: 'center' }}>
            {message}
          </div>
        )}
        
        <div className="form-group">
          <label className="form-label" style={{ fontSize: '0.85rem' }}>Image URL</label>
          <input
            type="text"
            name="profilePic"
            className="form-input"
            placeholder="https://example.com/image.jpg"
            value={formData.profilePic}
            onChange={handleChange}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>Paste an image URL to set your avatar.</span>
        </div>

        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>First Name</label>
            <input
              type="text"
              name="firstName"
              className="form-input"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Last Name</label>
            <input
              type="text"
              name="lastName"
              className="form-input"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={saving}>
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default SettingsPane;
