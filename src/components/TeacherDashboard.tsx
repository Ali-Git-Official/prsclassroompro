import React, { useState } from 'react';
import { 
  Tv, 
  Hand, 
  Sparkles, 
  BookOpen, 
  UserCheck, 
  FileSpreadsheet, 
  Video, 
  Download, 
  Bell, 
  ArrowLeft,
  Link
} from 'lucide-react';
import Whiteboard from './Whiteboard';
import QuizBuilder from './QuizBuilder';
import AttendanceTracker from './AttendanceTracker';
import ChatSystem from './ChatSystem';
import FileManager from './FileManager';
import AudioVideoCall from './AudioVideoCall';
import { Student, Quiz, StudentSubmission, ChatMessage, ClassroomFile } from '../types';

interface TeacherDashboardProps {
  students: Student[];
  quizzes: Quiz[];
  submissions: StudentSubmission[];
  messages: ChatMessage[];
  files: ClassroomFile[];
  teacherName?: string;
  teacherAvatar?: string;
  onToggleStatus: (id: string, status: boolean | null | 'late') => void;
  onInstantRollCall: () => void;
  onToggleHand: (id: string, isRaised: boolean) => void;
  onClearHandRaises: () => void;
  onCreateQuiz: (quiz: Quiz) => void;
  onToggleQuiz: (id: string) => void;
  onUploadFile: (file: ClassroomFile) => void;
  onDeleteFile: (id: string) => void;
  onSendMessage: (text: string) => void;
  onDeleteMessage?: (id: string) => void;
  whiteboardData: string;
  setWhiteboardData: (data: string) => void;
  onLogout: () => void;
  activeCall: any;
  onStartCall: (type: 'video' | 'audio') => void;
  onStopCall: () => void;
  externalClassUrl?: string;
}

