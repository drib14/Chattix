import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import { setMessages } from '../../store/chatSlice';
import MessageBubble from './MessageBubble';
import { Loader2 } from 'lucide-react';

export default function ChatArea() {
  const dispatch = useDispatch();
  const { getToken, userId } = useAuth();
  const { messages, activeConversation, typingUsers } = useSelector(state => state.chat);
  const { dbUser } = require('../../contexts/AuthContext').useAppAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!activeConversation) return;

    const fetchMessages = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${import.meta.env.VITE_API_URL}/messages/${activeConversation._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        dispatch(setMessages(data));
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
  }, [activeConversation, getToken, dispatch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  if (!activeConversation) return null;

  // Identify who is typing
  const activeTypers = typingUsers[activeConversation._id] || [];
  const otherParticipantTyping = activeTypers.filter(id => id !== dbUser?._id).length > 0;

  return (
    <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-2">
      {messages.map(msg => (
        <MessageBubble
          key={msg._id}
          message={msg}
          isOwn={msg.senderId?._id === dbUser?._id}
        />
      ))}

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
