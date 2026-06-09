import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { X, Image as ImageIcon, Video, Globe, Users, Lock, Loader2, Type, Clock, MapPin, Link as LinkIcon, Sticker, PenTool, AtSign, Trash2, Trash, UserPlus, Palette } from 'lucide-react';
import { createStory } from '../redux/slices/storySlice';
import { useConfirm } from '../context/ConfirmContext';
import { LinkModal, LocationModal, GiphyModal, TagModal, TextModal } from './StoryModals';
import toast from 'react-hot-toast';

const bgGradients = [
  'bg-gradient-to-tr from-blue-500 to-purple-600',
  'bg-gradient-to-tr from-green-400 to-blue-500',
  'bg-gradient-to-tr from-pink-500 to-orange-400',
  'bg-gradient-to-tr from-gray-900 to-gray-600',
  'bg-gradient-to-tr from-yellow-400 to-orange-500',
  'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
  'bg-gradient-to-r from-cyan-500 to-blue-500',
  'bg-gradient-to-br from-red-500 to-orange-500',
  'bg-gradient-to-tr from-emerald-500 to-teal-400',
  'bg-gradient-to-tr from-slate-800 to-slate-900',
  'bg-black',
  'bg-white',
  'bg-gradient-to-br from-fuchsia-600 to-pink-600',
  'bg-gradient-to-br from-rose-400 to-red-500',
  'bg-gradient-to-br from-amber-200 to-yellow-400'
];

const fontFamilies = [
  'font-sans', 'font-serif', 'font-mono', 
  'font-sans font-black tracking-tighter',
  'font-serif italic',
  'font-mono uppercase tracking-widest'
];
const fontColors = [
  'text-white', 'text-black', 'text-gray-400',
  'text-red-500', 'text-orange-500', 'text-yellow-400',
  'text-green-500', 'text-emerald-400', 'text-cyan-400',
  'text-blue-500', 'text-indigo-500', 'text-purple-500',
  'text-pink-500', 'text-rose-500'
];

