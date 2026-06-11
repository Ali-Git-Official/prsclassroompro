export type Role = 'teacher' | 'student';

export interface Student {
  id: string;
  name: string;
  avatar: string;
  isPresent: boolean | 'late' | null; // true (present), false (absent), 'late' (delayed), null (not marked)
  isHandRaised: boolean;
  handRaisedAt?: string;
  score?: number;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple-choice' | 'written';
  options?: string[]; // for multiple-choice
  correctOption?: number; // index (0-3) for multiple choice
}

export interface Quiz {
  id: string;
  title: string;
  durationMinutes: number;
  questions: QuizQuestion[];
  isActive: boolean;
  createdAt: string;
}

export interface StudentSubmission {
  studentId: string;
  studentName: string;
  answers: { [questionId: string]: string | number }; // option index or written text
  isGraded: boolean;
  score?: number; // out of total
  isCorrect?: { [questionId: string]: boolean };
  feedback?: { [questionId: string]: string };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  text: string;
  timestamp: string;
  avatar: string;
}

export interface WhiteboardElement {
  id: string;
  type: 'pen' | 'line' | 'rect' | 'circle' | 'text';
  points?: { x: number; y: number }[]; // for free-hand pen drawing
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  color: string;
  strokeWidth: number;
  text?: string;
}

export interface ClassroomFile {
  id: string;
  name: string;
  url?: string;
  type: 'pdf' | 'video' | 'image' | 'link' | 'audio';
  size?: string;
  uploadedAt: string;
}