export default function TeacherDashboard({
  students,
  quizzes,
  submissions,
  messages,
  files,
  teacherName,
  teacherAvatar,
  onToggleStatus,
  onInstantRollCall,
  onToggleHand,
  onClearHandRaises,
  onCreateQuiz,
  onToggleQuiz,
  onUploadFile,
  onDeleteFile,
  onSendMessage,
  onDeleteMessage,
  whiteboardData,
  setWhiteboardData,
  onLogout,
  activeCall,
  onStartCall,
  onStopCall,
  externalClassUrl
}: TeacherDashboardProps) {
  
  // Tab control state to shrink vertical scroll height
  const [activeTab, setActiveTab] = useState<'whiteboard' | 'quizzes' | 'files' | 'attendance' | 'reports'>('whiteboard');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    try {
      const shareUrl = externalClassUrl || (window.location.origin + window.location.pathname);
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.warn("Could not copy link автоматически:", e);
    }
  };

  // Hand raise filtering
  const raisedHandsStudents = students.filter((s) => s.isHandRaised);

  return (
    <div className="space-y-4.5 text-right font-sans" id="prs-teacher-dashboard">
      
      {/* Top Banner Control Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-4.5 shadow-lg flex flex-col md:flex-row-reverse justify-between items-center gap-4">
        
        {/* Right Side: Identity information */}
        <div className="text-right md:text-right w-full md:w-auto">
          <div className="flex items-center gap-2 justify-end">
            <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 text-[10px] rounded-full font-bold">دبیر کلاس</span>
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight">پنل مدیریت {teacherName || "همکار دبیر"} {teacherAvatar || "👨‍🏫"}</h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            کلاس آنلاین فعال • سامانه ابری هماهنگ و یکپارچه بدون محدودیت جغرافیایی
          </p>
        </div>

        {/* Left Side: Handraise alert banner, Copy Link & Logout */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end sm:justify-start">
          {raisedHandsStudents.length > 0 && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-200 text-[10px] px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              <span>{raisedHandsStudents.length} دانش‌آموز دست بلند کرده است!</span>
              <button 
                onClick={onClearHandRaises}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-1.5 py-0.5 rounded text-[9px] transition-colors cursor-pointer"
              >
                پایین کشیدن دست‌ها
              </button>
            </div>
          )}
          
          <button 
            onClick={onLogout}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            id="btn-teacher-back"
          >
            <ArrowLeft size={13} />
            خروج از کلاس
          </button>
        </div>

      </div>

      {/* Grid: Main interactive workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Right Side Column (8 Cols): Segmented Tabs with Whiteboard, Quizzes, Files & Attendance */}
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
              تخته سفید کلاسی
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
              ارزشیابی و آزمون ({quizzes.length})
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
              جزوات و منابع ({files.length})
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer min-w-[110px] ${
                activeTab === 'attendance'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              <UserCheck size={13} />
              دفتر حضور و غیاب ({students.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer min-w-[110px] ${
                activeTab === 'reports'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 text-indigo-700 font-extrabold'
              }`}
              id="tab-trigger-reports"
            >
              <FileSpreadsheet size={13} />
              گزارش‌گیری کلاس
            </button>
          </div>

          {/* Active Tab Workspace Container */}
          <div className="transition-all duration-200">
            {activeTab === 'whiteboard' && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-1">
                <div className="p-3 bg-white border-b border-slate-100 flex justify-between items-center bg-gray-50/20">
                  <span className="text-[9px] text-slate-400">انتقال آنی ترسیم به مانیتور و پروژکتور دانش‌آموزان</span>
                  <h3 className="text-xs font-bold text-slate-700 font-sans flex items-center gap-1">
                    تخته سیاه الکترونیکی پیشرفته کلاس
                    <Tv size={13} className="text-indigo-600" />
                  </h3>
                </div>
                <Whiteboard 
                  role="teacher" 
                  onDataSync={setWhiteboardData} 
                />
              </div>
            )}

            {activeTab === 'quizzes' && (
              <QuizBuilder 
                role="teacher"
                quizzes={quizzes}
                onCreateQuiz={onCreateQuiz}
                onToggleQuiz={onToggleQuiz}
                submissions={submissions}
              />
            )}

            {activeTab === 'files' && (
              <FileManager 
                role="teacher"
                files={files}
                onUploadFile={onUploadFile}
                onDeleteFile={onDeleteFile}
              />
            )}

            {activeTab === 'attendance' && (
              <AttendanceTracker 
                role="teacher"
                students={students}
                onToggleStatus={onToggleStatus}
                onInstantRollCall={onInstantRollCall}
              />
            )}

            {activeTab === 'reports' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4" id="prs-reports-suite">
                <div className="flex items-center gap-2 justify-end pb-3 border-b border-slate-100 flex-row-reverse">
                  <FileSpreadsheet className="text-indigo-600" size={18} />
                  <h3 className="text-xs font-bold text-slate-900 font-sans">سامانه گزارش‌گیری پیشرفته کلاس هوشمند</h3>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed text-right font-sans">
                  از طریق پنل زیر می‌توانید گزارش‌های جامع و تفکیک‌شده دوره‌ای کلاس را به صورت آنلاین و فایل آفلاین خروجی بگیرید. اطلاعات مربوط به حضور و غیاب (با محاسبه دقیق تایمر آنلاین)، نمرات کوئیزها یا امتحانات فعال و آرشیو کامل چت به صورت فایل تفکیک شده استاندارد دانلود می‌شوند.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right font-sans">
                  
                  {/* Attendance Card */}
                  <div className="bg-slate-100 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between text-right hover:border-indigo-300 transition-colors">
                    <div>
                      <h4 className="font-extrabold text-[12px] text-slate-800">حضور و غیاب و زمان آنلاین</h4>
                      <p className="text-[10px] text-slate-600 mt-1.5 leading-relaxed">
                        شامل حضور و غیاب زنده کل دانش‌آموزان به همراه تایمر محاسبه دقیق ثانیه‌ای و دقیقه‌ای حضور و زمان ورود آنها.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const csvHeader = "\ufeff" + "کد دانش‌آموز,نام دانش‌آموز,وضعیت حضور,مدت زمان حضور\n";
                        const csvRows = students.map(s => {
                          const status = s.isPresent === true ? 'حاضر' : s.isPresent === 'late' ? 'تاخیر' : s.isPresent === false ? 'غایب' : 'بررسی نشده';
                          const min = Math.floor((s.presenceSeconds || 0) / 60);
                          const sec = (s.presenceSeconds || 0) % 60;
                          const formattedTime = `${min} دقیقه و ${sec} ثانیه`;
                          return `"${s.id}","${s.name}","${status}","${formattedTime}"`;
                        }).join("\n");
                        
                        const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.setAttribute("href", url);
                        link.setAttribute("download", `گزارش_حضور_غیاب_کلاس_${Date.now()}.csv`);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-md border border-indigo-500/30"
                    >
                      <Download size={11} />
                      دانلود لیست حضور (CSV)
                    </button>
                  </div>

                  {/* Quizzes results card */}
                  <div className="bg-slate-100 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between text-right hover:border-emerald-300 transition-colors">
                    <div>
                      <h4 className="font-extrabold text-[12px] text-slate-800">نمرات و کارنامه آزمون‌ها</h4>
                      <p className="text-[10px] text-slate-600 mt-1.5 leading-relaxed">
                        شامل وضعیت نمره دانش‌آموزان، کوئیزهای فعال و پاسخ‌نامه‌ها به همراه فیدبک ثبت شده توسط دبیر.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const csvHeader = "\ufeff" + "نام دانش‌آموز,کد دانش‌آموز,عنوان آزمون,نمره حاصله,وضعیت تصحیح\n";
                        const csvRows = submissions.map(sub => {
                          return `"${sub.studentName}","${sub.studentId}","کارنامه آزمون کلاسی","${sub.score || '۰'}","${sub.isGraded ? 'تصحیح شده' : 'در دست تصحیح'}"`;
                        }).join("\n");
                        
                        const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.setAttribute("href", url);
                        link.setAttribute("download", `نتایج_آزمون_های_کلاسی_${Date.now()}.csv`);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-md border border-emerald-500/30"
                    >
                      <Download size={11} />
                      دانلود کارنامه آزمون‌ها (CSV)
                    </button>
                  </div>

                  {/* Chats transcript card */}
                  <div className="bg-slate-100 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between text-right hover:border-teal-300 transition-colors">
                    <div>
                      <h4 className="font-extrabold text-[12px] text-slate-800">بایگانی گفتگو و چت کلاس</h4>
                      <p className="text-[10px] text-slate-600 mt-1.5 leading-relaxed">
                        شامل خروجی پیوسته و متنی خوانا از پیام‌های رد و بدل شده در تالار گفتگو به همراه نام فرستنده و ساعت پیام.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        let transcript = `بایگانی گفتگوی تعاملی کلاس درس آنلاین P.R.S Classroom Pro\n`;
                        transcript += `تاریخ گزارش‌گیری: ${new Date().toLocaleString('fa-IR')}\n`;
                        transcript += `==============================================\n\n`;
                        
                        if (messages.length === 0) {
                          transcript += `هیچ پیامی در این جلسه ثبت نشده است.`;
                        } else {
                          messages.forEach(msg => {
                            const senderType = msg.senderRole === 'teacher' ? 'دبیر' : 'دانش‌آموز';
                            transcript += `[${msg.timestamp}] ${msg.senderName} (${senderType}): ${msg.text}\n`;
                          });
                        }
                        
                        const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.setAttribute("href", url);
                        link.setAttribute("download", `آرشیو_چت_کلاس_${Date.now()}.txt`);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="mt-4 w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-md border border-teal-500/30"
                    >
                      <Download size={11} />
                      دانلود بایگانی چت (TXT)
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>

        </div>

        {/* Left Side Column (4 Cols): Live Communication Stream - Height constrained for zero scroll */}
        <div className="lg:col-span-4 space-y-4">

          {/* Hand Raise Live Action Drawer - Inline Alert Card */}
          {raisedHandsStudents.length > 0 && (
            <div className="bg-gradient-to-tr from-rose-50 to-red-50/20 border border-rose-200 rounded-2xl p-3.5 shadow-xs space-y-2.5">
              <h4 className="text-xs font-bold text-rose-800 flex items-center justify-end gap-1.5">
                درخواست پرسش و پاسخ فعال کلاسی
                <Hand size={13} className="text-rose-600 animate-bounce" />
              </h4>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-0.5">
                {raisedHandsStudents.map((stu) => (
                  <div key={stu.id} className="p-2 bg-white rounded-xl border border-rose-100 flex justify-between items-center text-[11px]">
                    <button 
                      onClick={() => onToggleHand(stu.id, false)}
                      className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold cursor-pointer"
                    >
                      تایید صحبت کلاسی
                    </button>
                    <div className="text-right">
                      <p className="font-bold text-slate-700">{stu.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audio Video Conference Live */}
          <AudioVideoCall 
            role="teacher"
            userId="teacher-id"
            userName={teacherName || "استاد مجیدی"}
            userAvatar={teacherAvatar || "👨‍🏫"}
            activeCall={activeCall}
            onStartCall={onStartCall}
            onStopCall={onStopCall}
          />

          {/* Live Chat Cabinet (Constrained height inside the layout) */}
          <ChatSystem 
            role="teacher"
            userId="teacher-id"
            userName={teacherName || "استاد مجیدی"}
            userAvatar={teacherAvatar || "👨‍🏫"}
            messages={messages}
            onSendMessage={onSendMessage}
            onDeleteMessage={onDeleteMessage}
          />

        </div>

      </div>

    </div>
  );
}