const StoryCreator = ({ onClose }) => {
  const dispatch = useDispatch();
  const { confirm } = useConfirm();
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [audience, setAudience] = useState('friends');
  const [loading, setLoading] = useState(false);
  
  // Text Mode state
  const [textMode, setTextMode] = useState(false);
  const [bgColor, setBgColor] = useState(bgGradients[0]);

  // Overlays
  const [overlays, setOverlays] = useState([]);
  const [isDoodling, setIsDoodling] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [isOverTrash, setIsOverTrash] = useState(false);
  
  // Style Drawer
  const [showStyleDrawer, setShowStyleDrawer] = useState(false);

  // Modals state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showLocModal, setShowLocModal] = useState(false);
  const [showGiphyModal, setShowGiphyModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);

  const handleClose = async () => {
    if (selectedFile || textMode) {
      const ok = await confirm({
        title: 'Discard Story?',
        message: 'If you go back now, your story will be lost.',
        confirmText: 'Discard',
        isDestructive: true
      });
      if (ok) onClose();
    } else {
      onClose();
    }
  };

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
    setTextMode(false);
  };

  const handlePost = async () => {
    if (!textMode && !selectedFile) return;
    if (textMode && overlays.length === 0) {
      toast.error('Please add an element');
      return;
    }
    
    // Save doodle canvas if active
    let currentOverlays = [...overlays];
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL();
      // Only add if not empty (simple check: string length > minimal empty dataUrl)
      if (dataUrl.length > 100) {
        currentOverlays.push({ type: 'doodle', url: dataUrl });
      }
    }

    setLoading(true);
    try {
      await dispatch(createStory({ 
        mediaFile: selectedFile, 
        caption: '', 
        audience, 
        textMode, 
        backgroundColor: bgColor,
        overlays: currentOverlays
      })).unwrap();
      toast.success('Story posted!');
      onClose();
    } catch (error) {
      toast.error(error || 'Failed to post story');
    } finally {
      setLoading(false);
    }
  };

  const enableTextMode = () => {
    setTextMode(true);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  // Overlay Actions
  const addTimeOverlay = () => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setOverlays([...overlays, { type: 'time', text: time, x: 50, y: 50, styleIdx: 0 }]);
  };

  const cycleOverlayStyle = (idx, maxStyles) => {
    setOverlays(prev => {
      const next = [...prev];
      next[idx].styleIdx = ((next[idx].styleIdx || 0) + 1) % maxStyles;
      return next;
    });
  };

  const getTimeStyle = (styleIdx) => {
    switch(styleIdx) {
      case 1: return 'bg-transparent text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-sans text-5xl font-black tracking-tighter';
      case 2: return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl px-5 py-3 font-bold text-4xl shadow-xl';
      case 3: return 'bg-black/40 backdrop-blur-md text-white rounded-3xl px-6 py-2 border border-white/20 font-serif text-3xl italic shadow-2xl';
      case 4: return 'bg-blue-600 text-white rounded shadow-md px-4 py-1 text-2xl font-mono uppercase tracking-widest';
      case 5: return 'bg-white/90 text-chattix-primary rounded-xl px-5 py-2 text-4xl font-black shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)]';
      case 6: return 'bg-yellow-400 text-black font-black px-6 py-2 rounded shadow-[4px_4px_0_black] text-4xl uppercase';
      case 7: return 'bg-transparent text-pink-400 font-bold text-5xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]';
      case 8: return 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white px-6 py-3 rounded-t-3xl rounded-bl-3xl font-bold text-3xl shadow-xl border-2 border-white/50';
      case 9: return 'bg-red-500 text-white font-mono px-4 py-1 border-4 border-black shadow-[4px_4px_0_black] text-2xl';
      default: return 'bg-white text-black font-sans rounded-xl shadow-lg px-4 py-2 text-3xl font-bold';
    }
  };

  const getLocationStyle = (styleIdx) => {
    switch(styleIdx) {
      case 1: return 'bg-white/90 backdrop-blur text-black font-bold px-4 py-2 rounded-full shadow-lg';
      case 2: return 'bg-black/80 backdrop-blur text-white font-mono px-3 py-1 rounded shadow-lg border border-white/20';
      case 3: return 'bg-transparent text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-bold text-3xl';
      case 4: return 'bg-gradient-to-r from-orange-400 to-rose-500 text-white font-bold px-4 py-2 rounded-full shadow-xl shadow-rose-500/30';
      case 5: return 'bg-indigo-600 text-white font-serif italic px-5 py-2 rounded-lg shadow-lg border-2 border-indigo-300/30';
      case 6: return 'bg-yellow-400 text-black font-black px-5 py-2 uppercase tracking-widest shadow-[4px_4px_0_black]';
      case 7: return 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold px-5 py-2 rounded-3xl shadow-xl border-2 border-white/50';
      case 8: return 'bg-transparent text-pink-400 font-bold text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]';
      case 9: return 'bg-white border-4 border-black text-black font-bold px-4 py-1 shadow-[4px_4px_0_black]';
      default: return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold px-4 py-2 rounded-lg shadow-lg';
    }
  };

  const getLinkStyle = (styleIdx) => {
    switch(styleIdx) {
      case 1: return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold px-5 py-2 rounded-xl shadow-lg';
      case 2: return 'bg-black/80 backdrop-blur-md text-white border border-white/20 font-semibold px-4 py-1.5 rounded-full';
      case 3: return 'bg-transparent text-blue-400 underline underline-offset-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-bold text-2xl';
      case 4: return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-5 py-2 rounded-full shadow-xl shadow-pink-500/30';
      case 5: return 'bg-white/90 text-indigo-600 font-serif italic px-5 py-2 rounded-lg shadow-lg border-2 border-indigo-300/30';
      case 6: return 'bg-yellow-400 text-black font-black px-4 py-2 uppercase tracking-widest shadow-[4px_4px_0_black] underline';
      case 7: return 'bg-emerald-500 text-white font-bold px-5 py-2 rounded-t-xl rounded-bl-xl shadow-xl border-2 border-white';
      case 8: return 'bg-transparent text-pink-400 font-bold text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] underline';
      case 9: return 'bg-white border-2 border-dashed border-blue-500 text-blue-500 font-bold px-4 py-1 shadow-md';
      default: return 'bg-white/90 backdrop-blur text-blue-600 font-bold px-4 py-2 rounded-full shadow-lg';
    }
  };

  const getTagStyle = (styleIdx) => {
    switch(styleIdx) {
      case 1: return 'bg-white/90 backdrop-blur text-purple-600 font-bold px-4 py-1.5 rounded-full shadow-md border border-purple-100';
      case 2: return 'bg-black text-white font-mono px-3 py-1 shadow-lg border-2 border-purple-500 rounded-md';
      case 3: return 'bg-transparent text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-black text-3xl';
      case 4: return 'bg-gradient-to-r from-orange-400 to-rose-500 text-white font-bold px-4 py-2 rounded-full shadow-xl shadow-rose-500/30';
      case 5: return 'bg-indigo-600 text-white font-serif italic px-5 py-2 rounded-lg shadow-lg border-2 border-indigo-300/30';
      case 6: return 'bg-yellow-400 text-black font-black px-4 py-2 uppercase tracking-widest shadow-[4px_4px_0_black]';
      case 7: return 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold px-5 py-2 rounded-3xl shadow-xl border-2 border-white/50';
      case 8: return 'bg-transparent text-pink-400 font-bold text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]';
      case 9: return 'bg-white border-4 border-black text-black font-bold px-4 py-1 shadow-[4px_4px_0_black]';
      default: return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-4 py-2 rounded-lg shadow-lg';
    }
  };

  const getTextStyle = (styleIdx) => {
    switch(styleIdx) {
      case 1: return 'bg-white/90 backdrop-blur text-black font-bold px-4 py-2 rounded-xl shadow-lg';
      case 2: return 'bg-black/80 backdrop-blur text-white font-serif px-4 py-2 rounded-xl shadow-lg';
      case 3: return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg';
      case 4: return 'bg-yellow-400 text-black font-black px-4 py-1 uppercase tracking-widest shadow-[4px_4px_0_black]';
      case 5: return 'bg-transparent text-pink-400 font-bold text-4xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]';
      case 6: return 'bg-indigo-600 text-white font-serif italic px-5 py-3 rounded-lg shadow-lg border-2 border-indigo-300/30';
      case 7: return 'bg-transparent text-white font-bold text-5xl tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] outline-text-white';
      case 8: return 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white px-6 py-4 rounded-t-3xl rounded-bl-3xl font-bold shadow-xl border-2 border-white/50';
      case 9: return 'bg-red-500 text-white font-mono px-4 py-2 border-4 border-black shadow-[4px_4px_0_black]';
      default: return 'bg-transparent text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-bold text-3xl';
    }
  };

  const toggleDoodle = () => setIsDoodling(!isDoodling);

  // Doodle Canvas Handlers
  useEffect(() => {
    if (isDoodling && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#fff';
    }
  }, [isDoodling]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    draw(e);
  };
  const stopDrawing = () => {
    setIsDrawing(false);
    if(canvasRef.current) canvasRef.current.getContext('2d').beginPath();
  };
  const draw = (e) => {
    if (!isDrawing || !isDoodling || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // Dragging System
  const handleDragStart = (idx, e) => {
    if (isDoodling) return;
    setDraggedIdx(idx);
  };
  
  const handleDragMove = (e) => {
    if (draggedIdx === null || !previewRef.current) return;
    e.preventDefault();
    const rect = previewRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    
    // Check if dragging near bottom center (Trash area)
    if (y > 85 && x > 40 && x < 60) {
      setIsOverTrash(true);
    } else {
      setIsOverTrash(false);
    }

    setOverlays(prev => {
      const next = [...prev];
      next[draggedIdx] = { ...next[draggedIdx], x, y };
      return next;
    });
  };

  const handleDragEnd = () => {
    if (draggedIdx !== null && isOverTrash) {
      setOverlays(prev => prev.filter((_, idx) => idx !== draggedIdx));
    }
    setDraggedIdx(null);
    setIsOverTrash(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between p-4 shrink-0 text-white lg:absolute lg:top-4 lg:left-4 lg:right-4 z-10">
        <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={24} />
        </button>
        <h2 className="text-lg font-semibold lg:hidden">Create Story</h2>
        <button 
          onClick={handlePost} 
          disabled={(!textMode && !selectedFile) || (textMode && overlays.length === 0) || loading}
          className="bg-chattix-primary text-white px-4 py-1.5 text-sm rounded-full font-semibold disabled:opacity-50 flex items-center gap-2 lg:hidden"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Post
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 w-full max-w-6xl mx-auto gap-4 lg:gap-6 lg:mt-8">
        
        {/* Left Column: Type Selection (Large Screens) */}
        <div className="hidden lg:flex flex-col w-64 bg-gray-900 rounded-2xl p-6 shrink-0 overflow-y-auto">
          <h3 className="text-white font-bold text-xl mb-6">Create Story</h3>
          
          <div className="space-y-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${!textMode && previewUrl ? 'bg-chattix-primary/20 text-chattix-primary border border-chattix-primary/30' : 'bg-white/5 text-white hover:bg-white/10'}`}
            >
              <div className="p-2 bg-blue-500 rounded-lg text-white"><ImageIcon size={20} /></div>
              <span className="font-medium">Media Story</span>
            </button>
            
            <button 
              onClick={enableTextMode}
              className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${textMode ? 'bg-chattix-primary/20 text-chattix-primary border border-chattix-primary/30' : 'bg-white/5 text-white hover:bg-white/10'}`}
            >
              <div className="p-2 bg-purple-500 rounded-lg text-white"><Type size={20} /></div>
              <span className="font-medium">Text Story</span>
            </button>
          </div>

          {textMode && (
            <div className="mt-8">
              <button 
                onClick={() => setShowStyleDrawer(true)}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-colors"
              >
                Edit Styling
              </button>
            </div>
          )}
        </div>

        {/* Middle Column: Live Preview */}
        <div className="flex-1 bg-gray-900 lg:rounded-2xl overflow-hidden relative flex flex-col justify-center items-center shadow-2xl">
          
          {/* Overlay Toolbar */}
          {(previewUrl || textMode) && (
            <div className="absolute top-4 right-4 flex flex-col gap-3 z-30">
              {textMode && (
                <button onClick={() => setShowStyleDrawer(true)} className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md shadow-lg transition-colors lg:hidden"><Palette size={20} /></button>
              )}
              <button onClick={() => setShowTextModal(true)} className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md shadow-lg transition-colors"><Type size={20} /></button>
              <button onClick={toggleDoodle} className={`p-2 rounded-full shadow-lg transition-colors ${isDoodling ? 'bg-white text-black scale-110' : 'bg-black/50 hover:bg-black/70 text-white backdrop-blur-md'}`}><PenTool size={20} /></button>
              <button onClick={() => setShowGiphyModal(true)} className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md shadow-lg transition-colors"><Sticker size={20} /></button>
              <button onClick={addTimeOverlay} className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md shadow-lg transition-colors"><Clock size={20} /></button>
              <button onClick={() => setShowLocModal(true)} className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md shadow-lg transition-colors"><MapPin size={20} /></button>
              <button onClick={() => setShowLinkModal(true)} className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md shadow-lg transition-colors"><LinkIcon size={20} /></button>
              <button onClick={() => setShowTagModal(true)} className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md shadow-lg transition-colors"><UserPlus size={20} /></button>
            </div>
          )}

          {!previewUrl && !textMode ? (
            <div className="flex flex-col gap-4 lg:hidden">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-4 text-white/70 hover:text-white transition-colors p-8"
              >
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    <ImageIcon size={32} />
                  </div>
                </div>
                <p className="font-medium text-lg">Photo/Video Story</p>
              </button>
              
              <button 
                onClick={enableTextMode}
                className="flex flex-col items-center gap-4 text-white/70 hover:text-white transition-colors p-8 pt-0"
              >
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-purple-500 text-white flex items-center justify-center">
                    <Type size={32} />
                  </div>
                </div>
                <p className="font-medium text-lg">Text Story</p>
              </button>
            </div>
          ) : (
            <div 
              className="relative w-full h-full select-none"
              ref={previewRef}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
            >
              {/* Media Layer */}
              {textMode ? (
                <div className={`w-full h-full flex items-center justify-center p-8 ${bgColor}`} />
              ) : (
                selectedFile?.type.startsWith('video/') ? (
                  <video src={previewUrl} className="w-full h-full object-contain" autoPlay loop muted playsInline />
                ) : (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                )
              )}

              {/* Trash Bin */}
              {draggedIdx !== null && (
                <div 
                  className={`absolute bottom-8 left-1/2 -translate-x-1/2 p-4 rounded-full transition-all duration-200 z-40 shadow-xl flex items-center justify-center ${
                    isOverTrash ? 'bg-red-500 text-white scale-125' : 'bg-black/50 backdrop-blur text-white/70 scale-100'
                  }`}
                >
                  {isOverTrash ? <Trash2 size={28} /> : <Trash size={24} />}
                </div>
              )}

              {/* Overlays Layer */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {overlays.map((overlay, idx) => (
                  <div 
                    key={idx} 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move pointer-events-auto"
                    style={{ left: `${overlay.x}%`, top: `${overlay.y}%` }}
                    onMouseDown={(e) => handleDragStart(idx, e)}
                    onTouchStart={(e) => handleDragStart(idx, e)}
                  >
                    {overlay.type === 'time' && (
                      <div 
                        onClick={() => cycleOverlayStyle(idx, 10)}
                        className={`font-bold px-4 py-2 rounded-lg shadow-lg text-xl select-none cursor-pointer ${getTimeStyle(overlay.styleIdx)}`}
                      >
                        {overlay.text}
                      </div>
                    )}
                    {overlay.type === 'location' && (
                      <div 
                        onClick={() => cycleOverlayStyle(idx, 10)} 
                        className={`flex items-center gap-2 select-none cursor-pointer ${getLocationStyle(overlay.styleIdx)}`}
                      >
                        <MapPin size={16} />{overlay.text}
                      </div>
                    )}
                    {overlay.type === 'link' && (
                      <div 
                        onClick={() => cycleOverlayStyle(idx, 10)} 
                        className={`flex items-center gap-2 select-none cursor-pointer ${getLinkStyle(overlay.styleIdx)}`}
                      >
                        <LinkIcon size={16} />{overlay.text}
                      </div>
                    )}
                    {overlay.type === 'tag' && (
                      <div 
                        onClick={() => cycleOverlayStyle(idx, 10)} 
                        className={`flex flex-col items-center justify-center select-none cursor-pointer ${getTagStyle(overlay.styleIdx)}`}
                      >
                        <div className="flex items-center gap-1 font-bold">
                          <UserPlus size={16} />{overlay.fullName || overlay.text}
                        </div>
                        {overlay.username && <div className="text-xs opacity-80">@{overlay.username}</div>}
                      </div>
                    )}
                    {overlay.type === 'text' && (
                      <div 
                        onClick={() => cycleOverlayStyle(idx, 10)} 
                        className={`select-none cursor-pointer text-center ${overlay.fontColor || 'text-white'} ${overlay.fontFamily || 'font-sans'} ${getTextStyle(overlay.styleIdx)}`}
                        style={{ whiteSpace: 'pre-wrap' }}
                      >
                        {overlay.text}
                      </div>
                    )}
                    {overlay.type === 'sticker' && <img src={overlay.url} alt="sticker" className="w-32 h-32 object-contain select-none cursor-move" draggable={false} />}
                  </div>
                ))}
              </div>

              {/* Doodle Canvas Layer */}
              {isDoodling && (
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseUp={stopDrawing}
                  onMouseOut={stopDrawing}
                  onMouseMove={draw}
                  onTouchStart={startDrawing}
                  onTouchEnd={stopDrawing}
                  onTouchCancel={stopDrawing}
                  onTouchMove={draw}
                  className="absolute inset-0 z-20 cursor-crosshair touch-none"
                />
              )}
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*" 
            onChange={handleFileSelect} 
          />
        </div>

        {/* Right Column / Bottom Drawer: Settings */}
        {(selectedFile || textMode) && (
          <div className="shrink-0 p-4 lg:p-6 bg-gray-900 lg:rounded-2xl flex flex-col gap-4 lg:gap-6 lg:w-80 safe-bottom">
            <div>
              <p className="text-xs lg:text-sm font-medium text-white/50 mb-2 uppercase tracking-wider">Audience</p>
              <div className="flex flex-row gap-2 lg:flex-col lg:gap-2">
                <button 
                  onClick={() => setAudience('public')}
                  className={`flex items-center justify-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-xl transition-colors ${audience === 'public' ? 'bg-blue-500 text-white flex-1 lg:flex-none' : 'bg-white/5 text-white/70 hover:bg-white/10 shrink-0'}`}
                  title="Public"
                >
                  <Globe size={18} className="shrink-0" /> 
                  <div className={audience === 'public' ? 'block text-left' : 'hidden lg:block lg:text-left'}>
                    <p className="font-semibold text-sm">Public</p>
                    <p className="text-[10px] opacity-70 hidden lg:block">Anyone on Chattix</p>
                  </div>
                </button>
                <button 
                  onClick={() => setAudience('friends')}
                  className={`flex items-center justify-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-xl transition-colors ${audience === 'friends' ? 'bg-blue-500 text-white flex-1 lg:flex-none' : 'bg-white/5 text-white/70 hover:bg-white/10 shrink-0'}`}
                  title="Friends"
                >
                  <Users size={18} className="shrink-0" /> 
                  <div className={audience === 'friends' ? 'block text-left' : 'hidden lg:block lg:text-left'}>
                    <p className="font-semibold text-sm">Friends</p>
                    <p className="text-[10px] opacity-70 hidden lg:block">Only your friends</p>
                  </div>
                </button>
                <button 
                  onClick={() => setAudience('only_me')}
                  className={`flex items-center justify-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-xl transition-colors ${audience === 'only_me' ? 'bg-blue-500 text-white flex-1 lg:flex-none' : 'bg-white/5 text-white/70 hover:bg-white/10 shrink-0'}`}
                  title="Only Me"
                >
                  <Lock size={18} className="shrink-0" /> 
                  <div className={audience === 'only_me' ? 'block text-left' : 'hidden lg:block lg:text-left'}>
                    <p className="font-semibold text-sm">Only Me</p>
                    <p className="text-[10px] opacity-70 hidden lg:block">Just for you</p>
                  </div>
                </button>
              </div>
            </div>

            {textMode && (
              <div className="lg:hidden mt-2">
                <button 
                  onClick={() => setShowStyleDrawer(true)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Edit Styling
                </button>
              </div>
            )}

            <button 
              onClick={handlePost} 
              disabled={(!textMode && !selectedFile) || (textMode && overlays.length === 0) || loading}
              className="mt-auto hidden lg:flex bg-chattix-primary text-white w-full py-4 rounded-xl font-bold disabled:opacity-50 items-center justify-center gap-2 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
            >
              {loading && <Loader2 size={20} className="animate-spin" />}
              Share to Story
            </button>
          </div>
        )}
      </div>

      <LinkModal 
        isOpen={showLinkModal} 
        onClose={() => setShowLinkModal(false)} 
        onAddLink={(linkData) => setOverlays([...overlays, { type: 'link', ...linkData, x: 50, y: 50, styleIdx: 0 }])} 
      />
      
      <LocationModal 
        isOpen={showLocModal} 
        onClose={() => setShowLocModal(false)} 
        onAddLocation={(locData) => setOverlays([...overlays, { type: 'location', ...locData, x: 50, y: 50, styleIdx: 0 }])} 
      />
      
      <GiphyModal 
        isOpen={showGiphyModal} 
        onClose={() => setShowGiphyModal(false)} 
        onAddSticker={(stickerData) => setOverlays([...overlays, { type: 'sticker', ...stickerData, x: 50, y: 50 }])} 
      />

      <TagModal 
        isOpen={showTagModal} 
        onClose={() => setShowTagModal(false)} 
        onAddTag={(tagData) => setOverlays([...overlays, { type: 'tag', ...tagData, x: 50, y: 50, styleIdx: 0 }])} 
      />

      <TextModal
        isOpen={showTextModal}
        onClose={() => setShowTextModal(false)}
        onAddText={(textData) => setOverlays([...overlays, { type: 'text', ...textData, x: 50, y: 50, styleIdx: 0 }])}
      />

      {/* Style Modal/Drawer */}
      {showStyleDrawer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm" onClick={() => setShowStyleDrawer(false)}>
          <div className="bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[80vh] border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-gray-900/90 backdrop-blur z-10">
              <h3 className="text-white font-bold text-lg">Background Options</h3>
              <button onClick={() => setShowStyleDrawer(false)} className="text-white/70 hover:text-white p-1 bg-white/5 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-6">
              <div>
                <p className="text-white/50 text-xs font-semibold mb-3 uppercase tracking-wider">Background</p>
                <div className="grid grid-cols-5 gap-2">
                  {bgGradients.map((bg, i) => (
                    <button 
                      key={i} 
                      onClick={() => setBgColor(bg)}
                      className={`aspect-square rounded-xl ${bg} transition-all border-2 ${bgColor === bg ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryCreator;
