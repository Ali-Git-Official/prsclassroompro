import React, { useState, useEffect } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import { Student, Quiz, StudentSubmission, ChatMessage, ClassroomFile, Role } from './types';
import { Sparkles, GraduationCap, Github } from 'lucide-react';

// Predefined mock students for the classroom
const INITIAL_STUDENTS: Student[] = [];

const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'quiz-preset-1',
    title: 'کوییز اول: مفاهیم پایه‌ای کلاس هوشمند',
    durationMinutes: 10,
    isActive: true,
    createdAt: '۰۹:۳۰',
    questions: [
      {
        id: 'q-p-1',
        type: 'multiple-choice',
        text: 'مهم‌ترین مزیت سامانه P.R.S Classroom چیست؟',
        options: [
          'قابلیت اتصال آنلاین همگانی و همگام‌سازی ابری زنده',
          'سرعت لود بسیار کند',
          'عدم پشتیبانی از تخته',
          'عدم پشتیبانی از وب‌کم'
        ],
        correctOption: 0
      },
      {
        id: 'q-p-2',
        type: 'written',
        text: 'دلیل اهمیت خروجی PDF از تخته هوشمند را به طور خلاصه شرح دهید.'
      }
    ]
  }
];

const INITIAL_MESSAGES: ChatMessage[] = [];

const INITIAL_FILES: ClassroomFile[] = [];

