import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeForwardModal } from '../../store/uiSlice';
import { X, Send, Loader2 } from 'lucide-react';

export default function ForwardModal() {
  const dispatch = useDispatch();
  const { isForwardModalOpen, forwardMessageId } = useSelector(state => state.ui);
  const conversations = useSelector(state => state.chat.conversations);
  const messages = useSelector(state => state.chat.messages);

  const [loadingConvId, setLoadingConvId] = useState(null);

  if (!isForwardModalOpen) return null;

  const originalMessage = messages.find(m => m._id === forwardMessageId);

  const handleForward = async (conversationId) => {
    if (!originalMessage) return;

    setLoadingConvId(conversationId);
    try {
      const token = localStorage.getItem('chattix_token');
      await fetch(`${import.meta.env.VITE_API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId,
          type: originalMessage.type,
          content: originalMessage.content,
          forwarded: true,
          linkPreview: originalMessage.linkPreview ? JSON.stringify(originalMessage.linkPreview) : null
        })
      });

      dispatch(closeForwardModal());
    } catch (error) {
      console.error("Failed to forward message", error);
    } finally {
      setLoadingConvId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-chattix-bg/80 backdrop-blur-sm">
      <div className="clay-card rounded-3xl max-w-md w-full mx-4 flex flex-col max-h-[80vh]">

        <div className="p-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-gray-800 ml-2">Forward Message</h3>
          <button onClick={() => dispatch(closeForwardModal())} className="text-gray-400 hover:text-gray-600 transition-colors p-1 clay-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {originalMessage && (
             <div className="mb-4 p-3 clay-input rounded-xl text-sm text-gray-600 line-clamp-2 italic">
               "{originalMessage.type === 'text' ? originalMessage.content : `[${originalMessage.type}]`}"
             </div>
          )}

          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Recent Chats</h4>

          <div className="flex flex-col gap-2">
            {conversations.map(conv => {
               // Safely find the other participant name
               const otherParticipant = conv.participants.find(p => p.firstName) || conv.participants[0];
               return (
                 <div key={conv._id} className="flex items-center justify-between p-2 clay-card border-none hover:shadow-clay-inset transition-all duration-200">
                   <div className="flex items-center gap-3">
                     <img src={otherParticipant.profileImageUrl || '/chattix-logo.png'} alt="avatar" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                     <span className="text-sm font-semibold text-gray-800">{otherParticipant.firstName} {otherParticipant.lastName}</span>
                   </div>
                   <button
                    onClick={() => handleForward(conv._id)}
                    disabled={loadingConvId === conv._id}
                    className="p-2 clay-btn-teal rounded-full flex items-center justify-center"
                   >
                     {loadingConvId === conv._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                   </button>
                 </div>
               );
            })}
            {conversations.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4">No recent chats available.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
