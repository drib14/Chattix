import { useEffect, useRef, useState } from 'react';
import { X, Trash2, Eraser, Edit2 } from 'lucide-react';

const ClayDoodleModal = ({ isOpen, onClose, onSend }) => {
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions based on client size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Draw initial clean white canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Default drawing options
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Get mouse/touch coordinate
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    
    if (clientX === undefined || clientY === undefined) return;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    
    if (clientX === undefined || clientY === undefined) return;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = brushSize;
    
    if (isEraser) {
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else {
      ctx.strokeStyle = color;
      
      // Apply double inner shading simulation / 3D Clay shadow effect on strokes!
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSend = () => {
    const canvas = canvasRef.current;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `doodle_${Date.now()}.png`, { type: 'image/png' });
      await onSend(file);
      onClose();
    }, 'image/png');
  };

  const colors = [
    '#6366f1', // Indigo (Primary)
    '#f43f5e', // Rose
    '#10b981', // Emerald
    '#eab308', // Yellow
    '#8b5cf6', // Purple
    '#475569', // Slate
  ];

  return (
    <div className="doodle-modal-backdrop">
      <div className="doodle-modal-card clay-card animate-pop-in">
        <div className="doodle-modal-header">
          <h3 className="doodle-modal-title">Clay Sketchpad</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Drawing Board Canvas */}
        <div className="doodle-canvas-container">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="doodle-canvas"
          />
        </div>

        {/* Controls and Settings panel */}
        <div className="doodle-controls">
          <div className="doodle-controls-row">
            {/* Color Swatches */}
            <div className="doodle-colors">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setIsEraser(false);
                  }}
                  className={`doodle-color-btn ${color === c && !isEraser ? 'doodle-color-btn-active' : ''}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
              
              {/* Eraser button */}
              <button
                onClick={() => setIsEraser(true)}
                className={`doodle-color-btn flex-center ${isEraser ? 'doodle-color-btn-active' : ''}`}
                style={{ backgroundColor: '#ffffff', color: '#1e293b' }}
                title="Eraser"
              >
                <Eraser size={14} />
              </button>
            </div>

            {/* Brush Size / Eraser toggles */}
            <div className="doodle-brush-settings">
              <span className="doodle-size-label">Brush Size: {brushSize}px</span>
              <input
                type="range"
                min="4"
                max="32"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="doodle-size-slider"
              />
            </div>
          </div>
        </div>

        {/* Action Actions Panel */}
        <div className="doodle-actions">
          <button onClick={clearCanvas} className="clay-btn clay-btn-secondary doodle-btn flex-center" title="Clear board">
            <Trash2 size={16} />
            Clear
          </button>
          <button onClick={onClose} className="clay-btn clay-btn-secondary doodle-btn">
            Cancel
          </button>
          <button onClick={handleSend} className="clay-btn clay-btn-primary doodle-btn">
            Send Doodle
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClayDoodleModal;
