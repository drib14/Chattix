import { useState, useEffect } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Search, Users, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import useGroupModalStore from '../../store/groupModalStore';

const CreateGroupModal = () => {
  const { user } = useAuthStore();
  const { chats, setChats, setSelectedChat } = useChatStore();
  const { isOpen, closeModal } = useGroupModalStore();

  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setGroupName('');
      setSearchTerm('');
      setSearchResults([]);
      setSelectedUsers([]);
    }
  }, [isOpen]);

  const handleSearch = async (val: string) => {
    setSearchTerm(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        withCredentials: true,
      };
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/users?search=${val}`,
        config
      );
      setSearchResults(data);
    } catch (error) {
      toast.error('Error searching users');
    } finally {
      setSearching(false);
    }
  };

  const toggleUser = (u: any) => {
    if (selectedUsers.some((sel) => sel._id === u._id)) {
      setSelectedUsers(selectedUsers.filter((sel) => sel._id !== u._id));
    } else {
      setSelectedUsers([...selectedUsers, u]);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    if (selectedUsers.length < 2) {
      toast.error('Please select at least 2 users to create a group');
      return;
    }

    setLoading(true);
    try {
      const config = {
        headers: {
          'Content-type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        withCredentials: true,
      };

      const userIds = selectedUsers.map((u) => u._id);
      
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/conversations/group`,
        {
          name: groupName,
          users: JSON.stringify(userIds),
        },
        config
      );

      setChats([data, ...chats]);
      setSelectedChat(data);
      toast.success(`Group "${groupName}" created successfully!`);
      closeModal();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-lg bg-neutral-900/90 border border-neutral-800 backdrop-blur-2xl rounded-3xl p-6 flex flex-col max-h-[90vh] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                  <Users size={20} />
                </div>
                <h3 className="text-xl font-bold">Create Group Chat</h3>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* Group Name input */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-sm font-semibold text-neutral-300">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dream Team 2026"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-800/50 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 placeholder-neutral-500 transition-all text-sm"
                />
              </div>

              {/* Add members search */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-sm font-semibold text-neutral-300">Add Members</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-neutral-800/50 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 placeholder-neutral-500 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Selected members tags */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-neutral-800/30 rounded-2xl border border-neutral-800">
                  {selectedUsers.map((u) => (
                    <motion.div
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      key={u._id}
                      className="flex items-center space-x-1 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--color-primary)] px-2.5 py-1 rounded-full text-xs font-semibold"
                    >
                      <span>{u.username}</span>
                      <button
                        onClick={() => toggleUser(u)}
                        className="p-0.5 rounded-full hover:bg-[var(--color-primary)]/20 hover:text-white transition-all cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* User search results / recommendations */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
                  Search Results
                </h4>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {searching ? (
                    <div className="flex items-center justify-center py-6 text-sm text-neutral-500 space-x-2">
                      <div className="w-5 h-5 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Searching users...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((u) => {
                      const isSelected = selectedUsers.some((sel) => sel._id === u._id);
                      return (
                        <div
                          key={u._id}
                          onClick={() => toggleUser(u)}
                          className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)]/20'
                              : 'bg-neutral-800/20 border-transparent hover:bg-neutral-800/50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0">
                              {u.profilePic ? (
                                <img src={u.profilePic} alt="" className="w-full h-full object-cover" />
                              ) : (
                                u.username[0]
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">{u.username}</div>
                              <div className="text-xs text-neutral-400 truncate max-w-[200px]">
                                {u.email}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                                : 'border-neutral-700 bg-neutral-900/50'
                            }`}
                          >
                            {isSelected && <Check size={14} />}
                          </div>
                        </div>
                      );
                    })
                  ) : searchTerm ? (
                    <div className="text-center py-6 text-neutral-500 text-sm flex flex-col items-center justify-center space-y-1.5">
                      <AlertCircle size={20} className="text-neutral-600" />
                      <span>No users found for "{searchTerm}"</span>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-neutral-500 text-xs">
                      Type above to find friends and add them to this group.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 text-neutral-200 hover:text-white font-semibold text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={loading || selectedUsers.length < 2 || !groupName.trim()}
                className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-semibold text-sm transition-all shadow-lg shadow-[var(--color-primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Group</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateGroupModal;
