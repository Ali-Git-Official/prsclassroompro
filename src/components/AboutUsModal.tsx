import React from 'react';
import { 
  X, 
  User, 
  Mail, 
  Globe, 
  Phone, 
  GraduationCap, 
  Award,
  BookOpen, 
  Sparkles,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutUsModal({ isOpen, onClose }: AboutUsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-right select-none font-sans" id="about-us-modal">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
            id="close-about-us"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">درباره سامانه P.R.S Classroom Pro</span>
            <Sparkles size={16} className="text-indigo-600 animate-pulse" />
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
          
          {/* Logo & Platform info */}
          <div className="flex flex-col items-center text-center space-y-3 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/60">
            <div className="w-16 h-16 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-md border-2 border-indigo-200">
              <GraduationCap size={36} className="text-indigo-300" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">سـامـانـه هوشمـند تعاملی کـلاس درس</h2>
              <span className="text-xs font-mono font-bold text-indigo-700 tracking-wide mt-1 block">P.R.S Classroom Pro</span>
            </div>
            <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
              بستر پیشرفته تحت وب و آنلاین تعاملی جهت برگزاری کلاس‌های مدرن، آزمون‌های تعاملی و مانیتورینگ زنده تحصیلی کلاسی از سراسر جهان
            </p>
          </div>

          {/* Developer Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-800 border-r-2 border-slate-900 pr-2">شناسه و اطلاعات توسعه‌دهنده</h3>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3 font-sans">
              
              <div className="flex items-center justify-between flex-row-reverse text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <span>نام سازنده</span>
                  <User size={14} className="text-indigo-600" />
                </div>
                <span className="font-bold text-slate-800">علی امجدیان</span>
              </div>

              <div className="flex items-center justify-between flex-row-reverse text-xs border-t border-slate-200/60 pt-2.5">
                <div className="flex items-center gap-2 text-slate-600">
                  <span>ایمیل ارتباطی</span>
                  <Mail size={14} className="text-indigo-600" />
                </div>
                <a 
                  href="mailto:aliamjadianofficial@gmail.com" 
                  className="font-mono text-[11px] text-indigo-700 hover:underline hover:text-indigo-800 font-medium"
                >
                  aliamjadianofficial@gmail.com
                </a>
              </div>

              <div className="flex items-center justify-between flex-row-reverse text-xs border-t border-slate-200/60 pt-2.5">
                <div className="flex items-center gap-2 text-slate-600">
                  <span>پایگاه اینترنتی</span>
                  <Globe size={14} className="text-indigo-600" />
                </div>
                <a 
                  href="https://aliamjadianofficial.ir" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-mono text-[11px] text-indigo-700 hover:underline hover:text-indigo-800 font-medium"
                >
                  aliamjadianofficial.ir
                </a>
              </div>

              <div className="flex items-center justify-between flex-row-reverse text-xs border-t border-slate-200/60 pt-2.5">
                <div className="flex items-center gap-2 text-slate-600">
                  <span>شماره تماس مستقیم</span>
                  <Phone size={14} className="text-indigo-600" />
                </div>
                <a 
                  href="tel:09057302417" 
                  className="font-mono text-[11px] text-slate-800 hover:text-indigo-700"
                >
                  ۰۹۰۵۷۳۰۲۴۱۷
                </a>
              </div>

            </div>
          </div>

          {/* Program Features */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold text-slate-800 border-r-2 border-slate-900 pr-2">قابلیت‌ها و ویژگی‌های کلیدی</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { title: 'تخته هوشمند با قابلیت پیش‌نمایش PDF و ترسیم روی فایل', desc: 'قابلیت بارگذاری فایل‌های PDF و استفاده به عنوان پس‌زمینه تخته جهت آموزش تعاملی.' },
                { title: 'برگزاری و تصحیح پیشرفته آزمون‌های تستی و تشریحی', desc: 'امکان ساخت سریع آزمون تستی، نمایش آنلاین نتایج به شکل نمودارهای جذاب میله‌ای و دایره‌ای.' },
                { title: 'تعاملی بودن ۱۰۰٪ آنلاین کلاسی', desc: 'مشاهده طرح‌های ترسیمی کلاسی و دریافت فایل‌ها، جزوات، پیام و مانیتورینگ زنده حضور و غیاب.' },
                { title: 'پیام‌رسانی و چت زنده تعاملی کلاسی', desc: 'مکالمه دوطرفه مابین معلم و تمام دانش‌آموزان با سرعت انتقال بسیار بالا همراه با بوق سیستم.' },
                { title: 'مدیریت و پخش مستقیم صوت و مالتی‌مدیا', desc: 'امکان آپلود مستقیم صوت، فیلم یا تصاویر همراه با پخش زنده صوتی درون برنامه برای همه کاربران.' }
              ].map((feat, i) => (
                <div key={i} className="bg-slate-50/50 p-3 rounded-xl border border-slate-200/60 flex gap-2.5 items-start">
                  <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 mt-0.5 shrink-0">
                    <CheckCircle2 size={12} />
                  </span>
                  <div className="space-y-0.5 text-right flex-1">
                    <p className="text-[11px] font-bold text-slate-800">{feat.title}</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 text-center text-[9px] text-slate-400 bg-slate-50 font-mono tracking-wider">
          P.R.S CLASSROOM PRO • DESIGNED BY ALI AMJADIAN • 2026
        </div>

      </div>
    </div>
  );
}
