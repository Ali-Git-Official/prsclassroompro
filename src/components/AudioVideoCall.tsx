import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Phone, 
  Monitor, 
  Sparkles, 
  Headphones, 
  User, 
  Volume2, 
  Camera,
  Layers,
  HelpCircle
} from 'lucide-react';

interface AudioVideoCallProps {
  role: 'teacher' | 'student';
  userId: string;
  userName: string;
  userAvatar: string;
  activeCall: {
    isActive: boolean;
    hostId: string;
    hostName: string;
    hostAvatar: string;
    type: 'video' | 'audio';
    startedAt: string;
    participants?: {
      id: string;
      name: string;
      avatar: string;
      micActive: boolean;
      videoActive: boolean;
    }[];
  } | null;
  onStartCall: (type: 'video' | 'audio') => void;
  onStopCall: () => void;
}

export default function AudioVideoCall({
  role,
  userId,
  userName,
  userAvatar,
  activeCall,
  onStartCall,
  onStopCall
}: AudioVideoCallProps) {
  const [inCall, setInCall] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [videoFilter, setVideoFilter] = useState<'none' | 'sepia' | 'grayscale' | 'blur' | 'indigo'>('none');
  const [streamError, setStreamError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Native Ringtone Chime synthesizer using Web Audio API
  const playRingtone = (type: 'call' | 'connect' | 'disconnect') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (type === 'call') {
        // Continuous telephone ring (Synthesized)
        const playRing = (delay: number) => {
          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(audioCtx.destination);

          osc1.frequency.setValueAtTime(440, audioCtx.currentTime + delay);
          osc2.frequency.setValueAtTime(480, audioCtx.currentTime + delay);
          
          gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + delay + 0.1);
          gain.gain.setValueAtTime(0.08, audioCtx.currentTime + delay + 0.8);
          gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + delay + 1.0);

          osc1.start(audioCtx.currentTime + delay);
          osc2.start(audioCtx.currentTime + delay);
          osc1.stop(audioCtx.currentTime + delay + 1.2);
          osc2.stop(audioCtx.currentTime + delay + 1.2);
        };
        playRing(0);
        playRing(1.4);
      } else if (type === 'connect') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio fallback
    }
  };

  // Join the ongoing call automatically if a student notices the call is active
  useEffect(() => {
    if (activeCall && activeCall.isActive && !inCall) {
      // Auto sound reminder about call
      playRingtone('call');
    }
    if (!activeCall && inCall) {
      // Call ended by teacher
      stopStreams();
      setInCall(false);
      playRingtone('disconnect');
    }
  }, [activeCall]);

  // Send student presence state to the central server
  useEffect(() => {
    if (role !== 'student') return;
    
    if (inCall) {
      fetch('/api/call/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: userId,
          name: userName,
          avatar: userAvatar,
          micActive,
          videoActive
        })
      }).catch(e => console.warn("مشکل در همگام‌سازی ورود به مکالمه:", e));
    } else {
      fetch('/api/call/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: userId })
      }).catch(e => console.warn("مشکل در همگام‌سازی خروج از مکالمه:", e));
    }

    return () => {
      if (inCall && role === 'student') {
        fetch('/api/call/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: userId })
        }).catch(e => console.warn("مشکل در قطع خودکار همگام‌سازی:", e));
      }
    };
  }, [inCall, micActive, videoActive, role, userId, userName, userAvatar]);

  const startStreams = async () => {
    setStreamError(null);
    try {
      // Check for available devices
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoActive,
        audio: micActive
      });
      mediaStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Could not load real stream media devices:", err);
      setStreamError("عدم دسترسی به سخت‌افزار دوربین/میکروفون (در حال لود دستی شبیه‌ساز حرفه‌ای)");
    }
  };

  const stopStreams = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setScreenShareActive(false);
  };

  const handleStartCall = async (type: 'video' | 'audio') => {
    playRingtone('connect');
    onStartCall(type);
    setInCall(true);
    await startStreams();
  };

  const handleJoinCall = async () => {
    playRingtone('connect');
    setInCall(true);
    await startStreams();
  };

  const handleLeaveCall = () => {
    playRingtone('disconnect');
    stopStreams();
    setInCall(false);
    if (role === 'teacher') {
      onStopCall();
    }
  };

  const handleToggleMic = () => {
    const isNext = !micActive;
    setMicActive(isNext);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isNext;
      });
    }
  };

  const handleToggleVideo = async () => {
    const isNext = !videoActive;
    setVideoActive(isNext);
    
    if (!isNext) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach(track => {
          track.enabled = false;
          track.stop();
        });
      }
    } else {
      await startStreams();
    }
  };

  const handleToggleScreenShare = async () => {
    if (screenShareActive) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      setScreenShareActive(false);
      // fallback to normal stream
      await startStreams();
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setScreenShareActive(true);
        
        // Stop stream logic when user clicks browser's native stop share button
        stream.getVideoTracks()[0].onended = () => {
          setScreenShareActive(false);
          startStreams();
        };
      } catch (err) {
        console.warn("Screen share cancelled or failed:", err);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreams();
    };
  }, []);

  return (
    <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden p-3.5 space-y-3 animate-fade-in font-sans text-right relative">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Header Block */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {inCall || (activeCall && activeCall.isActive) ? (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-bold rounded-lg border border-red-500/30 flex items-center gap-1 animate-pulse">
              <span className="w-1 h-1 rounded-full bg-red-500"></span>
              کنفرانس زنده فعال
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[9px] font-bold rounded-lg border border-slate-700/50">
              غیر فعال
            </span>
          )}
        </div>
        <h3 className="text-[11px] font-bold flex items-center gap-1.5 text-slate-100">
          پلتفرم گفتگوی صوتی و تصویری زنده کلاس
          <Video size={13} className="text-indigo-400 animate-pulse" />
        </h3>
      </div>

      {/* Screen 1: Disconnected State / Start or Join Call triggers */}
      {!inCall && (
        <div className="py-2 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 animate-pulse">
            <Volume2 size={18} />
          </div>

          {role === 'teacher' ? (
            <div className="space-y-2 max-w-sm">
              <h4 className="text-[11.5px] font-bold text-slate-200">تدریس با گفتگوی صوتی و تصویری زنده</h4>
              <p className="text-[9.5px] text-slate-400 leading-relaxed font-sans">
                برقراری ارتباط دوطرفه زنده وب‌کم کلاسی با دانش‌آموزان تحت وب پایدار بدون قطعی.
              </p>
              
              <div className="flex gap-1.5 justify-center pt-1">
                <button
                  type="button"
                  onClick={() => handleStartCall('video')}
                  className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/40 text-[9.5px] font-bold rounded-lg transition-all flex items-center gap-1 active:scale-95 cursor-pointer text-white shadow-md font-sans"
                >
                  <Video size={11} />
                  تماس تصویری کلاس
                </button>
                
                <button
                  type="button"
                  onClick={() => handleStartCall('audio')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[9.5px] font-bold rounded-lg transition-all flex items-center gap-1 active:scale-95 cursor-pointer text-slate-200 font-sans"
                >
                  <Mic size={11} />
                  تماس صوتی
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-w-sm">
              {activeCall && activeCall.isActive ? (
                <>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 text-amber-200 text-[10px] space-y-0.5 my-1">
                    <p className="font-bold">🔔 تماس ورودی از دبیر کلاس ({activeCall.hostName})</p>
                    <p className="text-[9px] opacity-80">معلم از شما دعوت می‌کند به تماس صوتی و تصویری زنده بپیوندید.</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleJoinCall}
                    className="w-full py-1.5 bg-green-600 hover:bg-green-700 font-extrabold text-[9.5px] rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer text-white animate-bounce shadow-md"
                  >
                    <Phone size={11} className="animate-pulse" />
                    ورود به مکالمه کلاسی زنده
                  </button>
                </>
              ) : (
                <>
                  <h4 className="text-[11.5px] font-bold text-slate-300">منتظر تماس کلاسی معلم...</h4>
                  <p className="text-[9.5px] text-slate-500 leading-relaxed font-sans">
                    به محض استارت تماس تصویری توسط دبیر، گزینه اتصال همینجا فعال می‌شود.
                  </p>
                  <div className="inline-flex gap-1 items-center justify-center text-[9px] text-slate-500 bg-slate-900 px-2 rounded-full">
                    <span className="w-1 h-1 rounded-full bg-indigo-500 animate-ping"></span>
                    مانیتورینگ فعال وب
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Screen 2: Active Call Grid Panel */}
      {inCall && (
        <div className="space-y-4">
          
          {/* Main Visual Feeds (Grid or Single card representing screen/streams) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            
            {/* Host / Primary Card (Teacher) */}
            <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative aspect-video flex flex-col justify-between">
              
              {/* Overlay indicators */}
              <div className="absolute top-2 left-2 z-10 bg-slate-950/80 text-[9px] px-2 py-0.5 rounded-md font-sans flex items-center gap-1 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                مستقیم / میزبان کلاس
              </div>
              
              {/* Media element or Simulator */}
              {((role === 'teacher' && videoActive) || (role === 'student' && activeCall?.type === 'video')) && !streamError ? (
                <video
                  ref={role === 'teacher' ? localVideoRef : remoteVideoRef}
                  autoPlay
                  playsInline
                  muted={role === 'teacher'}
                  className="w-full h-full object-cover"
                  style={{
                    filter: videoFilter === 'sepia' ? 'sepia(1)' :
                            videoFilter === 'grayscale' ? 'grayscale(1)' :
                            videoFilter === 'blur' ? 'blur(3px)' :
                            videoFilter === 'indigo' ? 'hue-rotate(60deg) saturate(1.5)' : 'none'
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 relative">
                  <div className="w-12 h-12 rounded-full bg-indigo-650 border border-indigo-400/30 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-950/50 animate-pulse relative">
                    <span className="absolute inset-0 rounded-full border border-indigo-400 animate-ping opacity-40"></span>
                    {role === 'teacher' ? userAvatar || '👨‍🏫' : activeCall?.hostAvatar || '👨‍🏫'}
                  </div>
                  <div className="text-center mt-2.5">
                    <p className="text-[11px] font-bold text-slate-200">
                      {role === 'teacher' ? userName : activeCall?.hostName}
                    </p>
                    <p className="text-[8px] text-slate-400 mt-1 select-none">سیگنال بدون تصویر فعال است</p>
                  </div>
                  
                  {/* Dynamic soundwaves bars */}
                  {(role === 'teacher' ? micActive : true) && (
                    <div className="flex gap-0.5 items-end justify-center h-4 mt-2">
                      {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                        <span 
                          key={i} 
                          className="w-[1.5px] bg-indigo-400 rounded-full animate-pulse"
                          style={{
                            height: `${h * 3}px`,
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: '0.6s'
                          }}
                        ></span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom label bar */}
              <div className="p-2 bg-gradient-to-t from-slate-950/90 to-transparent flex justify-between items-center z-10">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  {role === 'teacher' && !micActive && <MicOff size={10} className="text-red-400" />}
                  {role === 'teacher' ? '(دبیر کلاس / شما)' : '(معلم کلاس)'}
                </span>
                <span className="text-[10px] font-bold text-white leading-none">
                  {role === 'teacher' ? userName : activeCall?.hostName}
                </span>
              </div>
            </div>

            {/* Subscriber / Student's self-video block (only displayed if we are a student) */}
            {role === 'student' && (
              <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative aspect-video flex flex-col justify-between">
                
                {/* Overlay indicator */}
                <div className="absolute top-2 left-2 z-10 bg-slate-950/80 text-[9px] px-2 py-0.5 rounded-md font-sans flex items-center gap-1 text-slate-300">
                  دستگاه شما
                </div>

                {/* Media stream local for student */}
                {videoActive && !streamError ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 relative">
                    <div className="w-12 h-12 rounded-full bg-teal-650 border border-teal-400/20 flex items-center justify-center text-white text-xl shadow-lg shadow-teal-950 relative">
                      {userAvatar || '🎓'}
                    </div>
                    <div className="text-center mt-2.5">
                      <p className="text-[11px] font-bold text-slate-200">
                        {userName}
                      </p>
                      <p className="text-[8px] text-teal-400 mt-1 select-none">میکروفون و وب‌کم شما فعال است</p>
                    </div>
                    
                    {/* Dynamic soundwaves bars green */}
                    {micActive && (
                      <div className="flex gap-0.5 items-end justify-center h-4 mt-2">
                        {[1, 2, 3, 2, 4, 3, 5, 2, 1].map((h, i) => (
                          <span 
                            key={i} 
                            className="w-[1.5px] bg-teal-400 rounded-full animate-bounce"
                            style={{
                              height: `${h * 2.8}px`,
                              animationDelay: `${i * 0.08}s`,
                              animationDuration: '0.8s'
                            }}
                          ></span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom label bar */}
                <div className="p-2 bg-gradient-to-t from-slate-950/90 to-transparent flex justify-between items-center z-10">
                  <span className="text-[10px] text-slate-400">
                    {micActive ? 'رصد فرکانس صوتی فعال' : 'صدا قطع است'}
                  </span>
                  <span className="text-[10px] font-bold text-white leading-none">
                    {userName} (شما)
                  </span>
                </div>
              </div>
            )}

            {/* Other Active Class Students currently in call (Synced from activeCall.participants) */}
            {activeCall?.participants && activeCall.participants
              .filter((p: any) => p.id !== userId) // Filter out current self student
              .map((studentPart: any) => (
                <div 
                  key={studentPart.id} 
                  className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative aspect-video flex flex-col justify-between"
                >
                  {/* Overlay indicators */}
                  <div className="absolute top-2 left-2 z-10 bg-slate-950/80 text-[9px] px-2 py-0.5 rounded-md font-sans flex items-center gap-1 text-slate-300">
                    حاضر در تماس کلاسی
                  </div>
                  
                  {studentPart.videoActive ? (
                    <div className="w-full h-full relative bg-slate-950 overflow-hidden flex flex-col items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-tr from-teal-900/10 via-indigo-900/10 to-transparent animate-pulse"></div>
                      <div className="w-12 h-12 rounded-full bg-teal-750 border border-teal-500/20 flex items-center justify-center text-white text-lg shadow-lg relative z-10">
                        {studentPart.avatar || '🎓'}
                      </div>
                      <div className="inline-flex items-center gap-1 bg-slate-900/80 rounded-full px-2 py-0.5 text-[8px] text-teal-400 mt-2 relative z-10 border border-teal-500/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping"></span>
                        وب‌کم فعال دانش‌آموز
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 relative">
                      <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-white text-lg shadow-lg">
                        {studentPart.avatar || '🎓'}
                      </div>
                      <div className="text-center mt-2.5">
                        <p className="text-[11px] font-bold text-slate-300">
                          {studentPart.name}
                        </p>
                        <p className="text-[8px] text-slate-500 mt-1 select-none">وب‌کم خاموش</p>
                      </div>
                    </div>
                  )}

                  {/* Bottom label bar */}
                  <div className="p-2 bg-gradient-to-t from-slate-950/90 to-transparent flex justify-between items-center z-10">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      {!studentPart.micActive && <MicOff size={10} className="text-red-400" />}
                      {studentPart.micActive ? 'گوینده فعال' : 'بدون صدا'}
                    </span>
                    <span className="text-[10px] font-bold text-white leading-none">
                      {studentPart.name}
                    </span>
                  </div>
                </div>
              ))}

          </div>

          {/* Device Stream Warning Error if blocked */}
          {streamError && (
            <div className="bg-amber-900/15 border border-amber-900/40 p-2 text-[9px] text-amber-200 rounded-lg flex items-center gap-1 font-sans justify-end">
              <span>{streamError}</span>
              <Sparkles size={10} className="shrink-0 text-amber-400" />
            </div>
          )}

          {/* Action Call Controller Toolbar */}
          <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-800 flex justify-between items-center flex-wrap gap-2">
            
            {/* Filter buttons list if video is active (Teacher exclusive) */}
            {role === 'teacher' && videoActive && (
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span>فیلتر وب‌کم:</span>
                {['none', 'sepia', 'grayscale', 'blur', 'indigo'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setVideoFilter(f as any)}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${videoFilter === f ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                  >
                    {f === 'none' ? 'طبیعی' : f === 'sepia' ? 'کلاسیک' : f === 'grayscale' ? 'سیاه‌وسفید' : f === 'blur' ? 'تار' : 'آبی'}
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-1.5 justify-end w-full sm:w-auto">
              {/* Mic state button */}
              <button
                type="button"
                onClick={handleToggleMic}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${micActive ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-600/50' : 'bg-red-950 text-red-400 border border-red-900/40'}`}
                title={micActive ? "میکروفون فعال است" : "میکروفون بسته است"}
              >
                {micActive ? <Mic size={14} /> : <MicOff size={14} />}
              </button>

              {/* Camera state button */}
              <button
                type="button"
                onClick={handleToggleVideo}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${videoActive ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-600/50' : 'bg-red-950 text-red-400 border border-red-900/40'}`}
                title={videoActive ? "دوربین وب‌کم فعال است" : "دوربین وب‌کم بسته است"}
              >
                {videoActive ? <Video size={14} /> : <VideoOff size={14} />}
              </button>

              {/* Native Screen sharing simulation */}
              <button
                type="button"
                onClick={handleToggleScreenShare}
                className={`p-2 rounded-lg transition-colors cursor-pointer hidden sm:flex ${screenShareActive ? 'bg-green-600 text-white animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                title={screenShareActive ? "درحال اشتراک‌گذاری صفحه" : "اشتراک‌گذاری صفحه نمایش دسکتاپ"}
              >
                <Monitor size={14} />
              </button>

              {/* Red Quit Hangup button */}
              <button
                type="button"
                onClick={handleLeaveCall}
                className="px-4 py-2 bg-red-650 hover:bg-red-600 border border-red-500/40 text-[10px] font-bold rounded-lg text-white flex items-center gap-1 shadow-sm transition-all duration-205 cursor-pointer active:scale-95"
              >
                <PhoneOff size={13} />
                قطع اتصال مکالمه کلاسی
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
