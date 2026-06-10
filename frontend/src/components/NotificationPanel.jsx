import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, CheckCheck, Loader } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import {
  setNotifications,
  setUnreadCount,
  markNotificationRead,
  markAllRead,
  setLoading,
} from '../redux/slices/notificationSlice';
import toast from 'react-hot-toast';

const NotificationPanel = () => {
  const { notifications, unreadCount, loading } = useSelector((state) => state.notification);
  const dispatch = useDispatch();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    dispatch(setLoading(true));
    try {
      const [list, count] = await Promise.all([
        notificationService.getAll(),
        notificationService.getUnreadCount(),
      ]);
      dispatch(setNotifications(list));
      dispatch(setUnreadCount(count));
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      dispatch(markNotificationRead(id));
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllAsRead();
      dispatch(markAllRead());
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const allowedTypes = ['story_interaction', 'friend_request', 'friend_accepted', 'story_creation', 'story_tagged'];

  const filteredList = (Array.isArray(notifications) ? notifications : []).filter(n => {
    if (allowedTypes.includes(n.type)) return true;
    if (n.type === 'message' && n.data?.systemMessageType === 'story_reply') return true;
    return false;
  });

  const list = filteredList;

  return (
    <div className="flex flex-col h-full min-h-0 bg-white overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between gap-2 shrink-0 min-w-0">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900 truncate">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-500">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            className="text-xs text-chattix-primary font-medium flex items-center gap-1 shrink-0 whitespace-nowrap"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin text-chattix-primary" size={24} />
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Bell size={40} className="text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {list.map((n) => (
              <button
                key={n._id}
                type="button"
                onClick={() => !n.read && handleMarkRead(n._id)}
                className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 transition-colors min-w-0 ${
                  !n.read ? 'bg-chattix-primary/5' : ''
                }`}
              >
                <p className="text-sm font-semibold text-gray-900 break-words">{n.title}</p>
                <p className="text-xs text-gray-600 mt-0.5 break-words">{n.body}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
