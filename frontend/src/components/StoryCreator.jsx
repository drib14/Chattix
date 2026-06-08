import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { X, Image as ImageIcon, Video, Globe, Users, Lock, Loader2, Type, Clock, MapPin, Link as LinkIcon, Sticker, PenTool } from 'lucide-react';
import { createStory } from '../redux/slices/storySlice';
import { useConfirm } from '../context/ConfirmContext';
import { LinkModal, LocationModal, GiphyModal } from './StoryModals';
import toast from 'react-hot-toast';

const bgGradients = [
  'bg-gradient-to-tr from-blue-500 to-purple-600',
  'bg-gradient-to-tr from-green-400 to-blue-500',
  'bg-gradient-to-tr from-pink-500 to-orange-400',
  'bg-gradient-to-tr from-gray-900 to-gray-600',
  'bg-gradient-to-tr from-yellow-400 to-orange-500',
];

const fontFamilies = ['font-sans', 'font-serif', 'font-mono'];
const fontColors = ['text-white', 'text-black', 'text-yellow-300', 'text-pink-400', 'text-blue-400'];

const StoryCreator = ({ onClose }) => {
  const dispatch = useDispatch();
  const { confirm } = useConfirm();
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [audience, setAudience] = useState('friends');
  const [loading, setLoading] = useState(false);
  
  // Text Mode state
  const [textMode, setTextMode] = useState(false);
  const [bgColor, setBgColor] = useState(bgGradients[0]);
  const [fontFamily, setFontFamily] = useState(fontFamilies[0]);
  const [fontColor, setFontColor] = useState(fontColors[0]);

  // Overlays
  const [overlays, setOverlays] = useState([]);
  const [isDoodling, setIsDoodling] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);

  // Modals state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showLocModal, setShowLocModal] = useState(false);
  const [showGiphyModal, setShowGiphyModal] = useState(false);

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
    if (textMode && !caption.trim()) {
      toast.error('Please enter some text');
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
        caption, 
        audience, 
        textMode, 
        backgroundColor: bgColor,
        fontFamily,
        fontColor,
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

  const cycleTimeStyle = (idx) => {
    setOverlays(prev => {
      const next = [...prev];
      if (next[idx].type === 'time') {
        next[idx].styleIdx = ((next[idx].styleIdx || 0) + 1) % 4; // 4 styles
      }
      return next;
    });
  };

  const getTimeStyle = (styleIdx) => {
    switch(styleIdx) {
      case 1: return 'bg-black text-white font-mono';
      case 2: return 'bg-transparent text-white drop-shadow-xl font-serif text-4xl';
      case 3: return 'bg-white/20 backdrop-blur text-white font-sans border border-white/50';
      default: return 'bg-white text-black font-sans';
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
    
    setOverlays(prev => {
      const next = [...prev];
      next[draggedIdx] = { ...next[draggedIdx], x, y };
      return next;
    });
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
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
          disabled={(!textMode && !selectedFile) || (textMode && !caption) || loading}
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
            <div className="mt-8 space-y-6">
              <div>
                <p className="text-sm font-medium text-white/50 mb-3 uppercase tracking-wider">Backgrounds</p>
                <div className="flex flex-wrap gap-2">
                  {bgGradients.map((bg, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setBgColor(bg)}
                      className={`w-10 h-10 rounded-full ${bg} ${bgColor === bg ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-white/50 mb-3 uppercase tracking-wider">Font Style</p>
                <div className="flex flex-wrap gap-2">
                  {fontFamilies.map((f, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setFontFamily(f)}
                      className={`px-3 py-1 rounded-full text-sm text-white ${f} ${fontFamily === f ? 'bg-chattix-primary' : 'bg-white/10'}`}
                    >
                      Aa
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-white/50 mb-3 uppercase tracking-wider">Text Color</p>
                <div className="flex flex-wrap gap-2">
                  {fontColors.map((c, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setFontColor(c)}
                      className={`w-8 h-8 rounded-full border border-white/20 bg-gray-900 flex items-center justify-center ${fontColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}`}
                    >
                      <span className={`font-bold ${c}`}>A</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Middle Column: Live Preview */}
        <div className="flex-1 bg-gray-900 lg:rounded-2xl overflow-hidden relative flex flex-col justify-center items-center shadow-2xl">
          
          {/* Overlay Toolbar */}
          {(previewUrl || textMode) && (
            <div className="absolute top-4 right-4 flex flex-col gap-3 z-30">
              <button onClick={toggleDoodle} className={`p-2 rounded-full shadow-lg ${isDoodling ? 'bg-white text-black' : 'bg-black/50 text-white backdrop-blur-md'}`}><PenTool size={20} /></button>
              <button onClick={() => setShowGiphyModal(true)} className="p-2 rounded-full bg-black/50 text-white backdrop-blur-md shadow-lg"><Sticker size={20} /></button>
              <button onClick={addTimeOverlay} className="p-2 rounded-full bg-black/50 text-white backdrop-blur-md shadow-lg"><Clock size={20} /></button>
              <button onClick={() => setShowLocModal(true)} className="p-2 rounded-full bg-black/50 text-white backdrop-blur-md shadow-lg"><MapPin size={20} /></button>
              <button onClick={() => setShowLinkModal(true)} className="p-2 rounded-full bg-black/50 text-white backdrop-blur-md shadow-lg"><LinkIcon size={20} /></button>
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
                <div className={`w-full h-full flex items-center justify-center p-8 ${bgColor}`}>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Start typing..."
                    className={`w-full h-full bg-transparent ${fontColor} ${fontFamily} text-center text-4xl font-bold placeholder-white/50 focus:outline-none resize-none flex items-center justify-center`}
                    style={{ textAlignLast: 'center' }}
                  />
                </div>
              ) : (
                selectedFile?.type.startsWith('video/') ? (
                  <video src={previewUrl} className="w-full h-full object-contain" autoPlay loop muted playsInline />
                ) : (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                )
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
                        onClick={() => cycleTimeStyle(idx)}
                        className={`font-bold px-4 py-2 rounded-lg shadow-lg text-xl select-none ${getTimeStyle(overlay.styleIdx)}`}
                      >
                        {overlay.text}
                      </div>
                    )}
                    {overlay.type === 'location' && <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 select-none"><MapPin size={16} />{overlay.text}</div>}
                    {overlay.type === 'link' && <div className="bg-white/90 backdrop-blur text-blue-600 font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 select-none"><LinkIcon size={16} />{overlay.text}</div>}
                    {overlay.type === 'sticker' && <img src={overlay.url} alt="sticker" className="w-32 h-32 object-contain select-none" draggable={false} />}
                  </div>
                ))}
              </div></div>

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
            {!textMode && (
              <div>
                <p className="text-xs lg:text-sm font-medium text-white/50 mb-2 uppercase tracking-wider">Caption</p>
                <textarea 
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  className="w-full bg-white/5 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-chattix-primary resize-none h-16 lg:h-24"
                />
              </div>
            )}
            
            <div>
              <p className="text-xs lg:text-sm font-medium text-white/50 mb-2 uppercase tracking-wider">Audience</p>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setAudience('public')}
                  className={`flex items-center gap-3 px-4 py-2 lg:py-3 rounded-xl transition-colors text-left ${audience === 'public' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                >
                  <Globe size={18} className="shrink-0" /> 
                  <div>
                    <p className="font-semibold text-sm">Public</p>
                    <p className="text-[10px] opacity-70">Anyone on Chattix</p>
                  </div>
                </button>
                <button 
                  onClick={() => setAudience('friends')}
                  className={`flex items-center gap-3 px-4 py-2 lg:py-3 rounded-xl transition-colors text-left ${audience === 'friends' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                >
                  <Users size={18} className="shrink-0" /> 
                  <div>
                    <p className="font-semibold text-sm">Friends</p>
                    <p className="text-[10px] opacity-70">Only your friends</p>
                  </div>
                </button>
              </div>
            </div>

            {textMode && (
              <div className="lg:hidden mt-2 flex gap-4 overflow-x-auto hide-scrollbar">
                <div>
                  <p className="text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">Color</p>
                  <div className="flex gap-2">
                    {bgGradients.map((bg, idx) => (
                      <button key={idx} onClick={() => setBgColor(bg)} className={`shrink-0 w-6 h-6 rounded-full ${bg} ${bgColor === bg ? 'ring-2 ring-white' : ''}`} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">Font</p>
                  <div className="flex gap-2">
                    {fontFamilies.map((f, idx) => (
                      <button key={idx} onClick={() => setFontFamily(f)} className={`shrink-0 px-2 py-0.5 rounded-full text-xs text-white ${f} ${fontFamily === f ? 'bg-chattix-primary' : 'bg-white/10'}`}>Aa</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={handlePost} 
              disabled={(!textMode && !selectedFile) || (textMode && !caption) || loading}
              className="mt-auto hidden lg:flex bg-chattix-primary text-white w-full py-4 rounded-xl font-bold disabled:opacity-50 items-center justify-center gap-2 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
            >
              {loading && <Loader2 size={20} className="animate-spin" />}
              Share to Story
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryCreator;
