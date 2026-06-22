import { useDispatch, useSelector } from 'react-redux';
import { closeDeleteModal } from '../../store/uiSlice';
import { useAuth } from '@clerk/clerk-react';
import { setMessages } from '../../store/chatSlice';
import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function DeleteModal() {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const { isDeleteModalOpen, deleteMessageId } = useSelector(state => state.ui);
  const messages = useSelector(state => state.chat.messages);
  const [loading, setLoading] = useState(false);

  if (!isDeleteModalOpen) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      await fetch(`${import.meta.env.VITE_API_URL}/messages/${deleteMessageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state instantly for snappy UI
      const updatedMessages = messages.map(msg =>
        msg._id === deleteMessageId
          ? { ...msg, deleted: true, content: 'This message was deleted', type: 'text', linkPreview: null }
          : msg
      );
      dispatch(setMessages(updatedMessages));

      dispatch(closeDeleteModal());
    } catch (error) {
      console.error("Failed to delete message", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-chattix-bg/80 backdrop-blur-sm">
      <div className="clay-card rounded-3xl p-6 max-w-sm w-full mx-4 relative">
        <button
          onClick={() => dispatch(closeDeleteModal())}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors clay-btn p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-gray-800 mb-2 mt-2">Delete Message</h3>
        <p className="text-gray-600 text-sm mb-6">Are you sure you want to delete this message? This action cannot be undone.</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => dispatch(closeDeleteModal())}
            className="px-4 py-2 text-sm font-medium text-gray-600 clay-btn"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 text-red-500 text-sm font-medium clay-btn flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
