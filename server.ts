import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface Student {
  id: string;
  name: string;
  avatar: string;
  isPresent: boolean | 'late' | null;
  isHandRaised: boolean;
  handRaisedAt?: string;
  score?: number;
}

interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple-choice' | 'written';
  options?: string[];
  correctOption?: number;
}

interface Quiz {
  id: string;
  title: string;
  durationMinutes: number;
  questions: QuizQuestion[];
  isActive: boolean;
  createdAt: string;
}

interface StudentSubmission {
  studentId: string;
  studentName: string;
  answers: { [questionId: string]: string | number };
  isGraded: boolean;
  score?: number;
  isCorrect?: { [questionId: string]: boolean };
  feedback?: { [questionId: string]: string };
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'student';
  text: string;
  timestamp: string;
  avatar: string;
}

interface ClassroomFile {
  id: string;
  name: string;
  url?: string;
  type: 'pdf' | 'video' | 'image' | 'link';
  size?: string;
  uploadedAt: string;
}

// In-memory data store for the live virtual classroom
let dbState = {
  students: [] as Student[],
  quizzes: [
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
  ] as Quiz[],
  submissions: [] as StudentSubmission[],
  messages: [] as ChatMessage[],
  files: [] as ClassroomFile[],
  whiteboardData: '',
  activeCall: null as {
    isActive: boolean;
    hostId: string;
    hostName: string;
    hostAvatar: string;
    type: 'video' | 'audio';
    startedAt: string;
    participants: {
      id: string;
      name: string;
      avatar: string;
      micActive: boolean;
      videoActive: boolean;
    }[];
  } | null
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Set higher sizing limits to allow full base64 file payloads and high-density whiteboard frames
  app.use(express.json({ limit: '65mb' }));
  app.use(express.urlencoded({ limit: '65mb', extended: true }));

  // --- Live Synchronization REST APIs ---

  // Get current active virtual state of the entire platform
  app.get("/api/state", (req, res) => {
    const proto = (req.headers['x-forwarded-proto'] as string) || 'http';
    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost:3000';
    const externalClassUrl = `${proto}://${host}`;
    res.json({
      ...dbState,
      externalClassUrl
    });
  });

  // Soft Reset Classroom data back empty / original
  app.post("/api/state/reset", (req, res) => {
    dbState = {
      students: [],
      quizzes: [
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
      ],
      submissions: [],
      messages: [],
      files: [],
      whiteboardData: '',
      activeCall: null
    };
    res.json({ success: true, state: dbState });
  });

  // Upsert active online student
  app.post("/api/students", (req, res) => {
    const { student } = req.body;
    if (!student || !student.id) {
      return res.status(400).json({ error: "Invalid student object" });
    }
    const idx = dbState.students.findIndex(s => s.id === student.id);
    if (idx >= 0) {
      dbState.students[idx] = { ...dbState.students[idx], ...student };
    } else {
      dbState.students.push(student);
    }
    res.json({ success: true, students: dbState.students });
  });

  // Student hand raise toggle
  app.post("/api/students/toggle-hand", (req, res) => {
    const { id, isRaised } = req.body;
    dbState.students = dbState.students.map(s => 
      s.id === id ? { ...s, isHandRaised: isRaised, handRaisedAt: isRaised ? new Date().toLocaleTimeString('fa-IR') : undefined } : s
    );
    res.json({ success: true, students: dbState.students });
  });

  // Clears hand raises for all
  app.post("/api/students/clear-hands", (req, res) => {
    dbState.students = dbState.students.map(s => ({ ...s, isHandRaised: false }));
    res.json({ success: true, students: dbState.students });
  });

  // Attendance updater
  app.post("/api/students/attendance", (req, res) => {
    const { id, isPresent } = req.body;
    dbState.students = dbState.students.map(s => 
      s.id === id ? { ...s, isPresent } : s
    );
    res.json({ success: true, students: dbState.students });
  });

  // Multi-user Roll call generator
  app.post("/api/students/roll-call", (req, res) => {
    dbState.students = dbState.students.map(s => {
      const r = Math.random();
      let status: boolean | 'late' = true;
      if (r < 0.15) status = false;
      else if (r < 0.3) status = 'late';
      return { ...s, isPresent: status };
    });
    res.json({ success: true, students: dbState.students });
  });

  // Quizzing logic
  app.post("/api/quizzes", (req, res) => {
    const { quiz } = req.body;
    if (quiz) {
      dbState.quizzes.push(quiz);
    }
    res.json({ success: true, quizzes: dbState.quizzes });
  });

  app.post("/api/quizzes/toggle", (req, res) => {
    const { id } = req.body;
    dbState.quizzes = dbState.quizzes.map(q => 
      q.id === id ? { ...q, isActive: !q.isActive } : q
    );
    res.json({ success: true, quizzes: dbState.quizzes });
  });

  app.post("/api/submissions", (req, res) => {
    const { submission } = req.body;
    if (submission) {
      dbState.submissions.push(submission);
      dbState.messages.push({
        id: `sys-${Date.now()}`,
        senderId: 'system',
        senderName: 'سیستم',
        senderRole: 'teacher',
        text: `دانش‌آموز "${submission.studentName}" پاسخنامه آزمون خود را ارسال کرد.`,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        avatar: '🎓'
      });
    }
    res.json({ success: true, submissions: dbState.submissions });
  });

  // Messenger logic
  app.post("/api/messages", (req, res) => {
    const { message } = req.body;
    if (message) {
      dbState.messages.push(message);
    }
    res.json({ success: true, messages: dbState.messages });
  });

  // Shared file library endpoints
  app.post("/api/files", (req, res) => {
    const { file } = req.body;
    if (file) {
      dbState.files = [file, ...dbState.files];
    }
    res.json({ success: true, files: dbState.files });
  });

  app.delete("/api/files/:id", (req, res) => {
    const { id } = req.params;
    dbState.files = dbState.files.filter(f => f.id !== id);
    res.json({ success: true, files: dbState.files });
  });

  // Whiteboard drawing synchronizer
  app.post("/api/whiteboard", (req, res) => {
    const { whiteboardData } = req.body;
    dbState.whiteboardData = whiteboardData || '';
    res.json({ success: true });
  });

  // Live Audio/Video Call status endpoints
  app.post("/api/call/start", (req, res) => {
    const { hostId, hostName, hostAvatar, type } = req.body;
    dbState.activeCall = {
      isActive: true,
      hostId,
      hostName,
      hostAvatar,
      type: type || 'video',
      startedAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      participants: []
    };
    
    // Also push a system notification in chat that the call has started
    dbState.messages.push({
      id: `sys-call-${Date.now()}`,
      senderId: 'system',
      senderName: 'سیستم',
      senderRole: 'teacher',
      text: `جلسه گفتگوی صوتی و تصویری زنده کلاس توسط ${hostName} آغاز شد. برای عضویت روی "نمایش پنل گفتگوی زنده" کلیک کنید.`,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      avatar: '📞'
    });
    
    res.json({ success: true, activeCall: dbState.activeCall });
  });

  app.post("/api/call/join", (req, res) => {
    const { studentId, name, avatar, micActive, videoActive } = req.body;
    if (dbState.activeCall) {
      // Remove any pre-existing entry for this student
      dbState.activeCall.participants = dbState.activeCall.participants.filter(p => p.id !== studentId);
      
      // Add the updated entry
      dbState.activeCall.participants.push({
        id: studentId,
        name,
        avatar,
        micActive: !!micActive,
        videoActive: !!videoActive
      });
    }
    res.json({ success: true, activeCall: dbState.activeCall });
  });

  app.post("/api/call/update", (req, res) => {
    const { studentId, micActive, videoActive } = req.body;
    if (dbState.activeCall) {
      dbState.activeCall.participants = dbState.activeCall.participants.map(p => {
        if (p.id === studentId) {
          return {
            ...p,
            micActive: micActive !== undefined ? !!micActive : p.micActive,
            videoActive: videoActive !== undefined ? !!videoActive : p.videoActive
          };
        }
        return p;
      });
    }
    res.json({ success: true, activeCall: dbState.activeCall });
  });

  app.post("/api/call/leave", (req, res) => {
    const { studentId } = req.body;
    if (dbState.activeCall) {
      dbState.activeCall.participants = dbState.activeCall.participants.filter(p => p.id !== studentId);
    }
    res.json({ success: true, activeCall: dbState.activeCall });
  });

  app.post("/api/call/stop", (req, res) => {
    dbState.activeCall = null;
    res.json({ success: true, activeCall: null });
  });

  // --- Static Asset and SPA Fallback via Vite ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
