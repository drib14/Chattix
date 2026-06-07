import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  X,
  Search,
  Trash2,
  UserX,
  ArrowRight,
  Loader,
} from 'lucide-react';
import { groupService } from '../services/groupService';
import { useConfirm } from '../context/ConfirmContext';
import toast from 'react-hot-toast';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=3B82F6&color=fff&bold=true';

const MemberManagement = ({ group, onClose, onUpdate }) => {
  const { user } = useSelector((state) => state.auth);

  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);

  const isAdmin = group?.admin?._id === user?._id;

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      loadMembers(searchQuery);
    } else {
      loadMembers();
    }
  }, [searchQuery]);

  const loadMembers = async (search = '') => {
    setLoading(true);
    try {
      const data = await groupService.getGroupMembers(group._id, search);
      setMembers(data.members || []);
    } catch (error) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const { confirm } = useConfirm();

  const handleRemoveMember = async (memberId) => {
    const isConfirmed = await confirm({
      title: 'Remove Member',
      message: 'Are you sure you want to remove this member from the group?',
      confirmText: 'Remove',
      isDestructive: true,
    });
    if (!isConfirmed) return;
    setActionLoading(memberId);
    try {
      await groupService.removeMember(group._id, memberId);
      setMembers((prev) => prev.filter((m) => m._id !== memberId));
      toast.success('Member removed');
      setShowActionMenu(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromoteAdmin = async (memberId) => {
    setActionLoading(memberId);
    try {
      const updatedGroup = await groupService.promoteToAdmin(group._id, memberId);
      setMembers((prev) =>
        prev.map((m) =>
          m._id === memberId
            ? { ...m, isAdmin: true }
            : m
        )
      );
      toast.success('Member promoted to admin');
      onUpdate?.(updatedGroup);
      setShowActionMenu(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to promote member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemoteAdmin = async (memberId) => {
    const isConfirmed = await confirm({
      title: 'Demote Admin',
      message: 'Are you sure you want to demote this admin?',
      confirmText: 'Demote',
      isDestructive: true,
    });
    if (!isConfirmed) return;
    setActionLoading(memberId);
    try {
      const updatedGroup = await groupService.demoteAdmin(group._id, memberId);
      setMembers((prev) =>
        prev.map((m) =>
          m._id === memberId
            ? { ...m, isAdmin: false }
            : m
        )
      );
      toast.success('Admin demoted to member');
      onUpdate?.(updatedGroup);
      setShowActionMenu(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to demote admin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTransferAdmin = async (memberId) => {
    const isConfirmed = await confirm({
      title: 'Transfer Admin Role',
      message: 'Transfer admin role to this member? You will become a regular admin.',
      confirmText: 'Transfer',
    });
    if (!isConfirmed) return;
    setActionLoading(memberId);
    try {
      const updatedGroup = await groupService.transferAdmin(group._id, memberId);
      toast.success('Admin role transferred');
      onUpdate?.(updatedGroup);
      onClose?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to transfer admin');
    } finally {
      setActionLoading(null);
    }
  };

  const isOwner = member => {
    const adminId = group.admin?._id || group.admin;
    const memberId = member?._id || member;
    return adminId && memberId && adminId.toString() === memberId.toString();
  };
  const isAdminMember = member => {
    const memberId = member?._id || member;
    return group.admins?.some(a => {
      const adminId = a?._id || a;
      return adminId && memberId && adminId.toString() === memberId.toString();
    });
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
        <h2 className="text-lg font-bold text-gray-900">Manage Members</h2>
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

      {/* Search */}
      <div className="p-4 border-b border-gray-100 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-chattix-primary/30"
          />
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-6 h-6 text-chattix-primary animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No members found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <motion.div
                key={member._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={member.avatar || DEFAULT_AVATAR}
                    alt={member.fullName}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{member.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">@{member.username}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {(isOwner(member) || isAdminMember(member)) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Menu */}
                {isAdmin && !isOwner(member) && member._id !== user._id && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowActionMenu(showActionMenu === member._id ? null : member._id)}
                      className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white rounded-lg"
                    >
                      <div className="w-1 h-1 bg-gray-400 rounded-full relative">
                        <div className="absolute top-0 left-2 w-1 h-1 bg-gray-400 rounded-full" />
                        <div className="absolute top-0 left-4 w-1 h-1 bg-gray-400 rounded-full" />
                      </div>
                    </button>

                    {/* Dropdown Menu */}
                    {showActionMenu === member._id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-max"
                      >
                        {!isAdminMember(member) ? (
                          <button
                            type="button"
                            onClick={() => handlePromoteAdmin(member._id)}
                            disabled={actionLoading === member._id}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 disabled:opacity-60"
                          >
                            <Shield size={16} className="text-blue-600" />
                            Make Admin
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDemoteAdmin(member._id)}
                            disabled={actionLoading === member._id}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 disabled:opacity-60"
                          >
                            <UserX size={16} className="text-orange-600" />
                            Demote Admin
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member._id)}
                          disabled={actionLoading === member._id}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100 disabled:opacity-60"
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Transfer Admin (shown for non-owner admins) */}
                {isOwner(member) && isAdmin && user._id !== member._id && (
                  <button
                    type="button"
                    onClick={() => handleTransferAdmin(member._id)}
                    disabled={actionLoading === member._id}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-chattix-primary text-white rounded hover:bg-chattix-secondary transition-colors disabled:opacity-60"
                    title="Transfer owner role to this member"
                  >
                    <ArrowRight size={12} />
                    Transfer
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberManagement;
