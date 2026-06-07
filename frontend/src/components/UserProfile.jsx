import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X, Mail, Calendar, Shield, Users, Ban, Image as ImageIcon } from 'lucide-react';
import { friendService } from '../services/friendService';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';

const DEFAULT_AVATAR =
  'https://ui-avatars.com/api/?background=3B82F6&color=fff&bold=true';

const WALLPAPERS = [
  { name: 'Default', value: '' },
  { name: 'Abstract Blue', value: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=800&q=80' },
  { name: 'Dark Pattern', value: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80' },
  { name: 'Nature', value: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&q=80' },
];

const UserProfile = ({ user, onClose }) => {
  const { onlineUsers } = useSelector((state) => state.chat);
  const [mutualFriends, setMutualFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wallpaper, setWallpaper] = useState('');

  const isOnline = onlineUsers.some((uid) => uid?.toString() === user?._id?.toString());

  useEffect(() => {
    if (user?._id && !user?.isGroup) {
      friendService.getMutualFriends(user._id).then(setMutualFriends).catch(() => setMutualFriends([]));
      userService.getChatWallpaper(user._id).then(res => setWallpaper(res.wallpaper === 'custom' ? res.customUrl : res.wallpaper)).catch(() => setWallpaper(''));
    }
  }, [user?._id, user?.isGroup]);

  const handleSetWallpaper = async (val) => {
    setWallpaper(val);
    try {
      await userService.setChatWallpaper(user._id, 'custom', 'user', val);
      toast.success('Wallpaper updated');
    } catch {
      toast.error('Failed to update wallpaper');
    }
  };

  const handleBlock = async () => {
    if (!window.confirm(`Block ${user.fullName}?`)) return;
    setLoading(true);
    try {
      await userService.blockUser(user._id);
      toast.success('User blocked');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to block');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const displayName = user.fullName || user.groupName;
  const avatar = user.avatar || user.groupAvatar ||
    `${DEFAULT_AVATAR}&name=${encodeURIComponent(displayName || 'U')}`;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden min-h-0">
      <div className="relative bg-chattix-secondary h-24 sm:h-28 shrink-0">
        {onClose && (
          <button type="button" onClick={onClose} className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 rounded-full bg-white/20 text-white z-10">
            <X size={18} />
          </button>
        )}
        <div className="absolute -bottom-8 sm:-bottom-10 left-1/2 -translate-x-1/2">
          <img src={avatar} alt={displayName} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-white" />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <div className="mt-10 sm:mt-12 px-4 sm:px-6 text-center">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate px-2">{displayName}</h2>
        {!user.isGroup && <p className="text-sm text-gray-500 truncate">@{user.username}</p>}
        {user.statusMessage && <p className="text-xs text-gray-600 mt-1 italic break-words px-2">{user.statusMessage}</p>}
        <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-medium max-w-full truncate ${isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          {isOnline ? 'Online' : user.lastSeen ? `Last seen ${new Date(user.lastSeen).toLocaleDateString()}` : 'Offline'}
        </span>
      </div>

      <div className="px-4 sm:px-6 mt-4 sm:mt-6 space-y-3 sm:space-y-4 pb-6 safe-bottom">
        {user.bio && (
          <div className="modern-card !p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">About</h3>
            <p className="text-sm text-gray-700">{user.bio}</p>
          </div>
        )}

        {user.email && (
          <div className="flex items-start gap-3 text-sm text-gray-600 min-w-0">
            <Mail size={16} className="text-gray-400 shrink-0 mt-0.5" />
            <span className="break-all">{user.email}</span>
          </div>
        )}

        {user.createdAt && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Calendar size={16} className="text-gray-400" />
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </div>
        )}

        {!user.isGroup && mutualFriends.length > 0 && (
          <div className="modern-card !p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1">
              <Users size={14} /> Mutual Friends ({mutualFriends.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {mutualFriends.slice(0, 6).map((f) => (
                <span key={f._id} className="text-xs bg-gray-100 px-2 py-1 rounded-full">{f.fullName}</span>
              ))}
            </div>
          </div>
        )}

        <div className="modern-card !p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3 flex items-center gap-1">
            <ImageIcon size={14} /> Chat Wallpaper
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {WALLPAPERS.map((wp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSetWallpaper(wp.value)}
                className={`relative h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  wallpaper === wp.value ? 'border-chattix-primary' : 'border-transparent'
                }`}
              >
                {wp.value ? (
                  <img src={wp.value} alt={wp.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xs text-gray-500 font-medium">Default</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 flex items-end p-1.5 opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-white font-medium truncate">{wp.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {!user.isGroup && (
          <div className="space-y-2 pt-2">
            <button type="button" onClick={handleBlock} disabled={loading} className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 flex items-center justify-center gap-2 disabled:opacity-50">
              <Ban size={16} /> Block User
            </button>
            <button type="button" className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
              <Shield size={16} /> Report User
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default UserProfile;
