import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Check, X, Loader, UserCheck } from 'lucide-react';
import { friendService } from '../services/friendService';
import { userService } from '../services/userService';
import {
  addSentRequest,
  addFriend,
  acceptFriendRequest,
  cancelSentRequest,
} from '../redux/slices/friendSlice';
import toast from 'react-hot-toast';

const DEFAULT_AVATAR =
  'https://ui-avatars.com/api/?background=3B82F6&color=fff&bold=true';

const UserSearch = () => {
  const { friends, sentRequests, pendingRequests } = useSelector((state) => state.friend);
  const { onlineUsers } = useSelector((state) => state.chat);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const dispatch = useDispatch();

  const searchUsers = useCallback(async (query) => {
    if (query.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const results = await userService.searchUsers(query.trim());
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  const getFriendshipStatus = (userId) => {
    const id = userId?.toString();
    if (friends.some((f) => f._id?.toString() === id)) return 'friends';
    if (sentRequests.some((r) => r._id?.toString() === id)) return 'sent';
    if (pendingRequests.some((r) => r._id?.toString() === id)) return 'pending';
    return 'none';
  };

  const handleSendRequest = async (selectedUser) => {
    setActionLoading(selectedUser._id);
    try {
      await friendService.sendFriendRequest(selectedUser._id);
      dispatch(addSentRequest(selectedUser));
      toast.success('Friend request sent!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async (selectedUser) => {
    setActionLoading(selectedUser._id);
    try {
      const response = await friendService.acceptFriendRequest(selectedUser._id);
      dispatch(acceptFriendRequest(selectedUser._id));
      if (response.friend) dispatch(addFriend(response.friend));
      toast.success('Friend request accepted!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (selectedUser) => {
    setActionLoading(selectedUser._id);
    try {
      await friendService.cancelSentRequest(selectedUser._id);
      dispatch(cancelSentRequest(selectedUser._id));
      toast.success('Request cancelled');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel');
    } finally {
      setActionLoading(null);
    }
  };

  const renderAction = (user, status) => {
    const busy = actionLoading === user._id;

    if (status === 'friends') {
      return (
        <span className="badge-success flex items-center gap-1">
          <UserCheck size={12} />
          Friends
        </span>
      );
    }
    if (status === 'sent') {
      return (
        <button
          type="button"
          onClick={() => handleCancel(user)}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
        >
          {busy ? <Loader size={14} className="animate-spin" /> : 'Cancel'}
        </button>
      );
    }
    if (status === 'pending') {
      return (
        <button
          type="button"
          onClick={() => handleAccept(user)}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-chattix-primary text-white hover:bg-chattix-primary-dark disabled:opacity-50 flex items-center gap-1"
        >
          {busy ? <Loader size={14} className="animate-spin" /> : (
            <>
              <Check size={14} />
              Accept
            </>
          )}
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => handleSendRequest(user)}
        disabled={busy}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-chattix-primary text-white hover:bg-chattix-primary-dark disabled:opacity-50 flex items-center gap-1"
      >
        {busy ? (
          <Loader size={14} className="animate-spin" />
        ) : (
          <>
            <UserPlus size={14} />
            Add
          </>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-100 shrink-0">
        <h2 className="text-lg font-bold text-gray-900 mb-2 sm:mb-3">Find People</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search username, name or email..."
            className="w-full pl-9 pr-9 py-2 sm:py-2.5 bg-chattix-bg rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-chattix-primary/20"
            autoFocus
          />
          {loading && (
            <Loader
              className="absolute right-3 top-1/2 -translate-y-1/2 text-chattix-primary animate-spin"
              size={16}
            />
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <AnimatePresence>
          {!searchQuery.trim() ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Search size={40} className="text-gray-300 mb-4" />
              <p className="text-gray-500">Search for users on Chattix</p>
              <p className="text-xs text-gray-400 mt-1">Try username, name or email</p>
            </div>
          ) : searchResults.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <X size={40} className="text-gray-300 mb-4" />
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {searchResults.map((user, index) => {
                const status = getFriendshipStatus(user._id);
                const isOnline = onlineUsers.some(
                  (uid) => uid?.toString() === user._id?.toString()
                );

                return (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 min-w-0"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={
                          user.avatar ||
                          `${DEFAULT_AVATAR}&name=${encodeURIComponent(user.fullName || 'U')}`
                        }
                        alt={user.fullName}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                      />
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 online-indicator" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {user.fullName}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                      {user.email && (
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      )}
                    </div>
                    <div className="shrink-0">{renderAction(user, status)}</div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UserSearch;
