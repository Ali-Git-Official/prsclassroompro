import React, { useState, useRef } from 'react';
import { 
  File, 
  Video, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  FileDown, 
  Play, 
  Layers, 
  HelpCircle,
  Headphones,
  Sparkles
} from 'lucide-react';
import { ClassroomFile } from '../types';

interface FileManagerProps {
  role: 'teacher' | 'student';
  files: ClassroomFile[];
  onUploadFile: (file: ClassroomFile) => void;
  onDeleteFile: (id: string) => void;
}

export default function FileManager({
  role,
  files,
  onUploadFile,
  onDeleteFile
}: FileManagerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);
  const [activeMediaType, setActiveMediaType] = useState<'video' | 'pdf' | 'image' | 'audio' | null>(null);
  const [activeMediaName, setActiveMediaName] = useState<string>('');

  // Annotation states for Overlay Drawing
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfAnnotateActive, setPdfAnnotateActive] = useState(false);
  const [pdfDrawColor, setPdfDrawColor] = useState('#ef4444'); // Default red ink
  const [pdfBrushSize, setPdfBrushSize] = useState(3.5);
  const isPdfDrawingRef = useRef(false);

  // Zoom scale state for all media types
  const [mediaScale, setMediaScale] = useState<number>(1.0);

  const [dragActive, setDragActive] = useState(false);

  // PDF Draw callbacks
  const startPdfDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!pdfAnnotateActive || !pdfCanvasRef.current) return;
    isPdfDrawingRef.current = true;
    const canvas = pdfCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      ctx.beginPath();
      ctx.moveTo(clientX - rect.left, clientY - rect.top);
      ctx.strokeStyle = pdfDrawColor;
      ctx.lineWidth = pdfBrushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const drawPdf = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!pdfAnnotateActive || !isPdfDrawingRef.current || !pdfCanvasRef.current) return;
    const canvas = pdfCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      ctx.lineTo(clientX - rect.left, clientY - rect.top);
      ctx.stroke();
    }
  };

  const stopPdfDraw = () => {
    isPdfDrawingRef.current = false;
  };

  const clearPdfAnnotation = () => {
    const canvas = pdfCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const processFile = (nativeFile: File) => {
    const isVideo = nativeFile.type.startsWith('video/');
    const isImage = nativeFile.type.startsWith('image/');
    const isPdf = nativeFile.type === 'application/pdf';
    const isAudio = nativeFile.type.startsWith('audio/');

    let category: 'pdf' | 'video' | 'image' | 'link' | 'audio' = 'link';
    if (isPdf) category = 'pdf';
    else if (isVideo) category = 'video';
    else if (isImage) category = 'image';
    else if (isAudio) category = 'audio';

    const reader = new FileReader();
    reader.onload = () => {
       const resultString = reader.result as string;
       const classFile: ClassroomFile = {
         id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
         name: nativeFile.name,
         type: category,
         size: `${(nativeFile.size / (1024 * 1024)).toFixed(1)} MB`,
         url: resultString, // offline local payload
         uploadedAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
       };
       onUploadFile(classFile);
    };
    reader.readAsDataURL(nativeFile);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const openFileManagerTrigger = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const playMedia = (file: ClassroomFile) => {
    setPdfAnnotateActive(false); // Reset on opening new file
    setMediaScale(1.0); // Reset scale
    if (file.url) {
      setActiveMediaUrl(file.url);
      setActiveMediaType(file.type as any);
      setActiveMediaName(file.name);
    } else {
      // Setup demo/offline sample if no url is available
      setActiveMediaUrl('demo');
      setActiveMediaType(file.type as any);
      setActiveMediaName(file.name);
    }
  };

  const closeMediaViewer = () => {
    setActiveMediaUrl(null);
    setActiveMediaType(null);
    setActiveMediaName('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-right font-sans" id="prs-file-manager">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3.5 mb-4 flex-wrap gap-2 text-right">
        <span className="text-[10px] text-slate-400 font-sans">پوشه‌بندی و اشتراک‌گذاری امن</span>
        <h3 className="text-xs font-bold text-slate-900 flex items-center justify-end gap-1.5 font-sans">
          جزوات، اسلایدها و فایل‌های صوتی کلاسی
          <Layers size={15} className="text-slate-800" />
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Side: Upload zone for teacher / File list for both */}
        <div className={`space-y-3 ${role === 'teacher' ? 'md:col-span-7' : 'md:col-span-12'}`}>
          {files.length === 0 ? (
            <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400">
              <p className="text-xs font-sans">هنوز هیچ فایلی به اشتراک گذاشته نشده است.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {files.map((file) => (
                <div 
                  key={file.id} 
                  className="p-3 bg-white hover:bg-slate-50/50 rounded-lg border border-slate-200/80 flex justify-between items-center transition-colors"
                >
                  <div className="flex items-center gap-1.5 selection:bg-none">
                    {/* View Media controls (supports immediate viewing) */}
                    {(file.type === 'video' || file.type === 'image' || file.type === 'pdf' || file.type === 'audio') && (
                      <button 
                        type="button"
                        onClick={() => playMedia(file)}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 text-[10px] font-bold rounded-md transition-colors flex items-center gap-1 cursor-pointer border border-indigo-100/50"
                      >
                        <Play size={10} /> نمایش زنده
                      </button>
                    )}
                    
                    {file.url && (
                      <a 
                        href={file.url} 
                        download={file.name} 
                        className="p-1 px-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md text-[10px] font-bold flex items-center gap-0.5"
                        title="دانلود فایل"
                      >
                        <FileDown size={11} /> دانلود
                      </a>
                    )}

                    {role === 'teacher' && (
                      <button 
                        onClick={() => onDeleteFile(file.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title="حذف"
                        id={`delete-file-${file.id}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <div className="text-right flex items-center gap-2.5">
                    <div>
                      <p className="text-[11px] font-bold text-slate-900 font-sans truncate max-w-[140px]" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5 font-sans">
                        {file.size} • آپلود در {file.uploadedAt}
                      </p>
                    </div>
                    
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 animate-fade-in font-sans">
                      {file.type === 'pdf' && <File size={15} className="text-indigo-600" />}
                      {file.type === 'video' && <Video size={15} className="text-teal-650" />}
                      {file.type === 'image' && <ImageIcon size={15} className="text-rose-600" />}
                      {file.type === 'audio' && <Headphones size={15} className="text-amber-500" />}
                      {file.type !== 'pdf' && file.type !== 'video' && file.type !== 'image' && file.type !== 'audio' && <File size={15} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Upload Zone (Teacher Only) */}
        {role === 'teacher' && (
          <div className="md:col-span-5">
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={openFileManagerTrigger}
              className={`h-48 border border-dashed rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer text-center transition-all ${
                dragActive 
                  ? 'border-slate-800 bg-slate-50 scale-[0.99]' 
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                onChange={handleFileInput}
                className="hidden" 
                accept="image/*,video/*,audio/*,application/pdf"
              />
              <div className="p-2 bg-white rounded-full shadow-xs text-slate-900 mb-2 border border-slate-200/50">
                <Plus size={18} />
              </div>
              <p className="text-[11px] font-bold text-slate-800">انتخاب یا رهاسازی فایل جزوه</p>
              <p className="text-[9px] text-slate-400 mt-1 max-w-[160px] leading-relaxed font-sans">
                آپلود فوری عکس، جزوه PDF یا قطعه صوتی و ویدئو آموزشی (با قابلیت لود و پخش زنده و پرسرعت تحت شبکه)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Media Player Screen */}
      {activeMediaUrl && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl border border-slate-200 overflow-hidden shadow-xl flex flex-col text-right">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2 text-right">
              <button 
                onClick={closeMediaViewer}
                className="text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer border border-slate-200"
              >
                بستن پخش‌کننده
              </button>

              {/* Scale Zoom Controls for PDF, Videos, and Images */}
              {activeMediaType !== 'audio' && (
                <div className="flex items-center gap-1.5 bg-slate-150 p-0.5 rounded-lg border border-slate-200 text-[10px] font-sans">
                  <button
                    type="button"
                    onClick={() => setMediaScale(prev => Math.max(0.4, prev - 0.15))}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded shadow-2xs cursor-pointer"
                    title="کوچک‌نمایی"
                  >
                    - کوچک‌نمایی
                  </button>
                  <span className="px-1.5 font-bold text-slate-800 font-mono">
                    زوم: {Math.round(mediaScale * 100)}٪
                  </span>
                  <button
                    type="button"
                    onClick={() => setMediaScale(prev => Math.min(3.5, prev + 0.15))}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded shadow-2xs cursor-pointer"
                    title="بزرگ‌نمایی"
                  >
                    + بزرگ‌نمایی
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaScale(1.0)}
                    className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded cursor-pointer"
                    title="بازنشانی"
                  >
                    ۱x
                  </button>
                </div>
              )}

              <span className="text-xs font-bold text-slate-800 truncate max-w-[200px] font-sans">{activeMediaName}</span>
            </div>

            {/* Content view based on file type */}
            <div className="bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden select-none" style={{ height: activeMediaType === 'audio' ? 'auto' : '520px' }}>
              
              {/* Generic Annotation Toolbar */}
              {activeMediaType !== 'audio' && (
                <div className="absolute top-3 left-3 right-3 z-30 bg-slate-950/95 text-white rounded-xl p-2 flex items-center justify-between text-xs border border-slate-700/80 shadow-md">
                  <button
                    type="button"
                    onClick={() => setPdfAnnotateActive(!pdfAnnotateActive)}
                    className={`px-3 py-1 text-[11px] font-bold transition-all ${
                      pdfAnnotateActive ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                    } rounded-lg cursor-pointer`}
                  >
                    {pdfAnnotateActive ? '✏️ بستن قلم‌ موی تدریس' : '✏️ نوشتن و ترسیم روی فایل'}
                  </button>
                  
                  {pdfAnnotateActive && (
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        {['#ef4444', '#3b82f6', '#10b981', '#fbbf24', '#ffffff'].map(clr => (
                          <button
                            key={clr}
                            type="button"
                            onClick={() => setPdfDrawColor(clr)}
                            className="w-4 h-4 rounded-full border border-white/60 shadow-inner cursor-pointer"
                            style={{ backgroundColor: clr, transform: pdfDrawColor === clr ? 'scale(1.25)' : 'none' }}
                          />
                        ))}
                      </div>
                      <span className="w-[1px] h-4 bg-slate-700"></span>
                      <button
                        type="button"
                        onClick={clearPdfAnnotation}
                        className="px-2 py-0.5 bg-slate-800 text-[10px] text-rose-300 hover:text-rose-100 hover:bg-rose-950 rounded border border-rose-900/50 cursor-pointer"
                      >
                        پاکسازی نشانه‌ها
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Inner scalable canvas/media holder wrapper */}
              <div 
                className="w-full h-full relative flex items-center justify-center overflow-auto transition-transform duration-100"
                style={{ transform: `scale(${mediaScale})`, transformOrigin: 'center center' }}
              >
                {activeMediaType === 'video' ? (
                  activeMediaUrl === 'demo' ? (
                    <div className="p-6 text-center text-slate-400 flex flex-col items-center font-sans">
                      <Video size={40} className="text-slate-400 mb-2" />
                      <p className="text-xs font-bold text-white mb-1">پخش زنده ویدیوی آموزشی کلاسی</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed">فایل ویدئویی شما آپلود شده و برای تماشا در اینترنت آماده پخش است.</p>
                    </div>
                  ) : (
                    <video 
                      src={activeMediaUrl} 
                      controls 
                      autoPlay
                      className="w-full h-full object-contain max-h-[440px]"
                    />
                  )
                ) : activeMediaType === 'image' ? (
                  <img 
                    src={activeMediaUrl} 
                    alt={activeMediaName}
                    className="w-full h-full object-contain max-h-[440px]"
                    referrerPolicy="no-referrer"
                  />
                ) : activeMediaType === 'pdf' ? (
                  <iframe 
                    src={activeMediaUrl === 'demo' ? undefined : activeMediaUrl} 
                    className="w-full h-full bg-slate-100 border-none select-none"
                    style={{ height: '440px' }}
                    title={activeMediaName}
                  />
                ) : activeMediaType === 'audio' ? (
                  <div className="w-full p-8 bg-slate-900 text-white flex flex-col items-center justify-center font-sans space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-amber-500 flex items-center justify-center text-amber-500 shadow-xl relative animate-pulse">
                      <Headphones size={28} className="animate-bounce" />
                      <span className="absolute inset-0 rounded-full border border-amber-500 animate-ping opacity-25"></span>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[10px] text-amber-400 font-bold tracking-wider font-sans">گیرنده و پخش‌کننده فایل‌های صوتی کلاسی</p>
                      <p className="text-xs font-bold text-slate-200 mt-1 font-sans">{activeMediaName}</p>
                    </div>
                    <audio 
                      src={activeMediaUrl === 'demo' ? undefined : activeMediaUrl} 
                      controls 
                      autoPlay
                      className="w-full max-w-sm mt-3 shadow-md bg-slate-100 rounded-lg p-1"
                    />
                  </div>
                ) : null}

                {/* Annotation Canvas Plane drawn over whichever media is present */}
                {pdfAnnotateActive && activeMediaType !== 'audio' && (
                  <canvas
                    ref={pdfCanvasRef}
                    onMouseDown={startPdfDraw}
                    onMouseMove={drawPdf}
                    onMouseUp={stopPdfDraw}
                    onMouseLeave={stopPdfDraw}
                    onTouchStart={startPdfDraw}
                    onTouchMove={drawPdf}
                    onTouchEnd={stopPdfDraw}
                    className="absolute inset-0 z-20 cursor-pencil"
                    width={760} 
                    height={520} 
                    style={{ pointerEvents: 'auto', backgroundColor: 'transparent' }}
                  />
                )}
              </div>

              {activeMediaType !== 'audio' && (
                <div className="absolute bottom-3 right-3 z-10 bg-indigo-900/80 text-white rounded-full px-3 py-1 text-[10px] font-sans pointer-events-none">
                  نمای تعاملی با بزرگنمایی کلاس و قلم هایلایتر معلم
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
