import React from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  HelpCircle, 
  Sparkles 
} from 'lucide-react';
import { Student } from '../types';

interface AttendanceTrackerProps {
  role: 'teacher' | 'student';
  students: Student[];
  onToggleStatus: (id: string, status: boolean | null | 'late') => void;
  onInstantRollCall?: () => void;
}

export default function AttendanceTracker({
  role,
  students,
  onToggleStatus,
  onInstantRollCall
}: AttendanceTrackerProps) {
  // Statistics
  const total = students.length;
  const presentCount = students.filter((s) => s.isPresent === true).length;
  const absentCount = students.filter((s) => s.isPresent === false).length;
  const lateCount = students.filter((s) => s.isPresent === 'late').length;

  const formatPresenceTime = (seconds?: number) => {
    if (!seconds) return '۰ ثانیه حضور';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const toFa = (n: number) => n.toLocaleString('fa-IR');
    if (m > 0) {
      return `${toFa(m)} دقیقه و ${toFa(s)} ثانیه حضور`;
    }
    return `${toFa(s)} ثانیه حضور`;
  };

  const getAttendanceRate = () => {
    if (total === 0) return 0;
    return Math.round(((presentCount + lateCount * 0.5) / total) * 100);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="prs-attendance-tracker">
      {/* Header section with counts */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3.5 mb-4 flex-wrap gap-2 text-right font-sans">
        {role === 'teacher' && onInstantRollCall && (
          <button 
            type="button"
            onClick={onInstantRollCall}
            className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
            id="instant-attendance-roll-call"
          >
            <Sparkles size={11} />
            حضور و غیاب هوشمند سریع
          </button>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          <Users className="text-slate-800" size={16} />
          <h3 className="text-xs font-bold text-slate-900">وضعیت و حضور و غیاب کلاس</h3>
        </div>
      </div>

      {/* Grid with visual statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 text-right font-sans">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 text-center">
          <p className="text-[10px] text-slate-500 font-semibold">کل دانش‌آموزان</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{total} نفر</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 text-center">
          <p className="text-[10px] text-slate-500 font-semibold">حاضر قطعی</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{presentCount}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 text-center">
          <p className="text-[10px] text-slate-500 font-semibold">مجموع تاخیرها</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{lateCount}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 text-center">
          <p className="text-[10px] text-slate-500 font-semibold font-sans">نرخ حضور کلی</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{getAttendanceRate()}%</p>
        </div>
      </div>

      {/* Main interactive list */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {students.map((student) => (
          <div 
            key={student.id} 
            className="p-3 bg-white hover:bg-slate-50/50 rounded-lg border border-slate-200/80 flex justify-between items-center transition-colors"
          >
            {/* Status change actions */}
            {role === 'teacher' ? (
              <div className="flex items-center gap-1 select-none">
                {/* Present Button */}
                <button 
                  onClick={() => onToggleStatus(student.id, true)}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    student.isPresent === true 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'bg-white hover:bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                  title="تایید حضور"
                  id={`btn-present-${student.id}`}
                >
                  <CheckCircle size={13} />
                </button>

                {/* Late Button */}
                <button 
                  onClick={() => onToggleStatus(student.id, 'late')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    student.isPresent === 'late' 
                      ? 'bg-slate-600 text-white shadow-xs' 
                      : 'bg-white hover:bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                  title="تاخیر ورود"
                  id={`btn-late-${student.id}`}
                >
                  <Clock size={13} />
                </button>

                {/* Absent Button */}
                <button 
                  onClick={() => onToggleStatus(student.id, false)}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    student.isPresent === false 
                      ? 'bg-rose-600 text-white shadow-xs' 
                      : 'bg-white hover:bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                  title="عدم حضور (غایب)"
                  id={`btn-absent-${student.id}`}
                >
                  <XCircle size={13} />
                </button>
              </div>
            ) : (
              /* Student View Status Badge */
              <div className="flex items-center gap-1.5 select-none font-sans">
                {student.isPresent === true && (
                  <span className="flex items-center gap-1 text-[9px] font-bold bg-slate-100 text-slate-900 px-2 py-1 rounded-full border border-slate-200">
                    <CheckCircle size={9} /> حاضر در کلاس
                  </span>
                )}
                {student.isPresent === 'late' && (
                  <span className="flex items-center gap-1 text-[9px] font-bold bg-slate-50 text-slate-700 px-2 py-1 rounded-full border border-slate-200">
                    <Clock size={9} /> با تاخیر موجه
                  </span>
                )}
                {student.isPresent === false && (
                  <span className="flex items-center gap-1 text-[9px] font-bold bg-rose-50 text-rose-700 px-2 py-1 rounded-full border border-rose-100">
                    <XCircle size={9} /> غیبت غیرموجه
                  </span>
                )}
                {student.isPresent === null && (
                  <span className="flex items-center gap-1 text-[9px] font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                    <HelpCircle size={9} /> منتظر بررسی دبیر
                  </span>
                )}
              </div>
            )}

            {/* Student Info right aligned */}
            <div className="flex items-center gap-2.5 text-right font-sans">
              <div>
                <p className="text-[11px] font-bold text-slate-900 font-sans">{student.name}</p>
                <div className="flex items-center gap-1 mt-0.5 justify-end">
                  {student.isHandRaised && (
                    <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse font-sans">
                      🖐️ درخواست صحبت
                    </span>
                  )}
                  <span className="text-[9px] bg-indigo-50 text-indigo-750 border border-indigo-150 px-1.5 py-0.5 rounded font-extrabold font-sans">
                    ⏱️ {formatPresenceTime(student.presenceSeconds)}
                  </span>
                </div>
              </div>
              {student.avatar && (student.avatar.startsWith('http') || student.avatar.startsWith('data:')) ? (
                <img 
                  src={student.avatar} 
                  alt={student.name} 
                  className="w-8 h-8 rounded-full border border-slate-200 shadow-xs object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-sm shadow-xs select-none">
                  {student.avatar || '🎓'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
