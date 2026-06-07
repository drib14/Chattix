import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Check,
  X,
  UserPlus,
  Users,
  Inbox,
  Loader,
  SendIcon,
  CheckCircle,
  MessageCircle,
  Zap,
} from 'lucide-react';
import { friendService } from '../services/friendService';
import { userService } from '../services/userService';
import {
  addFriend,
  addSentRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removePendingRequest,
} from '../redux/slices/friendSlice';
import toast from 'react-hot-toast';

const DEFAULT_AVATAR =
  'https://ui-avatars.com/api/?background=3B82F6&color=fff&bold=true';

const FriendRequests = () => {
  const { user } = useSelector((state) => state.auth);
  const { onlineUsers } = useSelector((state) => state.chat);
  const { pendingRequests, sentRequests, friends } = useSelector((state) => state.friend);
  const [activeTab, setActiveTab] = useState('find');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const [recentlySentIds, setRecentlySentIds] = useState({});
  const dispatch = useDispatch();

  const pending = Array.isArray(pendingRequests) ? pendingRequests : [];
  const sent = Array.isArray(sentRequests) ? sentRequests : [];
  const friendList = Array.isArray(friends) ? friends : [];

  const sentIds = useMemo(
    () => new Set(sent.map((request) => request._id?.toString()).filter(Boolean)),
    [sent]
  );

  const pendingIds = useMemo(
    () => new Set(pending.map((request) => request._id?.toString()).filter(Boolean)),
    [pending]
  );

  const friendIds = useMemo(
    () => new Set(friendList.map((friend) => friend._id?.toString()).filter(Boolean)),
    [friendList]
  );

  const currentUserId = user?._id?.toString();

  const isUserOnline = (userId) => {
    return onlineUsers.some((uid) => uid?.toString() === userId?.toString());
  };

  const filteredSearchResults = useMemo(() => {
    return (searchResults || []).filter((candidate) => {
      const id = candidate._id?.toString();
      if (!id || id === currentUserId) return false;
      if (friendIds.has(id)) return false;
      if (pendingIds.has(id)) return false;
      if (sentIds.has(id) && !recentlySentIds[id]) return false;
      return true;
    });
  }, [searchResults, currentUserId, friendIds, pendingIds, sentIds, recentlySentIds]);

  useEffect(() => {
    let active = true;
    const query = searchQuery.trim();

    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return () => {
        active = false;
      };
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const results = await userService.searchUsers(query);
        if (!active) return;
        setSearchResults(results || []);
      } catch (error) {
        if (!active) return;
        setSearchResults([]);
      } finally {
        if (active) setIsSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [searchQuery]);

  const handleSendRequest = async (userToRequest) => {
    if (!userToRequest?._id) return;
    setLoadingId(userToRequest._id);
    try {
      await friendService.sendFriendRequest(userToRequest._id);
      dispatch(addSentRequest(userToRequest));
      setRecentlySentIds((prev) => ({ ...prev, [userToRequest._id]: true }));
      toast.success('Friend request sent', {
        icon: '✈️',
        style: {
          borderRadius: '12px',
          background: '#fff',
          color: '#000',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send friend request');
    } finally {
      setLoadingId(null);
    }
  };

  const handleAccept = async (requestId) => {
    setLoadingId(requestId);
    try {
      const response = await friendService.acceptFriendRequest(requestId);
      dispatch(acceptFriendRequest(requestId));
      dispatch(removePendingRequest(requestId));
      if (response.friend) dispatch(addFriend(response.friend));
      toast.success('Friend request accepted! 🎉', {
        style: {
          borderRadius: '12px',
          background: '#fff',
          color: '#000',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept request');
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setLoadingId(requestId);
    try {
      await friendService.rejectFriendRequest(requestId);
      dispatch(rejectFriendRequest(requestId));
      toast.success('Request declined', {
        style: {
          borderRadius: '12px',
          background: '#fff',
          color: '#000',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setLoadingId(null);
    }
  };

  const UserStatusBadge = ({ isOnline }) => (
    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
  );

  const UserCard = ({ user: candidate, onAction, actionType = 'send', isLoading = false, isDisabled = false }) => {
    const id = candidate._id?.toString();
    const online = isUserOnline(id);

    let actionLabel = '';
    let actionIcon = null;
    let actionClasses = '';

    if (actionType === 'send') {
      const hasSent = recentlySentIds[id];
      actionLabel = isLoading ? 'Sending...' : hasSent ? 'Request Sent' : 'Add Friend';
      actionIcon = hasSent ? CheckCircle : UserPlus;
      actionClasses = hasSent
        ? 'bg-gray-100 text-gray-500 border-gray-200'
        : 'bg-chattix-primary text-white hover:bg-chattix-secondary';
    } else if (actionType === 'accept') {
      actionLabel = isLoading ? 'Accepting...' : 'Accept';
      actionIcon = Check;
      actionClasses = 'bg-emerald-500 text-white hover:bg-emerald-600';
    } else if (actionType === 'reject') {
      actionLabel = isLoading ? 'Rejecting...' : 'Reject';
      actionIcon = X;
      actionClasses = 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50';
    }

    const ActionIcon = actionIcon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="relative flex items-center justify-between gap-3 p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            <img
              src={
                candidate.avatar ||
                `${DEFAULT_AVATAR}&name=${encodeURIComponent(candidate.fullName || 'U')}`
              }
              alt={candidate.fullName}
              className="w-12 h-12 rounded-xl object-cover"
            />
            <UserStatusBadge isOnline={online} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 truncate text-sm">{candidate.fullName}</p>
            <p className="text-xs text-gray-500 truncate">@{candidate.username}</p>
            {candidate.status && (
              <p className="text-xs text-gray-400 truncate mt-0.5">{candidate.status}</p>
            )}
          </div>
        </div>

        {actionType === 'send' ? (
          <button
            type="button"
            onClick={() => onAction(candidate)}
            disabled={isLoading || isDisabled || recentlySentIds[id]}
            className={`inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors shrink-0 ${actionClasses} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <ActionIcon size={14} />
            <span className="hidden sm:inline">{actionLabel}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onAction(candidate._id, 'accept')}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-1 rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60"
            >
              <Check size={14} />
              <span className="hidden sm:inline">Accept</span>
            </button>
            <button
              type="button"
              onClick={() => onAction(candidate._id, 'reject')}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              <X size={14} />
              <span className="hidden sm:inline">Reject</span>
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  const tabClasses = (tab) =>
    `flex-1 py-3 px-4 text-sm font-semibold rounded-full transition-all ${
      activeTab === tab
        ? 'bg-chattix-primary text-white shadow-md'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;

  return (
    <div className="flex flex-col h-full min-h-0 bg-white overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100 shrink-0 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-chattix-primary/80 font-bold">
              Connection Hub
            </p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Find & Manage</h1>
            <p className="text-sm text-gray-600 mt-1">Discover people and manage friend requests</p>
          </div>
          {pending.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-3 py-1.5"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-red-600">{pending.length} pending</span>
            </motion.div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('find')}
            className={tabClasses('find')}
          >
            <div className="flex items-center justify-center gap-2">
              <UserPlus size={16} />
              <span>Find People</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`${tabClasses('pending')} relative`}
          >
            <div className="flex items-center justify-center gap-2">
              <Inbox size={16} />
              <span>Requests</span>
              {pending.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pending.length > 9 ? '9+' : pending.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Search Bar - Only show on Find People tab */}
        {activeTab === 'find' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, username or email..."
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-chattix-primary/30 focus:border-transparent transition-all"
            />
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-5">
        <AnimatePresence mode="wait">
          {activeTab === 'find' ? (
            <motion.div
              key="find-people"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {searchQuery.trim() === '' ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-dashed border-gray-200 bg-gradient-to-br from-chattix-primary/5 to-blue-50 p-8 text-center mt-8"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-chattix-primary/10 rounded-2xl mb-4">
                    <UserPlus size={32} className="text-chattix-primary" />
                  </div>
                  <p className="text-gray-700 text-sm font-medium mb-1">Find Your Next Friend</p>
                  <p className="text-gray-600 text-xs leading-relaxed max-w-xs mx-auto">
                    Search for people by their name, username, or email to send friend requests
                  </p>
                </motion.div>
              ) : isSearching ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center py-12"
                >
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-chattix-primary/10 rounded-full mb-3">
                      <Loader size={24} className="text-chattix-primary animate-spin" />
                    </div>
                    <p className="text-gray-600 text-sm font-medium">Searching people...</p>
                  </div>
                </motion.div>
              ) : filteredSearchResults.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200/50 rounded-2xl mb-4">
                    <Users size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-700 text-sm font-medium mb-1">No users found</p>
                  <p className="text-gray-600 text-xs">
                    Try searching with different keywords
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.1em] pl-2">
                    {filteredSearchResults.length} Result{filteredSearchResults.length !== 1 ? 's' : ''}
                  </p>
                  {filteredSearchResults.map((candidate, index) => (
                    <UserCard
                      key={candidate._id}
                      user={candidate}
                      onAction={() => handleSendRequest(candidate)}
                      actionType="send"
                      isLoading={loadingId === candidate._id}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="pending-requests"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {pending.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-dashed border-gray-200 bg-gradient-to-br from-chattix-primary/5 to-blue-50 p-8 text-center mt-8"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-chattix-primary/10 rounded-2xl mb-4">
                    <Inbox size={32} className="text-chattix-primary" />
                  </div>
                  <p className="text-gray-700 text-sm font-medium mb-1">All Caught Up!</p>
                  <p className="text-gray-600 text-xs leading-relaxed max-w-xs mx-auto">
                    No pending friend requests right now. Check back later!
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.1em] pl-2">
                    {pending.length} Request{pending.length !== 1 ? 's' : ''}
                  </p>
                  {pending.map((request, index) => (
                    <motion.div
                      key={request._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative flex items-center justify-between gap-3 p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          <img
                            src={
                              request.avatar ||
                              `${DEFAULT_AVATAR}&name=${encodeURIComponent(request.fullName || 'U')}`
                            }
                            alt={request.fullName}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                          <UserStatusBadge isOnline={isUserOnline(request._id)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate text-sm">{request.fullName}</p>
                          <p className="text-xs text-gray-500 truncate">@{request.username}</p>
                          {request.status && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{request.status}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAccept(request._id)}
                          disabled={loadingId === request._id}
                          className="inline-flex items-center justify-center gap-1 rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          title="Accept request"
                        >
                          <Check size={14} />
                          <span className="hidden sm:inline">
                            {loadingId === request._id ? 'Accepting...' : 'Accept'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(request._id)}
                          disabled={loadingId === request._id}
                          className="inline-flex items-center justify-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          title="Reject request"
                        >
                          <X size={14} />
                          <span className="hidden sm:inline">
                            {loadingId === request._id ? 'Rejecting...' : 'Reject'}
                          </span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FriendRequests;
