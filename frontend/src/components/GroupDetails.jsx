import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Settings,
  Users,
  Image,
  FileText,
  Link2,
  Copy,
  RefreshCw,
  Trash2,
  LogOut,
  Camera,
  Search,
  ChevronRight,
} from 'lucide-react';
import { groupService } from '../services/groupService';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=3B82F6&color=fff&bold=true';

const WALLPAPERS = [
  { name: 'Default', value: '' },
  { name: 'Abstract Blue', value: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=800&q=80' },
  { name: 'Dark Pattern', value: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80' },
  { name: 'Nature', value: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&q=80' },
];

const GroupDetails = ({ group, onClose, onSettingsClick }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState('info');
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [media, setMedia] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState(group?.inviteCode || '');
  const [wallpaper, setWallpaper] = useState('');

  const isAdmin = group?.admin?._id === user?._id;
  const isMember = group?.members?.some(m => m._id === user?._id);

  useEffect(() => {
    if (activeTab === 'members' && !members.length) {
      loadMembers();
    }
    if (activeTab === 'media' && !media.length) {
      loadMedia();
    }
    if (activeTab === 'files' && !files.length) {
      loadFiles();
    }
  }, [activeTab]);

  useEffect(() => {
    if (group?._id) {
      userService.getChatWallpaper(group._id).then(res => setWallpaper(res.wallpaper === 'custom' ? res.customUrl : res.wallpaper)).catch(() => setWallpaper(''));
    }
  }, [group?._id]);

  const handleSetWallpaper = async (val) => {
    setWallpaper(val);
    try {
      await userService.setChatWallpaper(group._id, 'custom', 'group', val);
      toast.success('Wallpaper updated');
    } catch {
      toast.error('Failed to update wallpaper');
    }
  };

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await groupService.getGroupMembers(group._id, searchQuery);
      setMembers(data.members || []);
    } catch (error) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const loadMedia = async () => {
    setLoading(true);
    try {
      const data = await groupService.getGroupMedia(group._id, 'media');
      setMedia(data.messages || []);
    } catch (error) {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await groupService.getGroupMedia(group._id, 'files');
      setFiles(data.messages || []);
    } catch (error) {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/groups/join/${inviteCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied!');
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Leave this group?')) return;
    try {
      await groupService.leaveGroup(group._id);
      toast.success('Left group');
      onClose?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave group');
    }
  };

  const tabClasses = (tab) =>
    `flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-all ${
      activeTab === tab
        ? 'bg-chattix-primary text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-chattix-primary to-chattix-secondary h-32 shrink-0">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors z-10"
          >
            <X size={20} />
          </button>
        )}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
          <img
            src={group?.groupAvatar || `${DEFAULT_AVATAR}&name=${encodeURIComponent(group?.groupName || 'G')}`}
            alt={group?.groupName}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-lg"
          />
        </div>
      </div>

      {/* Info Section */}
      <div className="px-4 sm:px-6 mt-12 pb-4 border-b border-gray-100 text-center">
        <h2 className="text-xl font-bold text-gray-900">{group?.groupName}</h2>
        <p className="text-sm text-gray-600 mt-1">{group?.members?.length || 0} members</p>
        {group?.description && (
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{group.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-4 border-b border-gray-100 shrink-0">
        <button type="button" onClick={() => setActiveTab('info')} className={tabClasses('info')}>
          <Users size={16} className="inline mr-2" />
          Info
        </button>
        <button type="button" onClick={() => setActiveTab('members')} className={tabClasses('members')}>
          <Users size={16} className="inline mr-2" />
          Members
        </button>
        <button type="button" onClick={() => setActiveTab('media')} className={tabClasses('media')}>
          <Image size={16} className="inline mr-2" />
          Media
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4">
        <AnimatePresence mode="wait">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Group Rules */}
              {group?.groupRules && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-sm text-gray-900 mb-2">Group Rules</h3>
                  <p className="text-sm text-gray-700">{group.groupRules}</p>
                </div>
              )}

              {/* Creation Date */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Created</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(group?.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Admin Info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Group Creator
                </h4>
                <div className="flex items-center gap-3">
                  <img
                    src={group?.admin?.avatar || DEFAULT_AVATAR}
                    alt={group?.admin?.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900">{group?.admin?.fullName}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        Admin
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">@{group?.admin?.username}</p>
                  </div>
                </div>
              </div>

                      {/* Announcement Mode */}
              {group?.announcementMode && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-amber-900 mb-2">Announcement Mode</h4>
                  <p className="text-sm text-amber-700">
                    Only group admins can send messages while announcement mode is enabled.
                  </p>
                </div>
              )}

              {/* Pinned Message */}
              {group?.pinnedMessage?.text && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Pinned message</h4>
                  <p className="text-sm text-gray-700 font-medium">{group.pinnedMessage.sender?.fullName || 'Unknown user'}</p>
                  <p className="mt-1 text-sm text-gray-600 break-words whitespace-pre-wrap">
                    {group.pinnedMessage.text}
                  </p>
                </div>
              )}

              {/* Invite Link */}
              {isAdmin && (
                <div className="p-4 bg-chattix-primary/5 border border-chattix-primary/20 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Link2 size={16} /> Invite Link
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/groups/join/${inviteCode}`}
                      className="flex-1 text-xs bg-white border border-gray-200 rounded px-2 py-1 truncate"
                    />
                    <button
                      type="button"
                      onClick={copyInviteLink}
                      className="p-2 bg-chattix-primary text-white rounded hover:bg-chattix-secondary transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Wallpaper */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Image size={16} /> Chat Wallpaper
                </h4>
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
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-600 font-medium">Default</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-end p-1.5 opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-white font-medium truncate">{wp.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-2 border-t border-gray-100">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={onSettingsClick}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-chattix-primary text-white rounded-lg hover:bg-chattix-secondary transition-colors font-medium text-sm"
                  >
                    <Settings size={16} />
                    Group Settings
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLeaveGroup}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
                >
                  <LogOut size={16} />
                  Leave Group
                </button>
              </div>
            </motion.div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <motion.div
              key="members"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => loadMembers()}
                  placeholder="Search members..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-chattix-primary/30"
                />
              </div>

              {/* Members List */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-chattix-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No members found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => {
                    const adminId = group.admin?._id || group.admin;
                    const memberId = member?._id || member;
                    const isOwner = adminId && memberId && adminId.toString() === memberId.toString();
                    const isAdminMember = group.admins?.some(a => {
                      const aId = a?._id || a;
                      return aId && memberId && aId.toString() === memberId.toString();
                    });
                    return (
                      <motion.div
                        key={member._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={member.avatar || DEFAULT_AVATAR}
                            alt={member.fullName}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{member.fullName}</p>
                            <p className="text-xs text-gray-500 truncate">@{member.username}</p>
                            {(isOwner || isAdminMember) && (
                              <span className="inline-flex items-center mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                        {isAdmin && !isOwner && (
                          <button type="button" className="p-1 hover:bg-white rounded transition-colors">
                            <ChevronRight size={18} className="text-gray-400" />
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <motion.div
              key="media"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-chattix-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : media.length === 0 ? (
                <div className="text-center py-8">
                  <Image size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No media shared</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {media.map((msg) =>
                    msg.attachments?.map((att) => (
                      <img
                        key={att.url}
                        src={att.url}
                        alt="shared media"
                        className="w-full h-24 rounded-lg object-cover cursor-pointer hover:opacity-80"
                      />
                    ))
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GroupDetails;
