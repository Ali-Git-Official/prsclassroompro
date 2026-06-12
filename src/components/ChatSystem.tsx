import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Sparkles, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { ChatMessage, Role } from '../types';

interface ChatSystemProps {
  role: Role;
  userId: string;
  userName: string;
  userAvatar: string;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onDeleteMessage?: (id: string) => void;
}

export default function ChatSystem({
  role,
  userId,
  userName,
  userAvatar,
  messages,
  onSendMessage,
  onDeleteMessage
}: ChatSystemProps) {
  const [text, setText] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Student Quick Chat Shortcuts
  const quickMessages = [
    'متوجه شدم، ممنون استاد 🌸',
    'استاد میشه این قسمت رو دوباره توضیح بدید؟',
    'جزوه فصل رو کجا دانلود کنیم؟',
    'بله، پاسخ درسته ☑️',
    'من سوال تستی رو جواب دادم',
  ];

  // Auto scroll messages locally without scrolling the whole page
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText('');
  };

  const handleQuickSend = (msgText: string) => {
    onSendMessage(msgText);
  };

  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className={`bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-xs transition-all duration-300 ${
      isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-screen rounded-none bg-white' : 'h-[290px]'
    }`} id="prs-chat-system">
      {/* Small Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center text-right font-sans">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping"></span>
            زنده / آنلاین
          </span>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
            title={isFullscreen ? "خروج از تمام صفحه" : "تمام صفحه گفتگو"}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <MessageSquare size={15} className="text-slate-800" />
          <span className="text-xs font-bold text-slate-900">گفتگوی گروهی کلاس آنلاین</span>
        </div>
      </div>

      {/* Messages Scroll Panel */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/20 scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center font-sans">
            <MessageSquare size={24} className="text-slate-300 mb-1" />
            <p className="text-[11px]">اولین پیام کلاسی را ثبت کنید.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === userId;
            const isTeacherMsg = msg.senderRole === 'teacher';

            return (
              <div 
                key={msg.id} 
                className={`flex gap-2.5 items-start ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                {msg.avatar && (msg.avatar.startsWith('http') || msg.avatar.startsWith('data:')) ? (
                  <img 
                    src={msg.avatar} 
                    alt={msg.senderName} 
                    className="w-7 h-7 rounded-full border border-slate-200 shadow-xs object-cover mt-0.5"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-xs shadow-xs select-none mt-0.5 shrink-0">
                    {msg.avatar || '🎓'}
                  </div>
                )}

                {/* Bubble details */}
                <div className={`max-w-[78%] text-right font-sans relative group ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5 justify-end">
                    <span className="text-[9px] text-slate-400 font-sans">{msg.timestamp}</span>
                    <span className={`text-[10px] font-bold ${isTeacherMsg ? 'text-slate-900' : 'text-slate-700'}`}>
                      {msg.senderName} {isTeacherMsg && '👑 (معلم)'}
                    </span>
                  </div>

                  {/* Speech Block */}
                  <div className="relative group">
                    <div className={`p-2.5 rounded-xl text-xs space-y-1 ${
                      isTeacherMsg 
                        ? 'bg-slate-900 text-white rounded-tr-none' 
                        : isMe 
                          ? 'bg-slate-700 text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none shadow-xs'
                    }`}>
                      <p className="leading-relaxed whitespace-pre-wrap font-sans text-start animate-fade-in" dir="auto">{msg.text}</p>
                    </div>

                    {/* Delete button (Trash2 icon) visible on hover or focus */}
                    {onDeleteMessage && (role === 'teacher' || isMe) && (
                      <button
                        type="button"
                        onClick={() => onDeleteMessage(msg.id)}
                        className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-600 bg-white rounded border border-slate-200 cursor-pointer shadow-2xs mr-1"
                        title="حذف این پیام"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick shortcuts panel for student comfort */}
      {role === 'student' && (
        <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none scroll-smooth select-none font-sans">
          {quickMessages.map((qm, qi) => (
            <button 
              key={qi}
              onClick={() => handleQuickSend(qm)}
              className="px-2.5 py-1 text-[10px] bg-white border border-slate-200 hover:border-slate-800 rounded-full text-slate-700 transition-colors pointer-events-auto cursor-pointer"
            >
              {qm}
            </button>
          ))}
        </div>
      )}

      {/* Input controls form */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 flex gap-2">
        <button 
          type="submit"
          className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer"
          id="btn-send-message"
        >
          <Send size={14} className="rotate-180" />
        </button>
        <input 
          type="text" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="پیام یا پاسخی بنویسید..."
          dir="auto"
          className="flex-1 px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-start focus:outline-none focus:border-slate-800 font-sans"
          id="chat-input-text"
        />
      </form>
    </div>
  );
}
