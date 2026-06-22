import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Smile, Paperclip, Image as ImageIcon, Mic, Send, ThumbsUp, X, FileImage } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { Grid } from '@giphy/react-components';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { useSocket } from '../../contexts/SocketContext';
import { useAppAuth } from '../../contexts/AuthContext';
import { clearReplyingTo } from '../../store/uiSlice';

const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY);

export default function ChatInput() {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { dbUser } = useAppAuth();
  const socket = useSocket();
  const activeConversation = useSelector(state => state.chat.activeConversation);
  const replyingToMessage = useSelector(state => state.ui.replyingToMessage);

  const handleTyping = (e) => {
    setText(e.target.value);

    if (socket && activeConversation) {
      // Find receiver ID (the other participant)
      const receiver = activeConversation.participants.find(p => p._id !== dbUser._id) || activeConversation.participants[0];

      socket.emit('typing', {
        conversationId: activeConversation._id,
        senderId: dbUser._id,
        receiverId: receiver._id
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', {
          conversationId: activeConversation._id,
          senderId: dbUser._id,
          receiverId: receiver._id
        });
      }, 2000);
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setText(prev => prev + emojiObject.emoji);
    setShowEmoji(false);
  };

  const handleGifClick = async (gif, e) => {
    e.preventDefault();
    setShowGif(false);

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('conversationId', activeConversation._id);
      formData.append('type', 'gif');
      formData.append('content', gif.images.fixed_height.url);

      if (replyingToMessage) {
        formData.append('replyTo', replyingToMessage._id);
        dispatch(clearReplyingTo());
      }

      await fetch(`${import.meta.env.VITE_API_URL}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
    } catch(err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], 'audio.webm', { type: 'audio/webm' });
        setSelectedFile(file);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const sendMessage = async (reactionEmoji = null) => {
    if (!text.trim() && !selectedFile && !reactionEmoji) return;

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('conversationId', activeConversation._id);

      if (replyingToMessage) {
        formData.append('replyTo', replyingToMessage._id);
      }

      if (reactionEmoji) {
        formData.append('type', 'text');
        formData.append('content', reactionEmoji);
      } else if (selectedFile) {
        formData.append('media', selectedFile);
        // type is inferred in backend based on mimetype
      } else {
        formData.append('type', 'text');
        formData.append('content', text.trim());
      }

      await fetch(`${import.meta.env.VITE_API_URL}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      setText('');
      setSelectedFile(null);
      dispatch(clearReplyingTo());

      if (socket) {
        const receiver = activeConversation.participants.find(p => p._id !== dbUser._id) || activeConversation.participants[0];
        socket.emit('stopTyping', {
          conversationId: activeConversation._id,
          senderId: dbUser._id,
          receiverId: receiver._id
        });
      }

    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const isTypingSomething = text.trim().length > 0 || selectedFile !== null;

  return (
    <div className="flex flex-col">
      {/* Reply Banner */}
      {replyingToMessage && (
        <div className="bg-chattix-teal/10 px-4 py-2 border-l-4 border-chattix-teal flex items-center justify-between mx-4 mt-2 rounded-tr-lg">
          <div className="flex-1 truncate">
            <p className="text-xs font-bold text-chattix-teal">Replying to {replyingToMessage.senderId.firstName}</p>
            <p className="text-sm text-gray-600 truncate">{replyingToMessage.content}</p>
          </div>
          <button onClick={() => dispatch(clearReplyingTo())} className="text-gray-500 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* File Preview Banner */}
      {selectedFile && (
        <div className="bg-white/80 px-4 py-2 flex items-center justify-between mx-4 mt-2 rounded-t-lg border border-gray-200">
          <div className="flex items-center gap-2">
             <Paperclip className="w-4 h-4 text-chattix-teal" />
             <span className="text-sm text-gray-700 truncate max-w-xs">{selectedFile.name}</span>
          </div>
          <button onClick={() => setSelectedFile(null)} className="text-gray-500 hover:text-red-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-4 flex items-center gap-2 relative z-20">

        {/* Emoji Picker Popup */}
        {showEmoji && (
          <div className="absolute bottom-full left-4 mb-2 z-50 shadow-clay-card rounded-2xl overflow-hidden">
            <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={400} />
          </div>
        )}

        {/* GIF Picker Popup */}
        {showGif && (
          <div className="absolute bottom-full left-12 mb-2 z-50 bg-white shadow-clay-card rounded-2xl p-2 w-[300px] h-[400px] overflow-y-auto">
             <Grid width={280} columns={2} fetchGifs={(offset) => gf.trending({ offset, limit: 10 })} onGifClick={handleGifClick} />
          </div>
        )}

        <button onClick={() => { setShowEmoji(!showEmoji); setShowGif(false); }} className="p-2 text-gray-500 hover:text-chattix-teal transition-colors clay-btn">
          <Smile className="w-5 h-5" />
        </button>

        <button onClick={() => { setShowGif(!showGif); setShowEmoji(false); }} className="p-2 text-gray-500 hover:text-chattix-teal transition-colors clay-btn">
          <FileImage className="w-5 h-5" />
        </button>

        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-chattix-teal transition-colors clay-btn">
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        />

        <input
          type="text"
          value={text}
          onChange={handleTyping}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 clay-input py-2.5 px-4 text-sm"
        />

        {/* Voice Record Button */}
        {!isTypingSomething && (
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            className={`p-2 transition-colors rounded-xl clay-btn ${isRecording ? 'text-red-500 animate-pulse shadow-clay-inset' : 'text-gray-500 hover:text-chattix-teal'}`}
          >
            <Mic className="w-5 h-5" />
          </button>
        )}

        {/* Dynamic Send / Quick Reaction */}
        {isTypingSomething ? (
          <button
            onClick={() => sendMessage()}
            className="p-2 clay-btn-teal flex items-center justify-center transition-colors"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        ) : (
          <button
            onClick={() => sendMessage('👍')}
            className="p-2 text-chattix-teal hover:scale-110 transition-transform clay-btn"
          >
            <ThumbsUp className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
