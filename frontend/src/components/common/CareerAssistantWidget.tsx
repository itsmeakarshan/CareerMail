import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Minus, Maximize2, Send, Bot, Eye, Clock, Calendar, FileText, User as UserIcon } from 'lucide-react';
import { assistantApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const CareerAssistantWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Arjun';

  const quickPrompts = [
    { text: 'Show my applications', icon: Eye },
    { text: 'Which applications need follow-up?', icon: Clock },
    { text: 'When is my next interview?', icon: Calendar },
    { text: 'Show rejected applications', icon: FileText },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || query;
    if (!messageText.trim() || loading) return;

    const userMsg: Message = {
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await assistantApi.ask(messageText, window.location.pathname);
      const assistantMsg: Message = {
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        sender: 'assistant',
        text: `Sorry, I ran into an issue retrieving that data. (${err.message})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl shadow-glow-purple flex items-center gap-2 transition-all hover:scale-105"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-semibold tracking-tight">Career Assistant</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-5 right-5 z-40 w-96 bg-[#101626] border border-[#1e2640] rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 flex flex-col ${
        isMinimized ? 'h-14' : 'h-[470px]'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-[#131b2e] border-b border-[#1e2640] flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white tracking-tight">Career Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-slate-800/80 rounded-md text-slate-400 hover:text-white transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-slate-800/80 rounded-md text-slate-400 hover:text-white transition-colors"
            title="Close"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages / Prompts Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="flex flex-col">
                  <h4 className="text-base font-bold text-white">Hi {firstName}! 👋</h4>
                  <p className="text-xs text-slate-400 mt-0.5">How can I help you today?</p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  {quickPrompts.map((prompt, idx) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSend(prompt.text)}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl bg-[#141b2d] hover:bg-[#18223c] border border-slate-800/80 hover:border-purple-500/40 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-2.5 group"
                      >
                        <Icon className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                        <span>{prompt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.sender === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/40 text-violet-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-xl text-xs max-w-[82%] leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-purple-600 text-white rounded-br-none'
                        : 'bg-[#141b2d] text-slate-200 border border-slate-800 rounded-bl-none whitespace-pre-line'
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.sender === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-purple-300 py-1">
                <Bot className="w-4 h-4 animate-spin text-purple-400" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-[#131b2e] border-t border-[#1e2640]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 bg-[#0c101d] border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-purple-500 transition-colors"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything about your career..."
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="w-7 h-7 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center disabled:opacity-40 transition-all hover:opacity-90 flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