export default function App() {
  const [role, setRole] = useState<Role | 'welcome'>('welcome');
  const [showSplash, setShowSplash] = useState(true);
  const [splashProgress, setSplashProgress] = useState(0);
  const [activeCall, setActiveCall] = useState<any>(null);
  
  // Current logged in student details if role === 'student'
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  // Custom persistent teacher profile states
  const [teacherName, setTeacherName] = useState<string>('استاد مجیدی');
  const [teacherAvatar, setTeacherAvatar] = useState<string>('👨‍🏫');

  // Core synchronized database lists
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [quizzes, setQuizzes] = useState<Quiz[]>(INITIAL_QUIZZES);

  useEffect(() => {
    const timer = setInterval(() => {
      setSplashProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setShowSplash(false), 450);
          return 100;
        }
        return prev + 5;
      });
    }, 70);
    return () => clearInterval(timer);
  }, []);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [files, setFiles] = useState<ClassroomFile[]>(INITIAL_FILES);
  const [whiteboardData, setWhiteboardData] = useState<string>('');
  const [externalClassUrl, setExternalClassUrl] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.origin : '';
  });

  // Native HTML5 Offline Sound Synthesizer (Beeps / Chimes for notifications)
  const playLocalChime = (type: 'hand' | 'message' | 'quiz') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'hand') {
        // High double beep
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.155);
        
        setTimeout(() => {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
          osc2.type = 'triangle';
          gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.15);
        }, 180);
      } else if (type === 'message') {
        // Soft bubble pop
        osc.frequency.setValueAtTime(329.63, audioCtx.currentTime); // E4
        osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.12);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } else {
        // Triumphant double chime
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      }
    } catch (e) {
      // AudioCtx fallback
    }
  };

  // Active server-synchronization polling hook
  useEffect(() => {
    let isMounted = true;
    const pollState = async () => {
      try {
        const res = await fetch('/api/state');
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        // Perform granular React state updates only when changes occurred to prevent lag
        setStudents(prev => JSON.stringify(prev) !== JSON.stringify(data.students) ? data.students : prev);
        setQuizzes(prev => JSON.stringify(prev) !== JSON.stringify(data.quizzes) ? data.quizzes : prev);
        setSubmissions(prev => JSON.stringify(prev) !== JSON.stringify(data.submissions) ? data.submissions : prev);
        setMessages(prev => JSON.stringify(prev) !== JSON.stringify(data.messages) ? data.messages : prev);
        setFiles(prev => JSON.stringify(prev) !== JSON.stringify(data.files) ? data.files : prev);
        setActiveCall(prev => JSON.stringify(prev) !== JSON.stringify(data.activeCall) ? data.activeCall : prev);
        if (data.externalClassUrl && data.externalClassUrl !== externalClassUrl) {
          const isServerLocal = data.externalClassUrl.includes('localhost') || data.externalClassUrl.includes('127.0.0.1');
          const isClientLocal = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1');
          if (!isServerLocal || isClientLocal) {
            setExternalClassUrl(data.externalClassUrl);
          }
        }

        // Teacher is the sole source of whiteboard drawings, so never overwrite their whiteboard canvas with delay
        if (role !== 'teacher') {
          setWhiteboardData(prev => prev !== data.whiteboardData ? data.whiteboardData : prev);
        }

        // Keep active student state synced with the server values, and auto re-register if we disappeared from the server
        if (role === 'student' && activeStudent) {
          const currentMe = data.students.find((s: Student) => s.id === activeStudent.id);
          if (currentMe) {
            if (JSON.stringify(currentMe) !== JSON.stringify(activeStudent)) {
              setActiveStudent(currentMe);
            }
          } else {
            // We disappeared from the server's live active student roster (due to server restart or memory purge). Let's self-heal and re-register seamlessly!
            console.log("Student disappeared from server live roster. Re-registering on-the-fly...");
            fetch('/api/students', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ student: activeStudent })
            }).catch(err => console.warn("Self-healing student registration failed:", err));
          }
        }
      } catch (err) {
        // Log lightly to avoid triggering false alarms on transient restarts
        console.warn("Connection polling issue:", err);
      }
    };

    pollState();
    const intervalId = setInterval(pollState, 1000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [role, activeStudent]);

  // 1. Attendance toggles
  const handleToggleStatus = async (id: string, status: boolean | null | 'late') => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, isPresent: status } : s));
    try {
      await fetch('/api/students/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPresent: status })
      });
    } catch (e) {
      console.warn("Failed to set attendance:", e);
    }
  };

  // Smart instant roll call auto helper (assigns values to mock students)
  const handleInstantRollCall = async () => {
    try {
      const res = await fetch('/api/students/roll-call', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        playLocalChime('quiz');
      }
    } catch (e) {
      console.warn("Failed instant roll-call:", e);
    }
  };

  // 2. Hand raising operations
  const handleToggleHand = async (id: string, isRaised: boolean) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, isHandRaised: isRaised } : s));
    if (isRaised) {
      playLocalChime('hand');
    }
    
    // Updates local student view state object immediately
    if (activeStudent && activeStudent.id === id) {
      setActiveStudent(prev => prev ? { ...prev, isHandRaised: isRaised } : null);
    }

    try {
      await fetch('/api/students/toggle-hand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRaised })
      });
    } catch (e) {
      console.warn("Failed to toggle hand:", e);
    }
  };

  const handleClearHandRaises = async () => {
    setStudents(prev => prev.map(s => ({ ...s, isHandRaised: false })));
    if (activeStudent) {
      setActiveStudent(prev => prev ? { ...prev, isHandRaised: false } : null);
    }

    try {
      await fetch('/api/students/clear-hands', { method: 'POST' });
    } catch (e) {
      console.warn("Failed to clear hand raises:", e);
    }
  };

  // 3. Quiz building
  const handleCreateQuiz = async (quiz: Quiz) => {
    setQuizzes(prev => [...prev, quiz]);
    playLocalChime('quiz');

    try {
      await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz })
      });
    } catch (e) {
      console.warn("Failed to create quiz:", e);
    }
  };

  const handleToggleQuiz = async (id: string) => {
    setQuizzes(prev => prev.map(q => q.id === id ? { ...q, isActive: !q.isActive } : q));
    try {
      await fetch('/api/quizzes/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch (e) {
      console.warn("Failed to toggle quiz:", e);
    }
  };

  const handleSubmittingAnswer = async (submission: StudentSubmission) => {
    setSubmissions(prev => [...prev, submission]);
    playLocalChime('quiz');

    try {
      await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission })
      });
    } catch (e) {
      console.warn("Failed to submit answer:", e);
    }
  };

  // 4. File uploads
  const handleUploadFile = async (file: ClassroomFile) => {
    setFiles(prev => [file, ...prev]);
    playLocalChime('quiz');

    try {
      await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file })
      });
    } catch (e) {
      console.warn("Failed to upload file:", e);
    }
  };

  const handleDeleteFile = async (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    try {
      await fetch(`/api/files/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("Failed to delete file:", e);
    }
  };

  // 5. Massaging
  const handleSendMessage = async (text: string) => {
    const isTeacher = role === 'teacher';
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: isTeacher ? 'teacher-id' : (activeStudent?.id || 'stu-custom'),
      senderName: isTeacher ? teacherName : (activeStudent?.name || 'مهمان کلاس'),
      senderRole: role as Role,
      text,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      avatar: isTeacher ? teacherAvatar : (activeStudent?.avatar || '🎓')
    };

    setMessages(prev => [...prev, msg]);
    playLocalChime('message');

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
    } catch (e) {
      console.warn("Failed to send message:", e);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (id === 'CLEAR_ALL') {
      setMessages([]);
      try {
        await fetch('/api/messages/clear', { method: 'POST' });
      } catch (e) {
        console.warn("Failed to clear messages:", e);
      }
    } else {
      setMessages(prev => prev.filter(m => m.id !== id));
      try {
        await fetch(`/api/messages/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn("Failed to delete message:", e);
      }
    }
  };

  // Sync whiteboard drawing upwards to server
  const handleSyncWhiteboard = async (data: string) => {
    setWhiteboardData(data);
    try {
      await fetch('/api/whiteboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whiteboardData: data })
      });
    } catch (e) {
      console.warn("Failed to sync whiteboard:", e);
    }
  };

  const handleSelectRole = async (selected: Role, customName?: string, studentId?: string, customAvatar?: string) => {
    if (selected === 'teacher') {
      if (customName) setTeacherName(customName);
      if (customAvatar) setTeacherAvatar(customAvatar);
      setRole('teacher');
    } else {
      // Create custom entry student
      const stu: Student = {
        id: studentId || `stu-custom-${Date.now()}`,
        name: customName || 'دانش‌آموز مهمان',
        avatar: customAvatar || '🎓',
        isPresent: true,
        isHandRaised: false
      };
      // Add to active students tracking array
      setStudents(prev => {
        const filtered = prev.filter(s => s.id !== stu.id);
        return [...filtered, stu];
      });
      setActiveStudent(stu);
      setRole('student');

      try {
        await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student: stu })
        });
      } catch (e) {
        console.warn("Failed to register student:", e);
      }
    }
  };

  const handleStartCall = async (type: 'video' | 'audio') => {
    try {
      const res = await fetch('/api/call/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: role === 'teacher' ? 'teacher-id' : (activeStudent?.id || 'stu-custom'),
          hostName: role === 'teacher' ? teacherName : (activeStudent?.name || 'مهمان'),
          hostAvatar: role === 'teacher' ? teacherAvatar : (activeStudent?.avatar || '🎓'),
          type
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveCall(data.activeCall);
      }
    } catch (e) {
      console.warn("Failed to start call:", e);
    }
  };

  const handleStopCall = async () => {
    try {
      const res = await fetch('/api/call/stop', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setActiveCall(data.activeCall);
      }
    } catch (e) {
      console.warn("Failed to stop call:", e);
    }
  };

  const handleLogout = () => {
    setRole('welcome');
    setActiveStudent(null);
  };

  const persianDate = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full' }).format(new Date());

  if (showSplash) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-indigo-50/40 to-teal-50/30 flex flex-col items-center justify-center p-6 text-slate-800 font-sans overflow-hidden select-none relative">
        {/* Soft floating background decorative blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        
        <div className="space-y-7 text-center max-w-sm w-full z-10 animate-fade-in">
          {/* Material-3 Inspired Floating Circular Emblem */}
          <div className="relative mx-auto w-24 h-24 rounded-full bg-white border border-indigo-100 shadow-xl flex items-center justify-center text-indigo-650 scale-100 hover:scale-105 transition-transform duration-500">
            <span className="absolute inset-0 rounded-full border-2 border-indigo-200 opacity-30 animate-ping"></span>
            <span className="absolute inset-2 rounded-full border border-indigo-100 bg-gradient-to-tr from-indigo-50 to-white shadow-inner"></span>
            <GraduationCap size={44} className="text-indigo-600 relative z-10 animate-bounce" />
          </div>

          <div className="space-y-1 text-center">
            <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-800 bg-clip-text text-transparent tracking-tight font-sans">
              P.R.S Classroom Pro
            </h1>
            <p className="text-[10.5px] text-indigo-600 font-extrabold tracking-wider font-sans">
              سامانه چندرسانه‌ای تعاملی هوشمند نسل جدید
            </p>
          </div>

          {/* Elevated Material Progress Card */}
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200/60 shadow-lg space-y-3.5">
            <div className="w-full bg-slate-100 h-2 rounded-full p-0.5 overflow-hidden border border-slate-200/40">
              <div 
                className="h-full bg-gradient-to-l from-indigo-600 to-teal-500 rounded-full transition-all duration-100 ease-out shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                style={{ width: `${splashProgress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-sans tracking-wide px-1">
              <span className="font-bold text-slate-600">در حال آماده‌سازی سامانه کلاسی...</span>
              <span className="text-indigo-650 font-black font-sans">{splashProgress}%</span>
            </div>
          </div>
        </div>
        
        {/* Subtle decorative bottom label */}
        <div className="absolute bottom-6 text-[10px] text-slate-400 font-sans tracking-wide">
          پلتفرم تعاملی فوق‌پیشرفته کلاس محلی هوشمند
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between select-none">
      
      {/* Top Main Navigation Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center flex-row-reverse">
          <div className="flex items-center gap-2.5">
            
            <div className="text-right">
              <h1 className="text-sm font-extrabold text-slate-800 tracking-tight font-sans">تخته و کلاس هوشمند</h1>
              <p className="text-[10px] text-slate-400 font-sans tracking-wider font-bold">P.R.S Classroom Pro</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <GraduationCap className="text-indigo-600" size={24} />
          </div>
        </div>
      </header>

      {/* Main Container screen slots */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {role === 'welcome' && (
          <WelcomeScreen 
            onSelectRole={handleSelectRole} 
            externalClassUrl={externalClassUrl}
          />
        )}

        {role === 'teacher' && (
          <TeacherDashboard 
            students={students}
            quizzes={quizzes}
            submissions={submissions}
            messages={messages}
            files={files}
            teacherName={teacherName}
            teacherAvatar={teacherAvatar}
            onToggleStatus={handleToggleStatus}
            onInstantRollCall={handleInstantRollCall}
            onToggleHand={handleToggleHand}
            onClearHandRaises={handleClearHandRaises}
            onCreateQuiz={handleCreateQuiz}
            onToggleQuiz={handleToggleQuiz}
            onUploadFile={handleUploadFile}
            onDeleteFile={handleDeleteFile}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
            whiteboardData={whiteboardData}
            setWhiteboardData={handleSyncWhiteboard}
            onLogout={handleLogout}
            activeCall={activeCall}
            onStartCall={handleStartCall}
            onStopCall={handleStopCall}
            externalClassUrl={externalClassUrl}
          />
        )}

        {role === 'student' && activeStudent && (
          <StudentDashboard 
            student={activeStudent}
            quizzes={quizzes}
            submissions={submissions}
            messages={messages}
            files={files}
            onToggleHand={handleToggleHand}
            onSubmittingAnswer={handleSubmittingAnswer}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
            whiteboardData={whiteboardData}
            onLogout={handleLogout}
            activeCall={activeCall}
            onStartCall={handleStartCall}
            onStopCall={handleStopCall}
            externalClassUrl={externalClassUrl}
          />
        )}
      </main>

      {/* Bottom Footer block */}
      <footer className="bg-slate-900 text-slate-400 text-center py-4 text-[10px] border-t border-slate-800 font-sans" id="prs-footer">
        <p className="font-semibold text-xs">P.R.S Classroom Pro • {persianDate}</p>
      </footer>

    </div>
  );
}
