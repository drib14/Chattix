import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Search, MessageCircle, UserMinus, Users } from 'lucide-react';
import { friendService } from '../services/friendService';
import { removeFriend } from '../redux/slices/friendSlice';
import { setSelectedChat } from '../redux/slices/chatSlice';
import { useConfirm } from '../context/ConfirmContext';
import { formatLastSeen } from '../utils/dateUtils';
import toast from 'react-hot-toast';

const DEFAULT_AVATAR =
  'https://ui-avatars.com/api/?background=3B82F6&color=fff&bold=true';

const FriendsList = () => {
  const { friends } = useSelector((state) => state.friend);
  const { onlineUsers } = useSelector((state) => state.chat);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(null);
  const dispatch = useDispatch();

  const friendList = Array.isArray(friends) ? friends : [];

  const { confirm } = useConfirm();

  const handleRemoveFriend = async (friendId) => {
    const isConfirmed = await confirm({
      title: 'Remove Friend',
      message: 'Are you sure you want to remove this friend?',
      confirmText: 'Remove',
      isDestructive: true,
    });
    if (!isConfirmed) return;

    setLoading(friendId);
    try {
      await friendService.removeFriend(friendId);
      dispatch(removeFriend(friendId));
      toast.success('Friend removed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove friend');
    } finally {
      setLoading(null);
    }
  };

  const filteredFriends = friendList.filter(
    (friend) =>
      friend.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-white overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Friends</h2>
          <span className="badge-primary">{friendList.length}</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends..."
            className="w-full pl-9 pr-3 py-2 bg-chattix-bg rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-chattix-primary/20"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {filteredFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Users size={40} className="text-gray-300 mb-4" />
            <p className="text-gray-500">No friends yet</p>
            <p className="text-xs text-gray-400 mt-1">Search users to connect</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredFriends.map((friend, index) => {
              const isOnline = onlineUsers.some((u) => {
                const uid = typeof u === 'object' && u !== null ? u.userId : u;
                return uid?.toString() === friend._id?.toString();
              });

              return (
                <motion.div
                  key={friend._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 min-w-0"
                >
                  <div className="relative shrink-0">
                    <img
                      src={
                        friend.avatar ||
                        `${DEFAULT_AVATAR}&name=${encodeURIComponent(friend.fullName || 'U')}`
                      }
                      alt={friend.fullName}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                    />
                    {isOnline ? (
                      <div className="absolute bottom-0 right-0 online-indicator" />
                    ) : (
                      <div className="absolute bottom-0 right-0 offline-indicator" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {friend.fullName}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">@{friend.username}</p>
                    <span className={`text-[10px] ${isOnline ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {isOnline ? 'Online' : (friend.lastSeen ? `Active ${formatLastSeen(friend.lastSeen)}` : 'Offline')}
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => dispatch(setSelectedChat(friend))}
                      className="p-2 rounded-full bg-chattix-primary text-white hover:bg-chattix-primary-dark transition-colors"
                      title="Message"
                    >
                      <MessageCircle size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveFriend(friend._id)}
                      disabled={loading === friend._id}
                      className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50 transition-colors"
                      title="Remove friend"
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsList;
