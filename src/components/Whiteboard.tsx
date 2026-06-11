import React, { useRef, useState, useEffect } from 'react';
import { 
  Square, 
  Circle, 
  Type, 
  Trash2, 
  Download, 
  Undo2, 
  Eraser, 
  Paintbrush, 
  Maximize2, 
  Minimize2, 
  MousePointer,
  Sparkles,
  Printer
} from 'lucide-react';
import { WhiteboardElement } from '../types';

interface WhiteboardProps {
  role: 'teacher' | 'student';
  boardData?: string; // in a real app, streamed coordinates, here let's support viewing teacher's dynamic canvas
  onDataSync?: (dataUrl: string) => void;
}

export default function Whiteboard({ role, boardData, onDataSync }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [color, setColor] = useState('#1e293b'); // SLATE 800
  const [lineWidth, setLineWidth] = useState(4);
  const [tool, setTool] = useState<'pen' | 'rect' | 'circle' | 'text' | 'eraser' | 'pointer'>('pen');
  const [isDrawing, setIsDrawing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Colors Palette
  const colors = [
    { value: '#1e293b', name: 'ذغالی' },
    { value: '#ef4444', name: 'قرمز' },
    { value: '#3b82f6', name: 'آبی' },
    { value: '#10b981', name: 'سبز' },
    { value: '#f59e0b', name: 'نارنجی' },
    { value: '#8b5cf6', name: 'بنفش' },
  ];

  // Load and adjust to container-size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        // Save current contents
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight || 450;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          // Restore drawing
          ctx.drawImage(tempCanvas, 0, 0);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initial background white
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Update stroke values
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = lineWidth;
    }
  }, [color, lineWidth, tool]);

  // Handle incoming student view sync (if they are viewing the synced boardData)
  useEffect(() => {
    if (role === 'student' && boardData && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
      };
      img.src = boardData;
    }
  }, [boardData, role]);

  const lastSyncTimeRef = useRef<number>(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerRealTimeSync = () => {
    if (role === 'student' || !onDataSync || !canvasRef.current) return;
    
    const now = Date.now();
    const throttleMs = 120; // Sync ~8 times/sec for seamless fluidity and zero overhead
    
    if (now - lastSyncTimeRef.current >= throttleMs) {
      lastSyncTimeRef.current = now;
      onDataSync(canvasRef.current.toDataURL('image/png'));
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    } else {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        if (canvasRef.current && onDataSync) {
          onDataSync(canvasRef.current.toDataURL('image/png'));
        }
      }, throttleMs);
    }
  };

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      let touch = e.touches[0];
      if (!touch && 'changedTouches' in e && e.changedTouches.length > 0) {
        touch = e.changedTouches[0];
      }
      if (!touch) return { x: 0, y: 0 };
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (role === 'student') return; // Students view only in this interactive model
    const coords = getCoordinates(e);
    setIsDrawing(true);
    lastPosRef.current = coords;

    if (tool === 'text') {
      setTextPos({ x: coords.x, y: coords.y });
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCoordinates(e);
    
    // Track pointer position for student interactive view if pointer tool
    if (tool === 'pointer' && role === 'teacher') {
      setLaserPos(coords);
      if (e.cancelable) e.preventDefault();
    }

    if (!isDrawing || role === 'student') return;

    // Prevent default scrolling on mobile touch drawing
    if (e.cancelable) {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && lastPosRef.current) {
      if (tool === 'pen' || tool === 'eraser') {
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
        ctx.lineWidth = lineWidth;
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        ctx.closePath();
        
        lastPosRef.current = coords;
        triggerRealTimeSync();
      }
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPosRef.current = null;
    
    if (role === 'student') return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      // If rectangle or circle is selected, draw it at final position
      if (tool === 'rect' || tool === 'circle') {
        const coords = getCoordinates(e);
        ctx.fillStyle = 'transparent';
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        
        ctx.beginPath();
        if (tool === 'rect') {
          // simple fixed rectangle on click-release for instant shapes
          const size = Math.max(30, Math.min(200, lineWidth * 25));
          ctx.strokeRect(coords.x - size/2, coords.y - size/2, size, size);
        } else {
          const radius = Math.max(15, Math.min(100, lineWidth * 15));
          ctx.arc(coords.x, coords.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
        ctx.closePath();
      }

      // Sync data changes upwards
      if (onDataSync) {
        onDataSync(canvas.toDataURL('image/png'));
      }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput || !textPos || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.font = `bold ${lineWidth * 3 + 12}px Inter, System-UI, sans-serif`;
      ctx.fillText(textInput, textPos.x, textPos.y);
      
      if (onDataSync) {
        onDataSync(canvas.toDataURL('image/png'));
      }
    }

    setTextInput('');
    setTextPos(null);
  };

  const clearBoard = () => {
    if (role === 'student') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (onDataSync) {
        onDataSync(canvas.toDataURL('image/png'));
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Local/Offline export to modern educational PDF document printable format
  const exportToPDF = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary beautiful classroom worksheet page to export
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Setup A4-like high density portrait size (1200 x 1600)
    exportCanvas.width = 1200;
    exportCanvas.height = 1500;

    // 1. Draw elegant background
    ctx.fillStyle = '#f8fafc'; // light slate
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // 2. Draw modern border frame
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, exportCanvas.width - 40, exportCanvas.height - 40);

    // 3. Draw Header Section (RTL Persian)
    ctx.fillStyle = '#1e3a8a'; // dark corporate blue
    ctx.fillRect(40, 40, exportCanvas.width - 80, 150);

    // School Title and Info
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial, Sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('پلتفرم تخته کلاس هوشمند P.R.S Classroom Pro', exportCanvas.width - 80, 100);

    ctx.font = '22px Arial, Sans-serif';
    ctx.fillStyle = '#93c5fd';
    ctx.fillText('تخته هوشمند و جزوه کلاس اختصاصی', exportCanvas.width - 80, 145);

    // Left info side inside header
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'normal 20px Arial, Sans-serif';
    const dateStr = new Date().toLocaleDateString('fa-IR');
    ctx.fillText(`تاریخ خروجی: ${dateStr}`, 80, 85);
    ctx.fillText('نوع فایل: پی‌دی‌اف / تصویر تخته کلاسی', 80, 120);

    // 4. White space for drawing board
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(40, 210, exportCanvas.width - 80, 1100);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 210, exportCanvas.width - 80, 1100);

    // Draw the teacher's canvas onto the sheet
    ctx.drawImage(canvas, 45, 215, exportCanvas.width - 90, 1090);

    // 5. Footer branding
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 18px Courier, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('P.R.S CLASSROOM PRO • ALL WORK FOR FLUID LEARNING • LIVE ONLINE PLATFORM', exportCanvas.width / 2, 1370);
    ctx.fillText('این فایل بر روی سامانه زنده و آنلاین کلاس هوشمند تولید شده است.', exportCanvas.width / 2, 1410);

    // Export Trigger
    try {
      const dataUrl = exportCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `PRS_Whiteboard_${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failure: ", err);
    }
  };

  return (
    <div 
      className={`relative flex flex-col bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[340px]'
      }`}
      ref={containerRef}
      id="prs-whiteboard"
    >
      {/* Tool Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-100 border-b border-slate-200 select-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-700 font-sans">
            {role === 'teacher' ? 'تخته هوشمند معلم (کنترل کامل)' : 'تماشای زنده تخته هوشمند'}
          </span>
        </div>

        {/* Action Controls for drawing */}
        {role === 'teacher' && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Tools */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg shadow-sm border border-slate-200">
              <button 
                onClick={() => setTool('pen')}
                className={`p-1.5 rounded-md transition-all ${tool === 'pen' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                title="قلم"
                id="tool-pen"
              >
                <Paintbrush size={16} />
              </button>
              <button 
                onClick={() => setTool('rect')}
                className={`p-1.5 rounded-md transition-all ${tool === 'rect' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                title="مستطیل"
                id="tool-rect"
              >
                <Square size={16} />
              </button>
              <button 
                onClick={() => setTool('circle')}
                className={`p-1.5 rounded-md transition-all ${tool === 'circle' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                title="دایره"
                id="tool-circle"
              >
                <Circle size={16} />
              </button>
              <button 
                onClick={() => setTool('text')}
                className={`p-1.5 rounded-md transition-all ${tool === 'text' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                title="متن"
                id="tool-text"
              >
                <Type size={16} />
              </button>
              <button 
                onClick={() => setTool('eraser')}
                className={`p-1.5 rounded-md transition-all ${tool === 'eraser' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                title="پاک‌کن"
                id="tool-eraser"
              >
                <Eraser size={16} />
              </button>
              <button 
                onClick={() => setTool('pointer')}
                className={`p-1.5 rounded-md transition-all ${tool === 'pointer' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                title="اشاره‌گر لیزری"
                id="tool-pointer"
              >
                <MousePointer size={16} />
              </button>
            </div>

            {/* Thickness and Colors */}
            {tool !== 'eraser' && tool !== 'pointer' && (
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    className="w-5 h-5 rounded-full border border-slate-300 transition-transform active:scale-95"
                    style={{ backgroundColor: c.value, boxShadow: color === c.value ? '0 0 0 2px #94a3b8' : 'none' }}
                    title={c.name}
                  />
                ))}
                <span className="w-[1px] h-4 bg-slate-200 mx-1"></span>
                <input 
                  type="range" 
                  min="2" 
                  max="15" 
                  value={lineWidth} 
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                  className="w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  title="ضخامت خط"
                />
              </div>
            )}

            {/* Clear Board */}
            <button 
              onClick={clearBoard}
              className="p-1.5 text-rose-600 hover:bg-rose-50 bg-white border border-rose-100 rounded-lg transition-colors flex items-center gap-1 text-xs"
              title="پاکسازی کامل"
              id="clear-whiteboard"
            >
              <Trash2 size={15} />
              پاکسازی
            </button>
          </div>
        )}

        {/* Global Utilities */}
        <div className="flex items-center gap-2">
          <button 
            onClick={exportToPDF}
            className="p-1.5 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1 text-xs font-medium font-sans"
            title="خروجی PDF / تصویر تخته"
            id="export-pdf-btn"
          >
            <Printer size={15} />
            خروجی PDF/تصویر
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-600 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Canvas Area wrapper */}
      <div className="relative flex-1 bg-white cursor-crosshair overflow-hidden touch-none" style={{ touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="block w-full h-full"
          style={{ touchAction: 'none' }}
        />

        {/* Floating Text form on the board */}
        {textPos && (
          <form 
            onSubmit={handleTextSubmit}
            className="absolute p-2 bg-slate-900/90 text-white rounded-lg shadow-xl z-20 flex gap-2 flex-col"
            style={{ left: textPos.x, top: textPos.y - 45 }}
          >
            <input 
              autoFocus
              type="text" 
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="متن خود را فارسی بنویسید..." 
              className="px-2.5 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-right text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <div className="flex justify-between items-center">
              <button 
                type="button" 
                onClick={() => setTextPos(null)}
                className="text-[10px] text-slate-400 hover:text-white"
              >
                انصراف
              </button>
              <button 
                type="submit" 
                className="text-[10px] bg-sky-600 hover:bg-sky-500 px-2 py-0.5 rounded text-white"
              >
                تایید
              </button>
            </div>
          </form>
        )}

        {/* Laser Pointer Simulator */}
        {tool === 'pointer' && laserPos && (
          <div 
            className="absolute pointer-events-none w-5 h-5 bg-red-500/30 border border-red-500 rounded-full flex items-center justify-center animate-ping z-10"
            style={{ 
              left: laserPos.x - 10, 
              top: laserPos.y - 10,
              boxShadow: '0 0 10px #ef4444'
            }}
          >
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
          </div>
        )}

        {/* Student View Overlay Banner if appropriate */}
        {role === 'student' && (
          <div className="absolute bottom-3 left-3 bg-indigo-900/80 backdrop-blur text-white text-[10px] px-2.5 py-1 rounded-full z-10 font-sans flex items-center gap-1.5 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
            بیننده زنده تخته هوشمند دبیر هستید
          </div>
        )}
      </div>
    </div>
  );
}
