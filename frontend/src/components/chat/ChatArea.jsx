import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setMessages } from '../../store/chatSlice';
import MessageBubble from './MessageBubble';
import { Loader2 } from 'lucide-react';
import { useAppAuth } from '../../contexts/AuthContext';

export default function ChatArea() {
  const dispatch = useDispatch();
  const { messages, activeConversation, typingUsers } = useSelector(state => state.chat);
  const { dbUser } = useAppAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!activeConversation) return;

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('chattix_token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/messages/${activeConversation._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          dispatch(setMessages(data));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
  }, [activeConversation, dispatch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  if (!activeConversation) return null;

  // Identify who is typing
  const activeTypers = typingUsers[activeConversation._id] || [];
  const otherParticipantTyping = activeTypers.filter(id => id !== dbUser?._id).length > 0;

  return (
    <div className="flex-1 p-4 overflow-y-auto flex flex-col">
      {messages.map((msg, index) => {
        const isOwn = String(msg.senderId?._id) === String(dbUser?._id);
        const isNextMessageFromSameUser = messages[index + 1] && String(messages[index + 1].senderId?._id) === String(msg.senderId?._id);

        return (
          <MessageBubble
            key={msg._id}
            message={msg}
            isOwn={isOwn}
            showAvatar={!isOwn && !isNextMessageFromSameUser}
            isConsecutive={isNextMessageFromSameUser}
          />
        );
      })}

      {otherParticipantTyping && (
        <div className="flex items-center gap-2 text-gray-400 text-sm italic ml-10">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>typing...</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
