import React, { useState } from 'react';
import { 
  GraduationCap, 
  UserCheck, 
  Sparkles, 
  User, 
  Users,
  AlertCircle,
  Info
} from 'lucide-react';
import { Role } from '../types';
import AboutUsModal from './AboutUsModal';

interface WelcomeScreenProps {
  onSelectRole: (role: Role, customName?: string, studentId?: string, customAvatar?: string) => void;
  externalClassUrl?: string;
}

export default function WelcomeScreen({ onSelectRole, externalClassUrl }: WelcomeScreenProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [copiedWelcome, setCopiedWelcome] = useState(false);
  
  // Student form states
  const [studentName, setStudentName] = useState('');
  const [studentAvatar, setStudentAvatar] = useState('🎓');

  // Teacher form states
  const [teacherName, setTeacherName] = useState('');
  const [teacherAvatar, setTeacherAvatar] = useState('👨‍🏫');

  // About us modal state
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentName.trim()) {
      onSelectRole('student', studentName.trim(), `stu-custom-${Date.now()}`, studentAvatar);
    }
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teacherName.trim()) {
      onSelectRole('teacher', teacherName.trim(), undefined, teacherAvatar);
    } else {
      // If blank, pass fallback default teacher name
      onSelectRole('teacher', 'استاد مجیدی', undefined, teacherAvatar);
    }
  };

  return (
    <div className="min-h-[550px] flex items-center justify-center p-4 select-none font-sans text-right" id="prs-welcome-screen">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col p-6 sm:p-10 space-y-8 animate-fade-in relative">
        
        {/* Branding Title */}
        <div className="text-center space-y-3 relative pt-6 sm:pt-4">
          {/* About us icon button */}
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="absolute left-0 top-0 px-3 py-1.5 text-indigo-700 hover:text-white bg-indigo-50 hover:bg-slate-900 border border-indigo-100/60 hover:border-slate-900 rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-1.5 text-[10px] font-bold"
            id="welcome-about-us-trigger"
          >
            <Sparkles size={11} className="text-indigo-500 shrink-0 select-none animate-pulse" />
            <span>درباره ما</span>
          </button>

          <div className="mx-auto w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-xs">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans">
              P.R.S Classroom Pro
            </h1>
          </div>
        </div>

        {selectedRole === null ? (
          /* Role Selector Options */
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider mb-2">نقش خود را برای ورود انتخاب کنید</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Teacher options */}
              <button
                type="button"
                onClick={() => setSelectedRole('teacher')}
                className="p-6 border border-slate-200/80 hover:border-indigo-650 rounded-2xl bg-white hover:bg-indigo-50/10 shadow-sm hover:shadow-md text-right transition-all duration-300 flex flex-col justify-between group active:scale-[0.98] cursor-pointer"
                id="select-role-teacher"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-650 group-hover:text-white transition-all duration-300 shadow-sm">
                  <UserCheck size={20} className="transition-transform group-hover:scale-110 duration-300" />
                </div>
                <div className="mt-8 space-y-1">
                  <span className="text-xs font-extrabold text-slate-900 block group-hover:text-indigo-750 transition-colors">ورود مدرس / معلم</span>
                  <span className="text-[10px] text-slate-500 block leading-relaxed">طراحی بورد، کوییزهای آزمونی، نظارت و آمار حضور و غیاب کلاسی</span>
                </div>
              </button>

              {/* Student options */}
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className="p-6 border border-slate-200/80 hover:border-teal-650 rounded-2xl bg-white hover:bg-teal-50/10 shadow-sm hover:shadow-md text-right transition-all duration-300 flex flex-col justify-between group active:scale-[0.98] cursor-pointer"
                id="select-role-student"
              >
                <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-650 group-hover:text-white transition-all duration-300 shadow-sm">
                  <User size={20} className="transition-transform group-hover:scale-110 duration-300" />
                </div>
                <div className="mt-8 space-y-1">
                  <span className="text-xs font-extrabold text-slate-900 block group-hover:text-teal-750 transition-colors">ورود به عنوان دانش‌آموز</span>
                  <span className="text-[10px] text-slate-500 block leading-relaxed">تماشای زنده تخته، ارسال پاسخ آزمون‌ها، گفتگوی کلاس و دست بالا آوردن</span>
                </div>
              </button>
            </div>
          </div>
        ) : selectedRole === 'student' ? (
          /* Student Detailed Enter panel */
          <form onSubmit={handleStudentSubmit} className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <button 
                type="button"
                onClick={() => setSelectedRole(null)}
                className="text-[10px] font-semibold text-slate-400 hover:text-slate-800 transition-colors"
              >
                بازگشت به انتخاب نقش
              </button>
              <h3 className="text-xs font-semibold text-slate-800">ثبت اطلاعات دانش‌آموز</h3>
            </div>

            {/* Custom student name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 block font-sans">نام و نام‌خانوادگی خود را بنویسید:</label>
              <input 
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="مثال: محمدامین احمدی"
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-right focus:outline-none focus:border-slate-900 transition-colors font-sans"
                required
              />
            </div>

            {/* Custom student avatar selection */}
            <div className="space-y-2 text-right">
              <label className="text-[11px] font-semibold text-slate-500 block">انتخاب آواتار دلخواه (ایموجی):</label>
              <div className="flex flex-col items-center sm:items-end gap-3 justify-end">
                <div className="flex items-center gap-2.5">
                  <input 
                    type="text"
                    value={studentAvatar}
                    onChange={(e) => setStudentAvatar(e.target.value.slice(0, 4))}
                    className="w-12 h-12 text-center text-xl bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 font-sans"
                    placeholder="🎓"
                  />
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl border border-slate-200 shadow-xs">
                    {studentAvatar || '👤'}
                  </div>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 w-full justify-items-end">
                  {['🎓', '💻', '💡', '📖', '🚀', '🎨', '🔬', '⚽', '🍕', '🌟', '🎒', '📝'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setStudentAvatar(emoji)}
                      className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center border transition-all cursor-pointer ${
                        studentAvatar === emoji 
                          ? 'border-slate-900 bg-slate-100 shadow-xs scale-105' 
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-[0.99] cursor-pointer"
              id="student-submit-entrance"
            >
              ثبت نهایی و ورود به کلاس آنلاین
            </button>
          </form>
        ) : (
          /* Teacher Detailed Enter panel */
          <form onSubmit={handleTeacherSubmit} className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <button 
                type="button"
                onClick={() => setSelectedRole(null)}
                className="text-[10px] font-semibold text-slate-400 hover:text-slate-800 transition-colors"
              >
                بازگشت به انتخاب نقش
              </button>
              <h3 className="text-xs font-semibold text-slate-800">ثبت اطلاعات معلم کلاس</h3>
            </div>

            {/* Custom teacher name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 block font-sans">نام و نام‌خانوادگی دبیر:</label>
              <input 
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="مثال: استاد مجیدی"
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-right focus:outline-none focus:border-slate-900 transition-colors font-sans"
                required
              />
            </div>

            {/* Custom teacher avatar selection */}
            <div className="space-y-2 text-right">
              <label className="text-[11px] font-semibold text-slate-500 block">انتخاب آواتار دبیر (ایموجی):</label>
              <div className="flex flex-col items-center sm:items-end gap-3 justify-end">
                <div className="flex items-center gap-2.5">
                  <input 
                    type="text"
                    value={teacherAvatar}
                    onChange={(e) => setTeacherAvatar(e.target.value.slice(0, 4))}
                    className="w-12 h-12 text-center text-xl bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 font-sans"
                    placeholder="👨‍🏫"
                  />
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl border border-slate-200 shadow-xs">
                    {teacherAvatar || '👤'}
                  </div>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 w-full justify-items-end">
                  {['👨‍🏫', '👩‍🏫', '🎓', '💡', '📚', '🎒', '✨', '🧠', '💼'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setTeacherAvatar(emoji)}
                      className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center border transition-all cursor-pointer ${
                        teacherAvatar === emoji 
                          ? 'border-slate-900 bg-slate-100 shadow-xs scale-105' 
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-[0.99] cursor-pointer"
              id="teacher-submit-entrance"
            >
              ثبت نهایی و ورود به پنل مدیریت کلاس
            </button>
          </form>
        )}

        {/* About Us Modal Integration */}
        <AboutUsModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      </div>
    </div>
  );
}
