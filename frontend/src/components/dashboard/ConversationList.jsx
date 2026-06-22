import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setConversations } from '../../store/chatSlice';
import { formatDistanceToNow } from 'date-fns';
import { useAppAuth } from '../../contexts/AuthContext';

export default function ConversationList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { conversations, activeConversation } = useSelector(state => state.chat);
  const { dbUser } = useAppAuth();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('chattix_token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch conversations");
        const data = await res.json();
        if (Array.isArray(data)) {
          dispatch(setConversations(data));
        } else {
          dispatch(setConversations([]));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchConversations();
  }, [dispatch]);

  const handleSelect = (conv) => {
    navigate(`/c/${conv._id}`);
  };

  if (!Array.isArray(conversations) || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <p className="text-gray-500 text-sm">No conversations yet.<br/>Start chatting!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      {conversations.map(conv => {
        // Find the other participant
        const otherParticipant = conv.participants.find(p => String(p._id) !== String(dbUser?._id)) || conv.participants[0];
        const isActive = activeConversation?._id === conv._id;

        return (
          <div
            key={conv._id}
            onClick={() => handleSelect(conv)}
            className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
              isActive ? 'bg-chattix-teal/10 shadow-inner' : 'hover:bg-white/50'
            }`}
          >
            <div className="relative flex-shrink-0">
              <img src={otherParticipant.profileImageUrl || '/chattix-logo.png'} alt="Avatar" className="w-12 h-12 rounded-full object-cover shadow-sm" />
              {otherParticipant.isOnline && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-bold text-gray-800 truncate">{otherParticipant.firstName} {otherParticipant.lastName}</h4>
                {!otherParticipant.isOnline && otherParticipant.lastSeen && (
                  <span className="text-[10px] text-green-600 font-medium whitespace-nowrap ml-2">
                    {formatDistanceToNow(new Date(otherParticipant.lastSeen)).replace('about ', '').replace(' minutes', 'm').replace(' hours', 'h').replace(' days', 'd')}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">
                {conv.lastMessage ? (
                  conv.lastMessage.type === 'text' ? conv.lastMessage.content : `Sent a ${conv.lastMessage.type}`
                ) : (
                  "New conversation"
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
