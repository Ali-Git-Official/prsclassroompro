import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  Clock, 
  BarChart3, 
  Send, 
  BookOpen, 
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { Quiz, QuizQuestion, StudentSubmission } from '../types';

interface QuizBuilderProps {
  role: 'teacher' | 'student';
  quizzes: Quiz[];
  onCreateQuiz: (quiz: Quiz) => void;
  onToggleQuiz: (id: string) => void;
  submissions: StudentSubmission[];
  onSubmittingAnswer?: (submission: StudentSubmission) => void;
  studentId?: string;
  studentName?: string;
}

export default function QuizBuilder({
  role,
  quizzes,
  onCreateQuiz,
  onToggleQuiz,
  submissions,
  onSubmittingAnswer,
  studentId = 'stu-1',
  studentName = 'دانش‌آموز نمونه'
}: QuizBuilderProps) {
  // Creator state (Teacher)
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDuration, setNewQuizDuration] = useState(15);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionText, setCurrentQuestionText] = useState('');
  const [currentQuestionType, setCurrentQuestionType] = useState<'multiple-choice' | 'written'>('multiple-choice');
  
  // MCQ Options state
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);

  // Student Answering state
  const [activeAnsweringQuizId, setActiveAnsweringQuizId] = useState<string | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<{ [qId: string]: string | number }>({});
  
  // UI Tabs
  const [activeTab, setActiveTab] = useState<'quizzes' | 'stats'>('quizzes');

  // Currently selected quiz ID for showing multiple-choice statistics
  const [selectedStatsQuizId, setSelectedStatsQuizId] = useState<string>('');

  const addQuestionToBuilder = () => {
    if (!currentQuestionText.trim()) return;

    const newQ: QuizQuestion = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: currentQuestionText,
      type: currentQuestionType,
      options: currentQuestionType === 'multiple-choice' ? [...options] : undefined,
      correctOption: currentQuestionType === 'multiple-choice' ? correctOptionIndex : undefined
    };

    setQuestions([...questions, newQ]);
    // Reset state for next question
    setCurrentQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectOptionIndex(0);
  };

  const removeQuestionFromBuilder = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const saveQuiz = (e: React.FormEvent) => {
    e.preventDefault();

    let finalQuestions = [...questions];

    // Auto-add draft question if teacher typed one but forgot to click "Add question"
    if (currentQuestionText.trim()) {
      const newQ: QuizQuestion = {
        id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        text: currentQuestionText.trim(),
        type: currentQuestionType,
        options: currentQuestionType === 'multiple-choice' ? [...options] : undefined,
        correctOption: currentQuestionType === 'multiple-choice' ? correctOptionIndex : undefined
      };
      finalQuestions.push(newQ);
    }

    if (!newQuizTitle.trim()) {
      alert('لطفاً عنوان آزمون را وارد کنید.');
      return;
    }

    if (finalQuestions.length === 0) {
      alert('لطفاً صورت سوال را بنویسید یا حداقل یک سوال به آزمون خود اضافه کنید.');
      return;
    }

    const quiz: Quiz = {
      id: `quiz-${Date.now()}`,
      title: newQuizTitle,
      durationMinutes: newQuizDuration,
      questions: finalQuestions,
      isActive: true,
      createdAt: new Date().toLocaleTimeString('fa-IR')
    };

    onCreateQuiz(quiz);
    
    // Clear whole form
    setNewQuizTitle('');
    setQuestions([]);
    setNewQuizDuration(15);
    setCurrentQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectOptionIndex(0);
  };

  // Student action: Submit answer
  const submitAnswersToTeacher = (quiz: Quiz) => {
    if (!onSubmittingAnswer) return;

    // Evaluate auto-grade on multiple choice
    let score = 0;
    const maxScore = quiz.questions.length;
    const correctnessMap: { [qId: string]: boolean } = {};
    const feedbackMap: { [qId: string]: string } = {};

    quiz.questions.forEach((q) => {
      const studentAns = studentAnswers[q.id];
      if (q.type === 'multiple-choice') {
        const isCorrect = Number(studentAns) === q.correctOption;
        correctnessMap[q.id] = isCorrect;
        if (isCorrect) score++;
        feedbackMap[q.id] = isCorrect ? 'پاسخ شما کاملاً درست است!' : `اشتباه بود. پاسخ صحیح گزینه ${q.correctOption! + 1} است.`;
      } else {
        // Written answer: simple validation, if written something, give full point or mock review
        const filled = studentAns && String(studentAns).trim().length > 3;
        correctnessMap[q.id] = !!filled;
        score += filled ? 1 : 0;
        feedbackMap[q.id] = filled ? 'پاسخ توسط دبیر تایید شد.' : 'پاسخ برای این سوال تشریحی خالی یا بسیار کوتاه بود.';
      }
    });

    const sub: StudentSubmission = {
      studentId,
      studentName,
      answers: { ...studentAnswers },
      isGraded: true,
      score: Math.round((score / maxScore) * 20), // out of 20 score standard
      isCorrect: correctnessMap,
      feedback: feedbackMap
    };

    onSubmittingAnswer(sub);
    setActiveAnsweringQuizId(null);
    setStudentAnswers({});
  };

  // Stats Analytics (Generates beautifully designed local charts using pure SVG)
  const renderStatsCharts = () => {
    if (quizzes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-slate-500 bg-white rounded-xl border border-slate-200 shadow-inner">
          <AlertCircle className="text-slate-300 mb-2" size={32} />
          <p className="text-xs font-sans text-right">هنوز هیچ آزمونی در کلاس ثبت و منتشر نشده است.</p>
        </div>
      );
    }

    // Default to the last created quiz if no selections are made yet
    const activeQuizId = selectedStatsQuizId || quizzes[quizzes.length - 1].id;
    const currentQuiz = quizzes.find(q => q.id === activeQuizId) || quizzes[quizzes.length - 1];

    if (!currentQuiz) return null;

    // Filter submissions that belong to the active quiz
    const quizSubmissions = submissions.filter(sub => 
      currentQuiz.questions.some(q => sub.answers[q.id] !== undefined)
    );

    // Categories counts for overall score distribution
    let scoreCounts = { A: 0, B: 0, C: 0, D: 0 };
    quizSubmissions.forEach(s => {
      const scoreValue = s.score || 0;
      if (scoreValue >= 17) scoreCounts.A++;
      else if (scoreValue >= 14) scoreCounts.B++;
      else if (scoreValue >= 10) scoreCounts.C++;
      else scoreCounts.D++;
    });

    const maxScoreCount = Math.max(1, scoreCounts.A, scoreCounts.B, scoreCounts.C, scoreCounts.D);
    const scoreDataPercent = {
      A: (scoreCounts.A / maxScoreCount) * 85,
      B: (scoreCounts.B / maxScoreCount) * 85,
      C: (scoreCounts.C / maxScoreCount) * 85,
      D: (scoreCounts.D / maxScoreCount) * 85,
    };

    return (
      <div className="space-y-6 text-right">
        {/* Dropdown to select customized Quiz */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200 gap-3">
          <select
            value={activeQuizId}
            onChange={(e) => setSelectedStatsQuizId(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-right focus:outline-none focus:border-indigo-600 font-sans cursor-pointer flex-1"
          >
            {quizzes.map(q => (
              <option key={q.id} value={q.id}>{q.title} ({q.questions.length} سوال)</option>
            ))}
          </select>
          <span className="text-xs font-extrabold text-slate-800">انتخاب آزمون تعاملی برای مشاهده آمار تفصیلی:</span>
        </div>

        {/* 1. Multiple-choice Options Specific Breakdown */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-800 pr-1 flex items-center justify-end gap-1.5 font-sans">
            تحلیل آماری لحظه‌ای گزینه‌های تستی آزمون
            <CheckCircle2 size={15} className="text-emerald-500" />
          </h4>

          {currentQuiz.questions.filter(q => q.type === 'multiple-choice').length === 0 ? (
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-400">
              هیچ سوال تستی در این آزمون یافت نشد. تمام سوالات به شکل تشریحی طرح شده‌اند.
            </div>
          ) : (
            currentQuiz.questions.filter(q => q.type === 'multiple-choice').map((q, idx) => {
              // Count options selected across submissions
              let optionCounts = [0, 0, 0, 0];
              let totalResponses = 0;

              quizSubmissions.forEach(sub => {
                const ans = sub.answers[q.id];
                if (ans !== undefined && ans !== null && ans !== '') {
                  const optIdx = Number(ans);
                  if (optIdx >= 0 && optIdx < 4) {
                    optionCounts[optIdx]++;
                    totalResponses++;
                  }
                }
              });

              const correctIdx = q.correctOption !== undefined ? q.correctOption : 0;
              const correctPct = totalResponses > 0 ? Math.round((optionCounts[correctIdx] / totalResponses) * 100) : 0;

              const p0 = totalResponses > 0 ? (optionCounts[0]/totalResponses)*100 : 0;
              const p1 = totalResponses > 0 ? (optionCounts[1]/totalResponses)*100 : 0;
              const p2 = totalResponses > 0 ? (optionCounts[2]/totalResponses)*100 : 0;
              const p3 = totalResponses > 0 ? (optionCounts[3]/totalResponses)*100 : 0;

              const conicGradientString = totalResponses === 0 
                ? 'conic-gradient(#e2e8f0 0% 100%)' 
                : `conic-gradient(
                    #10b981 0% ${p0}%, 
                    #3b82f6 ${p0}% ${p0 + p1}%, 
                    #f59e0b ${p0 + p1}% ${p0 + p1 + p2}%, 
                    #f43f5e ${p0 + p1 + p2}% 100%
                  )`;

              return (
                <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-2.5 gap-2 flex-row-reverse">
                    <div className="text-right">
                      <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-mono font-bold">سوال {idx + 1}</span>
                      <h5 className="text-xs font-bold text-slate-800 mt-1">{q.text}</h5>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide font-sans flex items-center gap-1 border ${
                        correctPct >= 70 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : correctPct >= 40 
                            ? 'bg-amber-50 text-amber-700 border-amber-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        درصد پاسخ صحیح: {correctPct}٪
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans">تعداد کل پاسخ‌ها: {totalResponses}</span>
                    </div>
                  </div>

                  {/* Charts row side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    
                    {/* Circle Pie Chart Panel (Left logic is right align here) */}
                    <div className="border border-slate-100/80 rounded-xl p-4 bg-slate-50/20 flex flex-col items-center justify-center space-y-3">
                      <p className="text-[10px] text-slate-500 font-bold">نمودار دایره‌ای توزیع گزینه‌ها</p>
                      
                      <div className="flex items-center justify-center gap-4 flex-row-reverse w-full">
                        {/* CSS Conic Gradient Circle */}
                        <div 
                          className="w-24 h-24 rounded-full border border-slate-200/50 shadow-xs flex items-center justify-center relative select-none"
                          style={{ background: conicGradientString }}
                        >
                          <div className="absolute w-12 h-12 rounded-full bg-white flex items-center justify-center text-[10px] shadow-xs text-slate-700 font-sans">
                            {totalResponses} پاسخ
                          </div>
                        </div>

                        {/* Pie Legends custom */}
                        <div className="text-right space-y-1.5 flex-1">
                          {q.options?.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2 justify-end text-[10px]">
                              <span className="text-slate-600 truncate max-w-[120px]" title={opt}>{opt || `گزینه ${oIdx + 1}`}</span>
                              <span className="font-bold text-slate-800 font-sans">{totalResponses > 0 ? Math.round(oIdx === 0 ? p0 : oIdx === 1 ? p1 : oIdx === 2 ? p2 : p3) : 0}%</span>
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                oIdx === 0 ? 'bg-[#10b981]' : oIdx === 1 ? 'bg-[#3b82f6]' : oIdx === 2 ? 'bg-[#f59e0b]' : 'bg-[#f43f5e]'
                              }`} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bar Chart Panel */}
                    <div className="border border-slate-100/80 rounded-xl p-4 bg-slate-50/20 flex flex-col space-y-3">
                      <p className="text-[10px] text-slate-500 font-bold text-center">نمودار میله‌ای مقایسه‌ای گزینه‌ها</p>
                      
                      <div className="flex h-32 items-end justify-between border-b border-slate-100 pb-2 px-2 flex-row-reverse">
                        {optionCounts.map((val, oIdx) => {
                          const pct = totalResponses > 0 ? (val / totalResponses) * 100 : 0;
                          return (
                            <div key={oIdx} className="flex flex-col items-center gap-1.5 flex-1">
                              <span className="text-[9px] font-sans font-bold text-slate-600">{val} نفر</span>
                              <div 
                                className="w-5 rounded-t-lg transition-all duration-500 hover:opacity-90"
                                style={{ 
                                  height: `${Math.max(6, pct)}%`,
                                  backgroundColor: oIdx === 0 ? '#10b981' : oIdx === 1 ? '#3b82f6' : oIdx === 2 ? '#f59e0b' : '#f43f5e'
                                }}
                              />
                              <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                                correctIdx === oIdx 
                                  ? 'bg-[#10b981] text-white shadow-xs' 
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                گزینه {oIdx + 1}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Plain Text Legend listing accurate correct option */}
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/40 text-xs flex justify-between items-center flex-row-reverse text-[11px]">
                    <span className="font-bold text-slate-800">
                      گزینه صحیح: <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-sans">گزینه {correctIdx + 1} ({q.options?.[correctIdx]})</span>
                    </span>
                    <span className="text-slate-400 font-sans">مجموع شرکت‌کنندگان: {quizSubmissions.length} نفر</span>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* 2. General Grade Dispersion */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <h4 className="text-xs font-bold text-slate-900 mb-4 text-right flex items-center justify-end gap-2 font-sans">
            توزیع نمرات دانش‌آموزان در این آزمون (ملاک ۲۰ نمره)
            <BarChart3 size={15} className="text-slate-800" />
          </h4>

          {quizSubmissions.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">کارت توزیع نمرات بعد از ثبت اولین حل خودکار کلاسی فعال می‌گردد.</div>
          ) : (
            <div className="flex h-44 justify-between items-end border-b border-slate-200 pb-2 px-6 pt-4 font-sans flex-row-reverse">
              {/* Range A */}
              <div className="flex flex-col items-center gap-2 flex-1 group">
                <span className="text-[11px] font-bold text-slate-950">{scoreCounts.A} نفر</span>
                <div 
                  className="w-8 bg-indigo-600 rounded-t-lg transition-all duration-700 hover:bg-indigo-700"
                  style={{ height: `${Math.max(5, scoreDataPercent.A)}%` }}
                />
                <span className="text-[10px] text-slate-500 font-medium mt-1">عالی (۱۷-۲۰)</span>
              </div>

              {/* Range B */}
              <div className="flex flex-col items-center gap-2 flex-1 group">
                <span className="text-[11px] font-bold text-slate-700">{scoreCounts.B} نفر</span>
                <div 
                  className="w-8 bg-blue-600 rounded-t-lg transition-all duration-700 hover:bg-blue-700"
                  style={{ height: `${Math.max(5, scoreDataPercent.B)}%` }}
                />
                <span className="text-[10px] text-slate-500 font-medium mt-1">خوب (۱۴-۱۶)</span>
              </div>

              {/* Range C */}
              <div className="flex flex-col items-center gap-2 flex-1 group">
                <span className="text-[11px] font-bold text-slate-600">{scoreCounts.C} نفر</span>
                <div 
                  className="w-8 bg-amber-500 rounded-t-lg transition-all duration-700 hover:bg-amber-600"
                  style={{ height: `${Math.max(5, scoreDataPercent.C)}%` }}
                />
                <span className="text-[10px] text-slate-500 font-medium mt-1">متوسط (۱۰-۱۳)</span>
              </div>

              {/* Range D */}
              <div className="flex flex-col items-center gap-2 flex-1 group">
                <span className="text-[11px] font-bold text-slate-400">{scoreCounts.D} نفر</span>
                <div 
                  className="w-8 bg-slate-300 rounded-t-lg transition-all duration-700 hover:bg-slate-400"
                  style={{ height: `${Math.max(5, scoreDataPercent.D)}%` }}
                />
                <span className="text-[10px] text-slate-500 font-medium mt-1">ضعیف (زیر ۱۰)</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Detailed pupil submission list details */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <h4 className="text-xs font-bold text-slate-900 mb-3 text-right flex items-center justify-end gap-1.5 font-sans">
            کارنامه تفصیلی نمرات و گزارش صحت پاسخ‌ها
            <UserCheck size={14} className="text-slate-800" />
          </h4>
          {quizSubmissions.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-3">هنوز پاسخی ثبت نشده است.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {quizSubmissions.map((sub, sIdx) => (
                <div key={sIdx} className="py-2.5 flex justify-between items-center text-xs flex-row-reverse">
                  <div className="text-right">
                    <p className="font-bold text-slate-800 font-sans">{sub.studentName}</p>
                    <p className="text-[10px] text-slate-400">ثبت پاسخ تمام آنلاین</p>
                  </div>
                  <div className="flex items-center gap-2 font-sans">
                    <span className={`px-2.5 py-1 rounded-full font-bold ${
                      (sub.score || 0) >= 10 ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'
                    }`}>
                      نمره به دست آمده: {sub.score} / ۲۰
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="prs-quiz-module">
      <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4 flex-wrap gap-2">
        {/* Header Tabs depending on role */}
        <div className="flex items-center gap-2 font-sans">
          <BookOpen className="text-slate-900" size={16} />
          <h3 className="text-xs font-bold text-slate-900 font-sans">ارزیابی و آزمون کلاسی</h3>
        </div>

        {role === 'teacher' && (
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
            <button 
              onClick={() => setActiveTab('quizzes')}
              className={`px-3 py-1 text-xs rounded-md transition-colors cursor-pointer ${activeTab === 'quizzes' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500'}`}
              id="tab-teacher-quizzes"
            >
              مدیریت آزمون‌ها
            </button>
            <button 
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-1 text-xs rounded-md transition-colors cursor-pointer ${activeTab === 'stats' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500'}`}
              id="tab-teacher-stats"
            >
              نمودار عملکرد نتایج
            </button>
          </div>
        )}
      </div>

      {role === 'teacher' ? (
        activeTab === 'quizzes' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-right font-sans">
            {/* Left Box: Active Quizzes List */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">لیست آزمون‌های فعال و پیش‌نویس</h4>
              
              {quizzes.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                  <p className="text-xs font-sans">هنوز هیچ آزمونی طراحی نکرده‌اید.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quizzes.map((quiz) => {
                    const quizSubmissionsCount = submissions.filter(s => s.isGraded).length; // Simulated class count
                    return (
                      <div key={quiz.id} className="p-3.5 bg-white rounded-lg border border-slate-200/80 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => onToggleQuiz(quiz.id)}
                            className={`px-2 py-0.5 rounded text-[9px] font-semibold transition-colors cursor-pointer ${
                              quiz.isActive 
                                ? 'bg-slate-900 text-white' 
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {quiz.isActive ? 'در حال برگزاری' : 'متوقف شده'}
                          </button>
                          <span className="text-[9px] text-slate-400 font-sans flex items-center gap-0.5">
                            <Clock size={10} /> {quiz.durationMinutes} دقیقه
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold text-slate-800 font-sans">{quiz.title}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5 font-sans">
                            شامل {quiz.questions.length} سوال • {quizSubmissionsCount} پاسخ ثبت شده
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Box: Setup/Add New Quiz */}
            <form onSubmit={saveQuiz} className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center justify-end gap-1 font-sans">
                طراحی فوری آزمون جدید
                <Plus size={14} className="text-slate-800" />
              </h4>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 font-sans">عنوان آزمون</label>
                <input 
                  type="text" 
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                  placeholder="مثال: کوییز فیزیک فصل اول" 
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-right focus:outline-none focus:border-slate-800 font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">زمان (دقیقه)</label>
                  <input 
                    type="number" 
                    min="1"
                    max="180"
                    value={newQuizDuration}
                    onChange={(e) => setNewQuizDuration(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center focus:outline-none focus:border-slate-800 font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 font-sans">نوع سوال انتخابی</label>
                  <select 
                    value={currentQuestionType}
                    onChange={(e) => setCurrentQuestionType(e.target.value as any)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-right focus:outline-none focus:border-slate-800 font-sans cursor-pointer"
                  >
                    <option value="multiple-choice">تستی (۴ گزینه‌ای)</option>
                    <option value="written">تشریحی (توضیحی)</option>
                  </select>
                </div>
              </div>

              {/* Question Text Input */}
              <div className="space-y-1.5 bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/60 text-right">
                <label className="text-[11px] font-bold text-slate-800 font-sans">صورت سوال</label>
                <textarea 
                  value={currentQuestionText}
                  onChange={(e) => setCurrentQuestionText(e.target.value)}
                  placeholder="صورت سوال را در این بخش بنویسید..." 
                  className="w-full h-14 p-2 text-xs bg-white border border-slate-200 rounded-lg text-right focus:outline-none focus:border-slate-800 resize-none font-sans"
                />

                {/* MCQ Extra Fields */}
                {currentQuestionType === 'multiple-choice' && (
                  <div className="space-y-2 pt-2 text-right">
                    <span className="text-[10px] text-slate-400 font-bold block">گزینه‌های پاسخ و انتخاب گزینه درست</span>
                    {options.map((opt, i) => (
                      <div key={i} className="flex gap-2 items-center flex-row-reverse">
                        <input 
                          type="radio" 
                          name="correct_answer" 
                          checked={correctOptionIndex === i}
                          onChange={() => setCorrectOptionIndex(i)}
                          className="accent-slate-950 cursor-pointer"
                          title="گزینه صحیح"
                        />
                        <input 
                          type="text" 
                          value={opt}
                          onChange={(e) => handleOptionChange(i, e.target.value)}
                          placeholder={`گزینه ${i + 1}`} 
                          className="w-full px-2 py-1 text-[11px] bg-white border border-slate-200 rounded text-right focus:outline-none"
                          required={currentQuestionType === 'multiple-choice'}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <button 
                  type="button"
                  onClick={addQuestionToBuilder}
                  className="w-full mt-2 py-1.5 bg-slate-100 text-slate-800 hover:bg-slate-200 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus size={11} /> افزودن این سوال به لیست آزمون
                </button>
              </div>

              {/* Added Questions List in Builder */}
              {questions.length > 0 && (
                <div className="space-y-2 text-right">
                  <p className="text-[11px] font-bold text-slate-500">سوالات اضافه شده ({questions.length})</p>
                  <div className="max-h-32 overflow-y-auto space-y-1.5">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="p-2 bg-slate-50 rounded border border-slate-250 flex items-center justify-between text-[11px] flex-row-reverse">
                        <button 
                          type="button"
                          onClick={() => removeQuestionFromBuilder(idx)}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                        <p className="text-right truncate font-medium text-slate-700 pr-1">{idx + 1}. {q.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
              >
                <Check size={14} /> انتشار نهایی آزمون
              </button>
            </form>
          </div>
        ) : (
          renderStatsCharts()
        )
      ) : (
        /* STUDENTS CORNER */
        <div className="space-y-4 font-sans text-right">
          {activeAnsweringQuizId ? (
            // Form answering active quiz!
            (() => {
              const quiz = quizzes.find(q => q.id === activeAnsweringQuizId);
              if (!quiz) return null;
              return (
                <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center border-b border-indigo-50 pb-3">
                    <span className="text-[10px] text-slate-400 font-sans flex items-center gap-0.5">
                      <Clock size={11} /> {quiz.durationMinutes} دقیقه زمان پاسخگویی
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 font-sans">{quiz.title}</h4>
                  </div>

                  <div className="space-y-4 pt-1 max-h-96 overflow-y-auto pr-1">
                    {quiz.questions.map((q, qidx) => (
                      <div key={q.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-right space-y-3">
                        <p className="text-xs font-bold text-slate-800">
                          {qidx + 1}. {q.text}
                          <span className="text-[9px] text-slate-500 mr-2 bg-slate-200/60 px-1.5 py-0.5 rounded font-sans">
                            {q.type === 'multiple-choice' ? 'تستی' : 'تشریحی'}
                          </span>
                        </p>

                        {q.type === 'multiple-choice' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-right">
                            {q.options?.map((opt, oindex) => (
                              <label 
                                key={oindex} 
                                className={`p-2 bg-white rounded-lg border text-[11px] cursor-pointer flex justify-between items-center transition-all flex-row-reverse ${
                                  studentAnswers[q.id] === oindex 
                                    ? 'border-slate-900 bg-slate-900 text-white font-medium' 
                                    : 'border-slate-200 hover:bg-slate-150'
                                }`}
                              >
                                <input 
                                  type="radio" 
                                  name={`student_q_${q.id}`}
                                  checked={studentAnswers[q.id] === oindex}
                                  onChange={() => setStudentAnswers({ ...studentAnswers, [q.id]: oindex })}
                                  className="accent-slate-950"
                                />
                                <span className="pr-1">{opt}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <textarea 
                            value={studentAnswers[q.id] as string || ''}
                            onChange={(e) => setStudentAnswers({ ...studentAnswers, [q.id]: e.target.value })}
                            placeholder="متن تشریحی پاسخ خود را اینجا بنویسید..." 
                            className="w-full h-18 p-2.5 text-xs bg-white border border-slate-200 rounded-lg text-right focus:outline-none focus:border-slate-800 font-sans"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button 
                      onClick={() => setActiveAnsweringQuizId(null)}
                      className="px-4 py-2 text-xs bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 cursor-pointer"
                    >
                      انصراف و بستن
                    </button>
                    <button 
                      onClick={() => submitAnswersToTeacher(quiz)}
                      className="px-5 py-2 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send size={11} /> ثـبت نهایی و تحویل برگه
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            // Select interactive quiz
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">کوییزها و امتحانات ارسالی معلم</h4>
              
              {quizzes.filter(q => q.isActive).length === 0 ? (
                <div className="p-8 bg-white border border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                  <p className="text-xs font-sans">در حال حاضر آزمون فعالی برای برگزاری وجود ندارد.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {quizzes.filter(q => q.isActive).map((quiz) => {
                    const alreadySubmitted = submissions.some(s => s.studentId === studentId);
                    return (
                      <div key={quiz.id} className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col justify-between hover:bg-slate-50/50 transition-all">
                        <div className="space-y-1 text-right">
                          <p className="text-xs font-bold text-slate-800 font-sans">{quiz.title}</p>
                          <p className="text-[9px] text-slate-400 font-sans">تعداد سوال: {quiz.questions.length} • زمان: {quiz.durationMinutes} دقیقه</p>
                        </div>
                        
                        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                          {alreadySubmitted ? (
                            <span className="text-[9px] text-slate-700 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-slate-200">
                              <CheckCircle2 size={10} /> آزمون ثبت شده
                            </span>
                          ) : (
                            <button 
                              onClick={() => {
                                setStudentAnswers({});
                                setActiveAnsweringQuizId(quiz.id);
                              }}
                              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={10} /> شروع حل آزمون
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
