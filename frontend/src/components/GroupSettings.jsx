import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  X,
  Camera,
  Trash2,
  Save,
  User,
  Users,
  Shield,
  Copy,
  AlertCircle,
} from 'lucide-react';
import { groupService } from '../services/groupService';
import toast from 'react-hot-toast';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=3B82F6&color=fff&bold=true';

const GroupSettings = ({ group, onClose, onUpdate }) => {
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    groupName: group?.groupName || '',
    description: group?.description || '',
    groupRules: group?.groupRules || '',
    announcementMode: group?.announcementMode || false,
    inviteCodeEnabled: group?.inviteCodeEnabled !== false,
  });

  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(group?.groupAvatar);

  const isAdmin = group?.admin?._id === user?._id;

  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium">Only admin can access settings</p>
        </div>
      </div>
    );
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setPreviewUrl(event.target?.result);
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Upload avatar if changed
      if (avatarFile) {
        await groupService.uploadGroupAvatar(group._id, avatarFile);
      }

      // Update settings
      const updatedGroup = await groupService.updateGroupSettings(group._id, {
        groupName: formData.groupName,
        description: formData.description,
        groupRules: formData.groupRules,
        announcementMode: formData.announcementMode,
        inviteCodeEnabled: formData.inviteCodeEnabled,
      });

      toast.success('Group settings updated!');
      onUpdate?.(updatedGroup);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Remove group avatar?')) return;
    try {
      await groupService.removeGroupAvatar(group._id);
      setPreviewUrl(DEFAULT_AVATAR);
      setAvatarFile(null);
      toast.success('Avatar removed');
    } catch (error) {
      toast.error('Failed to remove avatar');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Delete this group? This cannot be undone.')) return;
    setLoading(true);
    try {
      await groupService.deleteGroup(group._id);
      toast.success('Group deleted');
      onClose?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
        <h2 className="text-lg font-bold text-gray-900">Group Settings</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-6">
        {/* Avatar Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Group Avatar</h3>
          <div className="flex items-center gap-4">
            <img
              src={previewUrl || DEFAULT_AVATAR}
              alt="group avatar"
              className="w-20 h-20 rounded-xl object-cover"
            />
            <div className="space-y-2">
              <label className="flex items-center gap-2 px-3 py-2 bg-chattix-primary text-white rounded-lg cursor-pointer hover:bg-chattix-secondary transition-colors text-sm font-medium">
                <Camera size={16} />
                Change Avatar
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
              {previewUrl !== DEFAULT_AVATAR && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Group Name */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-900">Group Name</label>
          <input
            type="text"
            name="groupName"
            value={formData.groupName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-chattix-primary/30"
            maxLength="50"
          />
          <p className="text-xs text-gray-500">{formData.groupName.length}/50</p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-900">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Add group description..."
            rows="3"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-chattix-primary/30 resize-none"
            maxLength="500"
          />
          <p className="text-xs text-gray-500">{formData.description.length}/500</p>
        </div>

        {/* Group Rules */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-900">Group Rules</label>
          <textarea
            name="groupRules"
            value={formData.groupRules}
            onChange={handleInputChange}
            placeholder="Enter group rules or guidelines..."
            rows="3"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-chattix-primary/30 resize-none"
            maxLength="1000"
          />
          <p className="text-xs text-gray-500">{formData.groupRules.length}/1000</p>
        </div>

        {/* Settings */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="announcementMode"
              checked={formData.announcementMode}
              onChange={handleInputChange}
              className="w-4 h-4 rounded border-gray-300 text-chattix-primary cursor-pointer"
            />
            <span className="text-sm text-gray-900 font-medium">Announcement Mode (only admins can send messages)</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="inviteCodeEnabled"
              checked={formData.inviteCodeEnabled}
              onChange={handleInputChange}
              className="w-4 h-4 rounded border-gray-300 text-chattix-primary cursor-pointer"
            />
            <span className="text-sm text-gray-900 font-medium">Enable Invite Link</span>
          </label>
        </div>

        {/* Danger Zone */}
        <div className="pt-4 border-t border-gray-200 space-y-3">
          <h3 className="text-sm font-semibold text-red-600">Danger Zone</h3>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
          >
            <Trash2 size={16} />
            Delete Group
          </button>
        </div>
      </div>

      {/* Footer - Save Button */}
      <div className="p-4 border-t border-gray-100 shrink-0 bg-gray-50">
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-chattix-primary text-white rounded-lg hover:bg-chattix-secondary transition-colors font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save size={18} />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 flex items-end z-50"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="w-full bg-white rounded-t-2xl p-6 safe-bottom"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Group?</h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. All messages and files will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteGroup}
                disabled={loading}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors disabled:opacity-60"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default GroupSettings;
