import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Hand, 
  Sparkles, 
  MessageSquare, 
  Tv, 
  FileDown, 
  Layers, 
  Clock, 
  BookOpen, 
  AlertCircle,
  UserCheck,
  Link
} from 'lucide-react';
import Whiteboard from './Whiteboard';
import QuizBuilder from './QuizBuilder';
import ChatSystem from './ChatSystem';
import FileManager from './FileManager';
import AudioVideoCall from './AudioVideoCall';
import { Student, Quiz, StudentSubmission, ChatMessage, ClassroomFile } from '../types';

interface StudentDashboardProps {
  student: Student;
  quizzes: Quiz[];
  submissions: StudentSubmission[];
  messages: ChatMessage[];
  files: ClassroomFile[];
  onToggleHand: (id: string, isRaised: boolean) => void;
  onSubmittingAnswer: (submission: StudentSubmission) => void;
  onSendMessage: (text: string) => void;
  onDeleteMessage?: (id: string) => void;
  whiteboardData: string;
  onLogout: () => void;
  activeCall: any;
  onStartCall: (type: 'video' | 'audio') => void;
  onStopCall: () => void;
  externalClassUrl?: string;
}

export default function StudentDashboard({
  student,
  quizzes,
  submissions,
  messages,
  files,
  onToggleHand,
  onSubmittingAnswer,
  onSendMessage,
  onDeleteMessage,
  whiteboardData,
  onLogout,
  activeCall,
  onStartCall,
  onStopCall,
  externalClassUrl
}: StudentDashboardProps) {
  
  // Tab control state to shrink vertical scroll height
  const [activeTab, setActiveTab] = useState<'whiteboard' | 'quizzes' | 'files' | 'performance'>('whiteboard');
  const [copiedLink, setCopiedLink] = useState(false);

  // Client-side student activity of sections/tabs opened and focus state tracking
  React.useEffect(() => {
    let focusState = true;
    try {
      focusState = document.hasFocus() && !document.hidden;
    } catch (_) {}

    const reportActivity = async (currTab: string, isFocused: boolean) => {
      try {
        await fetch('/api/students/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: student.id,
            lastActiveProgram: currTab,
            isWindowFocused: isFocused
          })
        });
      } catch (e) {
        // Fail silently during network transitions
      }
    };

    // Report initial status
    reportActivity(activeTab, focusState);

    // Event listeners
    const handleFocus = () => {
      reportActivity(activeTab, true);
    };
    const handleBlur = () => {
      reportActivity(activeTab, false);
    };
    const handleVisibility = () => {
      const isVisible = !document.hidden;
      reportActivity(activeTab, isVisible);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);

    // Periodic heartbeat to maintain dynamic consistency
    const timer = setInterval(() => {
      let currentFocus = true;
      try {
        currentFocus = document.hasFocus() && !document.hidden;
      } catch (_) {}
      reportActivity(activeTab, currentFocus);
    }, 4000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(timer);
    };
  }, [activeTab, student.id]);

  const handleCopyLink = () => {
    try {
      const shareUrl = externalClassUrl || (window.location.origin + window.location.pathname);
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.warn("Could not copy link:", e);
    }
  };

  // Find my submission if any
  const mySubmissionsCount = submissions.filter(s => s.studentId === student.id).length;
  const lastScore = submissions.find(s => s.studentId === student.id)?.score;

  return (
    <div className="space-y-4.5 text-right font-sans" id="prs-student-dashboard">
      
      {/* Student Banner/Status Row */}
      <div className="bg-slate-900 text-white rounded-2xl p-4.5 shadow-lg flex flex-col md:flex-row-reverse justify-between items-center gap-4">
        
        {/* Right Info */}
        <div className="text-right flex items-center gap-3 justify-end w-full md:w-auto">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="px-2 py-0.5 bg-sky-500/30 text-sky-200 text-[10px] rounded-full font-bold">نقش: دانش‌آموز کلاس</span>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">{student.name} خوش آمدی</h2>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              محیط مجازی تعاملی کلاس درس آنلاین • تصحیح هوشمند خودکار تکالیف و بورد دبیر
            </p>
          </div>
          {student.avatar && (student.avatar.startsWith('http') || student.avatar.startsWith('data:')) ? (
            <img 
              src={student.avatar} 
              alt={student.name} 
              className="w-10 h-10 rounded-full border-2 border-sky-400 shadow shadow-sky-450/40 object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full border-2 border-sky-400 bg-slate-800 text-white flex items-center justify-center text-xl shadow shadow-sky-450/40 select-none font-sans shrink-0">
              {student.avatar || '🎓'}
            </div>
          )}
        </div>

        {/* Left: Hand raising control & Leave */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end sm:justify-start">

          {/* Raise/Lower Hand Interactive Toggle */}
          <button 
            type="button"
            onClick={() => onToggleHand(student.id, !student.isHandRaised)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
              student.isHandRaised 
                ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
            id="student-hand-raise-btn"
          >
            <Hand size={13} className={student.isHandRaised ? 'animate-bounce' : ''} />
            {student.isHandRaised ? 'پایین آوردن دست ✋' : 'بلند کردن دست 🖐️'}
          </button>

          <button 
            onClick={onLogout}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            id="btn-student-logout"
          >
            <ArrowLeft size={13} />
            خروج از کلاس
          </button>
        </div>

      </div>

      {/* Grid workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Right Side Column (8 Cols): Whiteboard Live Monitor, Quizzes Answering, Shared Files */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Dashboard Segmented Tab Bar Switchers */}
          <div className="bg-slate-100 border border-slate-200 p-1.5 rounded-2xl flex flex-row-reverse gap-1 items-center overflow-x-auto scrollbar-none shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('whiteboard')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer min-w-[110px] ${
                activeTab === 'whiteboard'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              <Tv size={13} />
              پروژکتور زنده تخته
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab('quizzes')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer min-w-[110px] ${
                activeTab === 'quizzes'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              <Sparkles size={13} />
              حل کوئیز و تکالیف ({quizzes.length})
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab('files')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer min-w-[110px] ${
                activeTab === 'files'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              <BookOpen size={13} />
              دانلود منابع کلاس ({files.length})
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab('performance')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer min-w-[110px] ${
                activeTab === 'performance'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              <UserCheck size={13} />
              کارنامه و حضور من
            </button>
          </div>

          {/* Active Tab Workspace Container */}
          <div className="transition-all duration-200">
            {activeTab === 'whiteboard' && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-1">
                <div className="p-3 bg-white border-b border-slate-100 flex justify-between items-center bg-gray-50/20">
                  <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                    دریافت زنده ترسیمات دبیر
                  </span>
                  <h3 className="text-xs font-bold text-slate-700 font-sans flex items-center gap-1">
                    پروژکتور زنده تخته هوشمند دبیر
                    <Tv size={13} className="text-indigo-600" />
                  </h3>
                </div>
                <Whiteboard 
                  role="student" 
                  boardData={whiteboardData} 
                />
              </div>
            )}

            {activeTab === 'quizzes' && (
              <QuizBuilder 
                role="student"
                quizzes={quizzes}
                onCreateQuiz={() => {}}
                onToggleQuiz={() => {}}
                submissions={submissions}
                onSubmittingAnswer={onSubmittingAnswer}
                studentId={student.id}
                studentName={student.name}
              />
            )}

            {activeTab === 'files' && (
              <FileManager 
                role="student"
                files={files}
                onUploadFile={() => {}}
                onDeleteFile={() => {}}
              />
            )}

            {activeTab === 'performance' && (
              /* Personal Student Performance Card */
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-1.5 justify-end border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    جزئیات تکالیف و کارنامه حضور و غیاب شما
                    <BookOpen size={14} className="text-emerald-500 animate-pulse" />
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-600">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex justify-between items-center">
                    <span className="font-extrabold text-slate-900">{student.isPresent === true ? 'حاضر قطعی ✔️' : student.isPresent === 'late' ? 'تاخیر موجه ⏳' : 'عدم حضور / غایب'}</span>
                    <span>وضعیت حضور امروز شما:</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex justify-between items-center">
                    <span className="font-extrabold text-slate-900">{mySubmissionsCount} کوئیز پاسخ داده شده</span>
                    <span>تعداد تکالیف تایید شده:</span>
                  </div>

                  {lastScore !== undefined && (
                    <div className="p-3 bg-indigo-50 text-indigo-950 sm:col-span-2 rounded-xl border border-indigo-100 flex justify-between items-center">
                      <span className="font-black text-indigo-700 text-sm bg-white border border-indigo-200 px-3 py-1 rounded-lg">{lastScore} از ۲۰</span>
                      <span className="font-bold">آخرین نمره دریافتی ثبت شده شما:</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Left Side Column (4 Cols): Chat, Analytics report card */}
        <div className="lg:col-span-4 space-y-4">

          {/* Audio Video Conference Live */}
          <AudioVideoCall 
            role="student"
            userId={student.id}
            userName={student.name}
            userAvatar={student.avatar}
            activeCall={activeCall}
            onStartCall={onStartCall}
            onStopCall={onStopCall}
          />

          {/* Chat Panel */}
          <ChatSystem 
            role="student"
            userId={student.id}
            userName={student.name}
            userAvatar={student.avatar}
            messages={messages}
            onSendMessage={onSendMessage}
            onDeleteMessage={onDeleteMessage}
          />

        </div>

      </div>

    </div>
  );
}
