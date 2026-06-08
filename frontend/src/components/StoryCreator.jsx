import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { X, Image as ImageIcon, Video, Globe, Users, Lock, Loader2 } from 'lucide-react';
import { createStory } from '../redux/slices/storySlice';
import toast from 'react-hot-toast';

const StoryCreator = ({ onClose }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [audience, setAudience] = useState('friends');
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Only images and videos are allowed for stories.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size must be less than 20MB');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handlePost = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      await dispatch(createStory({ mediaFile: selectedFile, caption, audience })).unwrap();
      toast.success('Story posted!');
      onClose();
    } catch (error) {
      toast.error(error || 'Failed to post story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 sm:p-4">
      <div className="flex items-center justify-between p-4 shrink-0 text-white">
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={24} />
        </button>
        <h2 className="text-lg font-semibold">Create Story</h2>
        <button 
          onClick={handlePost} 
          disabled={!selectedFile || loading}
          className="bg-chattix-primary text-white px-4 py-1.5 rounded-full font-semibold disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Post
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 sm:max-w-md sm:mx-auto w-full">
        <div className="flex-1 bg-gray-900 sm:rounded-2xl overflow-hidden relative flex flex-col justify-center items-center">
          {!previewUrl ? (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-4 text-white/70 hover:text-white transition-colors p-8"
            >
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <ImageIcon size={32} />
                </div>
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <Video size={32} />
                </div>
              </div>
              <p className="font-medium text-lg">Tap to select photo or video</p>
            </button>
          ) : (
            selectedFile?.type.startsWith('video/') ? (
              <video src={previewUrl} className="w-full h-full object-contain" autoPlay loop muted playsInline />
            ) : (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            )
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*" 
            onChange={handleFileSelect} 
          />
        </div>

        {selectedFile && (
          <div className="shrink-0 p-4 space-y-4 bg-black/50">
            <input 
              type="text" 
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="w-full bg-white/10 text-white placeholder-white/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chattix-primary"
            />
            
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
              <button 
                onClick={() => setAudience('public')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${audience === 'public' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/70'}`}
              >
                <Globe size={16} /> Public
              </button>
              <button 
                onClick={() => setAudience('friends')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${audience === 'friends' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/70'}`}
              >
                <Users size={16} /> Friends
              </button>
              <button 
                onClick={() => setAudience('only_me')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${audience === 'only_me' ? 'bg-green-500 text-white' : 'bg-white/10 text-white/70'}`}
              >
                <Lock size={16} /> Only Me
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryCreator;
